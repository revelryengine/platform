import { Watchable } from './watchable.js';
import { SetMap    } from '../deps/utils.js';
import { Component } from './component.js';

/**
 * @import { Stage } from './ecs.js';
 */

/**
 * @typedef {{ referer: { entity: string, type: string }, count: number }} ComponentReferenceEvent
 * @typedef {{
 *    'reference:add':     ComponentReferenceEvent,
 *    'reference:release': ComponentReferenceEvent,
 *    [key: `reference:add:${string}`]:               ComponentReferenceEvent,
 *    [key: `reference:add:${string}:${string}`]:     ComponentReferenceEvent,
 *    [key: `reference:release:${string}`]:           ComponentReferenceEvent,
 *    [key: `reference:release:${string}:${string}`]: ComponentReferenceEvent,
 * }} ComponentReferenceEvents
 */

/**
 * A component reference object used to resolve components that may not exist yet.
 *
 * @template {string} [K = any]
 * @extends {Watchable<{ abort: void, release: void, resolve: Component<K>, destroy: void }>}
 */
export class ComponentReference extends Watchable {
    #referer;
    #entity;
    #type;

    #aborted   = false;
    #released  = false;
    #destroyed = false;

    /**
     * @type {Component<K>|null}
     */
    #component = null;

    /**
     * @param {{ entity: string, type: string }} referer
     * @param {{ entity: string, type: K }} componentData
     */
    constructor(referer, { entity, type }) {
        super();
        this.#referer    = referer;
        this.#entity     = entity;
        this.#type       = type;
    }

