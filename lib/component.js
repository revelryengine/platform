import { SetMap    } from './utils/set-map.js';
import { Watchable } from './utils/watchable.js';

/**
 * @template {Revelry.ECS.ComponentTypeKeys} [K = any]
 * @extends {Watchable<{'value:change': Revelry.ECS.ComponentTypes[K]['value'], 'value:notify': import('./utils/watchable.js').WatchableEventMap }>}
 */
export class Component extends Watchable {
    #entity;

    #owner;

    #type;

    #value;



    /** @type {AbortController|null} */
    #abortCtl = null;

    /**
     * @param {Revelry.ECS.ComponentData<K>} componentData
     */
    constructor(componentData) {
        super();

        const { entity, owner, type, value } = componentData;

        this.#entity = entity;
        this.#owner  = owner;
        this.#type   = type;
        this.#value  = value;

        if(Watchable.isWatchable(this.#value)) {
            this.#abortCtl = new AbortController();
            this.#value.watch({ handler: /** @param {any} events */(events) => this.notify('value:notify', events), deferred: true, signal: this.#abortCtl.signal });
        }
    }

    get entity() {
        return this.#entity;
    }

    get owner() {
        return this.#owner;
    }

    get type() {
        return this.#type;
    }

    get value() {
        return this.#value;
    }

    set value(newValue) {
        const oldValue = this.#value;

        if(oldValue !== newValue) {
            this.#value = newValue;

            this.notify('value:change', oldValue);

            this.#abortCtl?.abort();

            if(Watchable.isWatchable(this.#value)) {
                this.#abortCtl ??= new AbortController();
                this.#value.watch({ handler: /** @param {any} events */(events) => this.notify('value:notify', events), deferred: true, signal: this.#abortCtl.signal });
            }
        }
    }

    cleanup() {
        this.#abortCtl?.abort();
    }

    toJSON() {
        return { entity: this.#entity, type: this.#type, value: this.getJSONValue() };
    }

    /**
     * @return {Revelry.ECS.ComponentTypeMap[K]['json']}
     */
    getJSONValue () {
        return /** @type {{ toJSON?: () => Revelry.ECS.ComponentTypeMap[K]['json'] }} */(this.value)?.toJSON?.() ?? this.value;
    }
}

/**
 * @typedef {{
 *     'entity:add':    string,
 *     'entity:delete': string,
 *     [key: `entity:add:${string}`]:    string,
 *     [key: `entity:delete:${string}`]: string,
 * }} EntityEvents
 */

/**
 * @typedef {{
 *    'component:add':    Component,
 *    'component:delete': Component,
 *    [key: `component:add:${string}`]:  Component,
 *    [key: `component:delete:${string}`]: Component,
 * } & {
 *  [K in Revelry.ECS.ComponentTypeKeys as `component:add:${string}:${K}`]:  Component<K>;
 * } & {
 *  [K in Revelry.ECS.ComponentTypeKeys as `component:delete:${string}:${K}`]:  Component<K>;
 * }} ComponentEvents
 */

/**
 * @typedef {{ referer: { entity: string, type: Revelry.ECS.ComponentTypeKeys }, count: number }} ReferenceEvent
 * @typedef {{
 *    'reference:add':     ReferenceEvent,
 *    'reference:release': ReferenceEvent,
 *    [key: `reference:add:${string}`]:               ReferenceEvent,
 *    [key: `reference:add:${string}:${string}`]:     ReferenceEvent,
 *    [key: `reference:release:${string}`]:           ReferenceEvent,
 *    [key: `reference:release:${string}:${string}`]: ReferenceEvent,
 * }} ReferenceEvents
 */

/**
 * @extends {Watchable<EntityEvents & ComponentEvents>}
 */
export class ComponentSet extends Watchable {

    /** @type {Set<Component>} */
    #set = new Set();

    /** @type {SetMap<string, Component>} */
    #byEntity = new SetMap();

    /** @type {SetMap<Revelry.ECS.ComponentTypeKeys, Component>} */
    #byType = new SetMap();

    /** @type {Map<`${string}:${Revelry.ECS.ComponentTypeKeys}`, Component>} */
    #byComponent = new Map();

    [Symbol.iterator]() {
        return this.#set[Symbol.iterator]();
    }

    /** @type {ComponentReferenceSet} */
    references = new ComponentReferenceSet(this);

    /**
     * @template {Revelry.ECS.ComponentTypeKeys} K
     * @param {Revelry.ECS.ComponentData<K>} componentData
     */
    add(componentData) {
        if(this.#byComponent.has(`${componentData.entity}:${componentData.type}`)) throw new Error('Entity can only contain one component of a given type');

        const component = new Component(componentData);

        this.#byEntity.add(component.entity, component);
        this.#byType.add(component.type, component);
        this.#byComponent.set(`${component.entity}:${component.type}`, component);

        this.#set.add(component);

        this.notify(`component:add`, component);
        this.notify(`component:add:${component.entity}`, component);
        this.notify(`component:add:${component.entity}:${/** @type {unknown} */(component.type)}`, component);

        if(this.#byEntity.get(component.entity)?.size === 1) {
            this.notify(`entity:add`, component.entity);
            this.notify(`entity:add:${component.entity}`, component.entity);
        }

        return component;
    }

    /**
     * @template {Revelry.ECS.ComponentTypeKeys} K
     * @param {{ entity: string, type: K }} componentData
     */
    delete(componentData) {
        const component = this.find(componentData);
        if(!component) return false;

        this.#byEntity.delete(component.entity, component);
        this.#byType.delete(component.type, component);
        this.#byComponent.delete(`${component.entity}:${component.type}`);

        this.#set.delete(component);

        this.notify(`component:delete`, component);
        this.notify(`component:delete:${component.entity}`, component);
        this.notify(`component:delete:${component.entity}:${/** @type {unknown} */(component.type)}`, (component));

        if(!this.#byEntity.get(component.entity)) {
            this.notify(`entity:delete`, component.entity);
            this.notify(`entity:delete:${component.entity}`, component.entity);
        }

        return true;
    }

    /**
     * @overload
     * @param {{ entity: string, predicate?: (component: Component) => boolean }} options
     * @return {Generator<Component>}
     */
    /**
     * @template {Revelry.ECS.ComponentTypeKeys} K
     * @overload
     * @param {{ type: K, predicate?: (component: Component<K>) => boolean }} options
     * @return {Generator<Component<K>>}
     */
    /**
     * @overload
     * @param {{ predicate: (component: Component) => boolean }} options
     * @return {Generator<Component>}
     */
    /**
     * @param {{ entity?: string, type?: Revelry.ECS.ComponentTypeKeys, predicate?: (component: Component) => boolean }} options
     */
    * #iterateBy({ entity, type, predicate }) {
        let set;
        if(entity) {
            set = this.#byEntity.get(entity);
        } else if(type) {
            set = this.#byType.get(type);
        } else {
            set = this.#set;
        }

        if(set) {
            for(const component of set.values()) {
                if(!predicate || predicate(component)) {
                    yield component;
                }
            }
        }
    }

    /**
     * @template {Revelry.ECS.ComponentTypeKeys} K
     *
     * @overload
     * @param {{ entity: string, type: K, predicate?: (component: Component) => boolean }} options
     * @return {Component<K>|null}
     *
     * @overload
     * @param {{ entity: string, predicate?: (component: Component) => boolean }} options
     * @return {Generator<Component>}
     *
     * @overload
     * @param {{ type: K, predicate?: (component: Component<K>) => boolean }} options
     * @return {Generator<Component<K>>}
     *
     * @overload
     * @param {{ predicate: (component: Component) => boolean }} options
     * @return {Generator<Component>}
     *
     * @param {{ entity?: string, type?: Revelry.ECS.ComponentTypeKeys, predicate?: (component: Component) => boolean }} options
     */
    find({ entity, type, predicate }) {
        if(entity && type) {
            const component = this.#byComponent.get(`${entity}:${type}`);
            return (component && (!predicate || predicate(component))) ? component : null;
        } else if (entity) {
            return this.#iterateBy({ entity, predicate });
        } else if(type) {
            return this.#iterateBy({ type, predicate });
        } else if(predicate) {
            return this.#iterateBy({ predicate });
        }
    }

    /**
     * @template {Revelry.ECS.ComponentTypeKeys} K
     * @overload
     * @param {{ entity: string, type: K, predicate?: (component: Component) => boolean }} options
     * @return {number}
     */
    /**
     * @overload
     * @param {{ entity: string, predicate?: (component: Component) => boolean }} options
     * @return {number}
     */
    /**
     * @template {Revelry.ECS.ComponentTypeKeys} K
     * @overload
     * @param {{ type: K, predicate?: (component: Component<K>) => boolean }} options
     * @return {number}
     */
    /**
     * @overload
     * @param {{ predicate: (component: Component) => boolean }} [options]
     * @return {number}
     */
    /**
     * @param {{ entity?: string, type?: Revelry.ECS.ComponentTypeKeys, predicate?: (component: Component) => boolean }} [options]
     */
    count({ entity, type, predicate } = {}) {
        let count = 0;
        let set;

        if(entity && type) {
            const component = this.#byComponent.get(`${entity}:${type}`);
            return (component && (!predicate || predicate(component))) ? 1 : 0;
        } else if(entity) {
            set = this.#byEntity.get(entity);
        } else if(type) {
            set = this.#byType.get(type);
        } else {
            set = this.#set;
        }

        if(set) {
            if(!predicate) {
                count = set.size;
            } else {
                for(const component of set) {
                    if(predicate(component)) count++;
                }
            }
        }

        return count;
    }

    /**
     * @template {Revelry.ECS.ComponentTypeKeys} K
     * @overload
     * @param {{ entity: string, type: K, predicate?: (component: Component) => boolean }} options
     * @return {boolean}
     */
    /**
     * @overload
     * @param {{ entity: string, predicate?: (component: Component) => boolean }} options
     * @return {boolean}
     */
    /**
     * @template {Revelry.ECS.ComponentTypeKeys} K
     * @overload
     * @param {{ type: K, predicate?: (component: Component<K>) => boolean }} options
     * @return {boolean}
     */
    /**
     * @template {Revelry.ECS.ComponentTypeKeys} K
     * @overload
     * @param {{ predicate: (component: Component) => boolean }} options
     * @return {boolean}
     */
    /**
     * @param {{ entity?: string, type?: Revelry.ECS.ComponentTypeKeys, predicate?: (component: Component) => boolean }} options
     */
    has({ entity, type, predicate }) {
        let set;

        if(entity && type) {
            const component = this.#byComponent.get(`${entity}:${type}`);
            return component && (!predicate || predicate(component));
        } else if(entity) {
            set = this.#byEntity.get(entity);
        } else if(type) {
            set = this.#byType.get(type);
        } else {
            set = this.#set;
        }

        if(set) {
            if(!predicate) {
                return true;
            } else {
                for(const component of set) {
                    if(predicate(component)) return true;
                }
            }
        }

        return false;
    }
}

/**
 * A component reference object used to resolve components that may not exist yet.
 *
 * @template {Revelry.ECS.ComponentTypeKeys} [K = any]
 * @extends {Watchable<{ abort: void, release: void, resolve: Component<K>, destroy: void }>}
 */
export class ComponentReference extends Watchable {
    #components;
    #referer;
    #entity;
    #type;

    #abortCtl = new AbortController();

    #aborted   = false;
    #released  = false;
    #destroyed = false;

    /**
     * @type {Component<K>|null}
     */
    #component = null;

    /**
     * @param {ComponentSet} components
     * @param {{ entity: string, type: Revelry.ECS.ComponentTypeKeys }} referer
     * @param {{ entity: string, type: K }} componentData
     */
    constructor(components, referer, { entity, type }) {
        super();
        this.#components = components;
        this.#referer    = referer;
        this.#entity     = entity;
        this.#type       = type;

        this.#resolve();
    }

    async #resolve() {
        const component = this.#components.find({ entity: this.#entity, type: this.#type });

        Promise.race([
            this.#components.waitFor(`component:delete:${this.#referer.entity}:${this.#referer.type}`, this.#abortCtl.signal),
            this.#components.waitFor(`component:delete:${this.#entity}:${this.#type}`, this.#abortCtl.signal),
        ]).then(() => {
            this.#destroyed = true;
            this.notify('destroy');
        }).catch(() => this.#aborted = true);


        if(component) {
            this.#component = component;
        } else {
            try {
                this.#component = /** @type {Component<K>} */(/** @type {unknown} */(await this.#components.waitFor(`component:add:${this.#entity}:${this.#type}`, this.#abortCtl.signal)));
            } catch {
                this.#aborted = true;
                this.notify('abort');

                return;
            }
        }
        this.notify('resolve', this.#component);
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

    release() {
        this.#abortCtl.abort();

        if(!this.#released) {
            this.#released = true;
            this.notify('release');
        }
    }
}

/**
 * @extends {Watchable<ReferenceEvents>}
 */
export class ComponentReferenceSet extends Watchable {
    /** @type {ComponentSet} */
    #components;

    /** @type {Set<ComponentReference>} */
    #set = new Set();

    /** @type {SetMap<string, ComponentReference>} */
    #byEntity = new SetMap();

    /** @type {SetMap<`${string}:${Revelry.ECS.ComponentTypeKeys}`, ComponentReference>} */
    #byComponent = new SetMap();

    [Symbol.iterator]() {
        return this.#set[Symbol.iterator]();
    }

    /**
     * @param {ComponentSet} components
     */
    constructor(components) {
        super();
        this.#components = components;
    }


    /**
     * @template {{ entity: string, type: Revelry.ECS.ComponentTypeKeys }} C
     * @param {{ entity: string, type: Revelry.ECS.ComponentTypeKeys }} referer
     * @param {C} componentData
     * @return {ComponentReference<C['type']>}
     */
    add(referer, { entity, type }) {
        const reference = new ComponentReference(this.#components, referer, { entity, type });

        this.#set.add(reference);
        this.#byEntity.add(entity, reference);
        this.#byComponent.add(`${entity}:${type}`, reference);

        this.notify(`reference:add`,                   { referer, count: this.#set.size                               });
        this.notify(`reference:add:${entity}`,         { referer, count: this.#byEntity.count(entity)                 });
        this.notify(`reference:add:${entity}:${type}`, { referer, count: this.#byComponent.count(`${entity}:${type}`) });

        Promise.race([
            reference.waitFor('release'),
            reference.waitFor('destroy'),
        ]).then(() => {
            this.#set.delete(reference);
            this.#byEntity.delete(entity, reference);
            this.#byComponent.delete(`${entity}:${type}`, reference);

            this.notify(`reference:release`,                   { referer, count: this.#set.size                               });
            this.notify(`reference:release:${entity}`,         { referer, count: this.#byEntity.count(entity)                 });
            this.notify(`reference:release:${entity}:${type}`, { referer, count: this.#byComponent.count(`${entity}:${type}`) });
        });

        return reference;
    }


    /**
     * @template {Revelry.ECS.ComponentTypeKeys} K
     * @overload
     * @param {{ entity: string, type: K, predicate?: (reference: ComponentReference<K>) => boolean }} options
     * @return {Generator<ComponentReference<K>>}
     */
    /**
     * @overload
     * @param {{ entity: string, predicate?: (reference: ComponentReference) => boolean }} options
     * @return {Generator<ComponentReference>}
     */
    /**
     * @overload
     * @param {{ predicate: (reference: ComponentReference) => boolean }} options
     * @return {Generator<ComponentReference>}
     */
    /**
     * @param {{ entity?: string, type?: Revelry.ECS.ComponentTypeKeys, predicate?: (reference: ComponentReference) => boolean }} options
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
     * @template {Revelry.ECS.ComponentTypeKeys} K
     * @overload
     * @param {{ entity: string, type: K, predicate?: (reference: ComponentReference) => boolean }} options
     * @return {Generator<ComponentReference<K>>}
     */
    /**
     * @overload
     * @param {{ entity: string, predicate?: (reference: ComponentReference) => boolean }} options
     * @return {Generator<ComponentReference>}
     */
    /**
     * @overload
     * @param {{ predicate: (reference: ComponentReference) => boolean }} options
     * @return {Generator<ComponentReference>}
     */
    /**
     * @param {{ entity?: string, type?: Revelry.ECS.ComponentTypeKeys, predicate?: (reference: ComponentReference) => boolean }} options
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
     * @template {Revelry.ECS.ComponentTypeKeys} K
     * @overload
     * @param {{ entity: string, type: K, predicate?: (reference: ComponentReference) => boolean }} options
     * @return {number}
     */
    /**
     * @overload
     * @param {{ entity: string, predicate?: (reference: ComponentReference) => boolean }} options
     * @return {number}
     */
    /**
     * @overload
     * @param {{ predicate: (reference: ComponentReference) => boolean }} [options]
     * @return {number}
     */
    /**
     * @param {{ entity?: string, type?: Revelry.ECS.ComponentTypeKeys, predicate?: (reference: ComponentReference) => boolean }} [options]
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
     * @template {Revelry.ECS.ComponentTypeKeys} K
     * @overload
     * @param {{ entity: string, type: K, predicate?: (reference: ComponentReference) => boolean }} options
     * @return {boolean}
     */
    /**
     * @overload
     * @param {{ entity: string, predicate?: (reference: ComponentReference) => boolean }} options
     * @return {boolean}
     */
    /**
     * @template {Revelry.ECS.ComponentTypeKeys} K
     * @overload
     * @param {{ predicate: (reference: ComponentReference) => boolean }} options
     * @return {boolean}
     */
    /**
     * @param {{ entity?: string, type?: Revelry.ECS.ComponentTypeKeys, predicate?: (reference: ComponentReference) => boolean }} options
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