    /**
     * @type {'resolved'|'destroyed'|'released'|'aborted'|'pending'}
     */
    get state() {
        if(this.#aborted)   return 'aborted';
        if(this.#released)  return 'released';
        if(this.#destroyed) return 'destroyed';
        if(this.#component) return 'resolved';
        return 'pending';
    }

    get referer() {
        return this.#referer;
    }

    get entity() {
        return this.#entity;
    }

    get type() {
        return this.#type;
    }

    get component() {
        return this.#component;
    }

    abort() {
        if(!this.#aborted) {
            this.#aborted = true;
            this.notify('abort');
        }
    }

    release() {
        if(!this.#released) {
            if(!this.#component) {
                this.abort();
            }
            this.#released = true;
            this.notify('release');
        }
    }

    destroy() {
        if(!this.#destroyed) {
            this.#destroyed = true;
            this.notify('destroy');
        }
    }

    /**
     * @param {Component<K>} component
     */
    resolve(component) {
        this.#component = component;
        this.notify('resolve', component);
    }

    async get() {
        if(this.#component) {
            return this.#component;
        }

        if(this.state !== 'pending'){
            throw new Error(`ComponentReference is in an unepxected state of ${this.state}`);
        }

        const abortCtl = new AbortController();
        const signal   = abortCtl.signal;

        this.watch('release', { signal, once: true, handler: () => abortCtl.abort() });
        this.watch('destroy', { signal, once: true, handler: () => abortCtl.abort() });

        return this.waitFor('resolve', signal).then((component) => {
            abortCtl.abort();
            return component;
        });
    }
}

/**
 * @extends {Watchable<ComponentReferenceEvents>}
 */
export class ComponentReferenceSet extends Watchable {
    #stage;

    /** @type {Set<ComponentReference>} */
    #set = new Set();

    /** @type {SetMap<string, ComponentReference>} */
    #byEntity = new SetMap();

    /** @type {SetMap<`${string}:${string}`, ComponentReference>} */
    #byComponent = new SetMap();

    [Symbol.iterator]() {
        return this.#set[Symbol.iterator]();
    }

    /**
     * @param {Stage} stage
     */
    constructor(stage) {
        super();
        this.#stage = stage;
    }

    /**
     * @template {string} T
     * @param {{ entity: string, type: string }} referer
     * @param {{ entity: string, type: T }} componentData
     * @return {ComponentReference<T>}
     */
    create(referer, { entity, type }) {
        const reference = new ComponentReference(referer, { entity, type });

        this.#resolve(reference);

        this.#set.add(reference);
        this.#byEntity.add(entity, reference);
        this.#byComponent.add(`${entity}:${type}`, reference);

        this.notify(`reference:add`,                   { referer, count: this.#set.size                               });
        this.notify(`reference:add:${entity}`,         { referer, count: this.#byEntity.count(entity)                 });
        this.notify(`reference:add:${entity}:${type}`, { referer, count: this.#byComponent.count(`${entity}:${type}`) });

        reference.watch('release', () => this.#release(reference));
        reference.watch('destroy', () => this.#release(reference));

        return reference;
    }

    /**
     * @template {string} T
     * @param {ComponentReference<T>} reference
     */
    #resolve(reference) {
        const { entity, type, referer } = reference;

        const abortCtl = new AbortController();
        const signal   = abortCtl.signal;

        this.#stage.components.watch(`component:delete:${referer.entity}:${referer.type}`, { once: true, signal, handler: () => reference.release() });
        this.#stage.components.watch(`component:delete:${entity}:${type}`,                 { once: true, signal, handler: () => reference.destroy() });

        reference.watch('release', { once: true, signal, handler: () => abortCtl.abort() });
        reference.watch('destroy', { once: true, signal, handler: () => abortCtl.abort() });

        const component = this.#stage.components.find(reference);

        if(component) {
            reference.resolve(component);
        } else {
            this.#stage.components.watch(`component:add:${entity}:${type}`, { once: true, signal, handler: (component) => reference.resolve(component) });
        }
    }

    /**
     *
     * @param {ComponentReference} reference
     */
    #release(reference) {
        const { entity, type, referer } = reference;

        this.#set.delete(reference);
        this.#byEntity.delete(entity, reference);
        this.#byComponent.delete(`${entity}:${type}`, reference);

        this.notify(`reference:release`,                   { referer, count: this.#set.size                               });
        this.notify(`reference:release:${entity}`,         { referer, count: this.#byEntity.count(entity)                 });
        this.notify(`reference:release:${entity}:${type}`, { referer, count: this.#byComponent.count(`${entity}:${type}`) });
    }

    /**
     * @template {string} K
     * @overload
     * @param {{ entity: string, type: K, predicate?: (reference: ComponentReference<K>) => boolean }} options
     * @return {Generator<ComponentReference<K>>}
     *
     * @overload
     * @param {{ entity: string, predicate?: (reference: ComponentReference) => boolean }} options
     * @return {Generator<ComponentReference>}
     *
     * @overload
     * @param {{ predicate: (reference: ComponentReference) => boolean }} options
     * @return {Generator<ComponentReference>}
     *
     * @param {{ entity?: string, type?: string, predicate?: (reference: ComponentReference) => boolean }} options
     */
    * #iterateBy({ entity, type, predicate }) {
        let set;

        if(entity && type) {
            set = this.#byComponent.get(`${entity}:${type}`);
        } else if(entity) {
            set = this.#byEntity.get(entity);
        } else {
            set = this.#set;
        }

        if(set) {
            for(const reference of set.values()) {
                if(!predicate || predicate(reference)) {
                    yield reference;
                }
            }
        }
    }

    /**
     * @template {string} K
     * @overload
     * @param {{ entity: string, type: K, predicate?: (reference: ComponentReference) => boolean }} options
     * @return {Generator<ComponentReference<K>>}
     *
     * @overload
     * @param {{ entity: string, predicate?: (reference: ComponentReference) => boolean }} options
     * @return {Generator<ComponentReference>}
     *
     * @overload
     * @param {{ predicate: (reference: ComponentReference) => boolean }} options
     * @return {Generator<ComponentReference>}
     *
     * @param {{ entity?: string, type?: string, predicate?: (reference: ComponentReference) => boolean }} options
     */
    find({ entity, type, predicate }) {
        if(entity && type) {
            return this.#iterateBy({ entity, type, predicate });
        } else if(entity) {
            return this.#iterateBy({ entity, predicate });
        } else if(predicate) {
            return this.#iterateBy({ predicate });
        }
    }

    /**
     * @template {string} K
     * @overload
     * @param {{ entity: string, type: K, predicate?: (reference: ComponentReference) => boolean }} options
     * @return {number}
     *
     * @overload
     * @param {{ entity: string, predicate?: (reference: ComponentReference) => boolean }} options
     * @return {number}
     *
     * @overload
     * @param {{ predicate: (reference: ComponentReference) => boolean }} [options]
     * @return {number}
     *
     * @param {{ entity?: string, type?: string, predicate?: (reference: ComponentReference) => boolean }} [options]
     */
    count({ entity, type, predicate } = {}) {
        let count = 0;
        let set;

        if(entity && type) {
            set = this.#byComponent.get(`${entity}:${type}`);
        } else if(entity) {
            set = this.#byEntity.get(entity);
        } else {
            set = this.#set;
        }

        if(set) {
            if(!predicate) {
                count = set.size;
            } else {
                for(const reference of set) {
                    if(predicate(reference)) count++;
                }
            }
        }

        return count;
    }

    /**
     * @template {string} K
     * @overload
     * @param {{ entity: string, type: K, predicate?: (reference: ComponentReference) => boolean }} options
     * @return {boolean}
     *
     * @overload
     * @param {{ entity: string, predicate?: (reference: ComponentReference) => boolean }} options
     * @return {boolean}
     *
     * @template {string} K
     * @overload
     * @param {{ predicate: (reference: ComponentReference) => boolean }} options
     * @return {boolean}
     *
     * @param {{ entity?: string, type?: string, predicate?: (reference: ComponentReference) => boolean }} options
     */
    has({ entity, type, predicate }) {
        let set;

        if(entity && type) {
            set = this.#byComponent.get(`${entity}:${type}`);
        } else if(entity) {
            set = this.#byEntity.get(entity);
        } else {
            set = this.#set;
        }

        if(set) {
            if(!predicate) {
                return true;
            } else {
                for(const reference of set) {
                    if(predicate(reference)) return true;
                }
            }
        }

        return false;
    }
}
