import { deepEquals       } from '../utils/deep-equals.js';
import { SetMap           } from '../utils/set-map.js';
import { Watchable        } from './watchable.js';
import { componentSchemas } from './schema.js';

/**
 * @import { Stage, ComponentTypeKey, ComponentDataMap, ComponentDataMapSerialized, ComponentEventMap } from './ecs.d.ts';
 * @typedef {Watchable<ComponentEventMap[string]>} ComponentEvent
 */

/**
 * @template {string} [K=any]
 * @extends {Watchable<ComponentEventMap[K]>}
 */
export class Component extends Watchable {
    #stage;

    /** @type {string} */
    #entity;
    /** @type {string} */
    #type;
    /** @type {string|undefined} */
    #owner;

    /** @type {ComponentDataMap[K]['references']} */
    #references;

    /** @type {ComponentDataMap[K]['value']} */
    #value; // we need to use a symbol because we can't pass the private field name to the schema

    /**
     * @param {Stage} stage
     * @param {{type: K } & ComponentDataMapSerialized[K]} componentData
     */
    constructor(stage, componentData) {
        super();

        this.#stage = stage;

        const { entity, type, owner, value } = componentData;

        this.#entity = entity;
        this.#type   = type;
        this.#owner  = owner;

        this.#references = (componentSchemas[type]?.hasReference ? {} : undefined);
        this.#value      = (componentSchemas[type] ? componentSchemas[type].deserialize(this, value) : value);
    }

    get stage() {
        return this.#stage;
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

    get references() {
        return this.#references;
    }

    /**
     * @return {ComponentDataMap[K]['value']}
     */
    get value() {
        return this.#value;
    }

    /**
     * @param {ComponentDataMapSerialized[K]['value']} value
     */
    set value(value) {
        if(deepEquals(this.#value, value)) return;

        const schema = componentSchemas[this.type];

        if(schema) {
            this.#value = schema.updateValue(this, this.#value, value);
        } else {
            this.#value = value;
        }

        this.notify('value:change');
    }

    /**
     * @return {ComponentDataMapSerialized[K]}
     */
    toJSON() {
        const value = componentSchemas[this.type] ? componentSchemas[this.type].serialize(this.value) : this.value;
        return { entity: this.#entity, type: this.#type, value };
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
*  [K in ComponentTypeKey as `component:add:${string}:${K}`]:  Component<K>;
* } & {
*  [K in ComponentTypeKey as `component:delete:${string}:${K}`]:  Component<K>;
* }} ComponentEvents
*/

/**
 * @extends {Watchable<EntityEvents & ComponentEvents>}
 */
export class ComponentSet extends Watchable {
    #register;
    #unregister;

    /** @type {Set<Component>} */
    #set = new Set();

    #indexes = /** @type {const} */({
        'entity':       /** @type {SetMap<string, Component>} */(new SetMap()),
        'type':         /** @type {SetMap<string, Component>} */(new SetMap()),
        'owner':        /** @type {SetMap<string, Component>} */(new SetMap()),
        'owner:type':   /** @type {SetMap<string, Component>} */(new SetMap()),
        'owner:entity': /** @type {SetMap<string, Component>} */(new SetMap()),

        'entity:type':  /** @type {Map<string, Component>} */(new Map()),
    });

    [Symbol.iterator]() {
        return this.#set[Symbol.iterator]();
    }

    /**
     * @param {{ register: (component: Component) => void, unregister: (component: Component) => void }} registrationHandlers
     */
    constructor({ register, unregister }) {
        super();
        this.#register   = register;
        this.#unregister = unregister;
    }

    /**
     * @template {Component} C
     * @param {C} component
     */
    add(component) {
        const { entity, type, owner } = component;

        if(this.#indexes['entity:type'].has(`${entity}:${type}`)) throw new Error('Entity can only contain one component of a given type');


        this.#indexes['entity'].add(entity, component);
        this.#indexes['type'].add(type, component);

        if(owner) {
            this.#indexes['owner'].add(owner, component);
            this.#indexes['owner:type'].add(`${owner}:${type}`, component);
            this.#indexes['owner:entity'].add(`${owner}:${entity}`, component);
        }

        this.#indexes['entity:type'].set(`${entity}:${type}`, component);

        this.#set.add(component);

        this.notify(`component:add`, component);
        this.notify(`component:add:${entity}`, component);
        this.notify(`component:add:${entity}:${type}`, component);

        this.#register(component);

        if(this.#indexes['entity'].get(entity)?.size === 1) {
            this.notify(`entity:add`, entity);
            this.notify(`entity:add:${entity}`, entity);
        }

        return component;
    }

    /**
     * @param {{ type: string, entity: string }} componentData
     */
    delete(componentData) {
        const component = this.find(componentData);

        if(!component) return false;

        const { entity, type, owner } = component;

        this.#unregister(component);

        this.#indexes['entity'].delete(entity, component);
        this.#indexes['type'].delete(type, component);

        if(owner) {
            this.#indexes['owner'].delete(owner, component);
            this.#indexes['owner:type'].delete(`${owner}:${type}`, component);
            this.#indexes['owner:entity'].delete(`${owner}:${entity}`, component);
        }

        this.#indexes['entity:type'].delete(`${entity}:${type}`);

        this.#set.delete(component);

        this.notify(`component:delete`, component);
        this.notify(`component:delete:${entity}`, component);
        this.notify(`component:delete:${entity}:${type}`, (component));

        if(!this.#indexes['entity'].get(entity)) {
            this.notify(`entity:delete`, entity);
            this.notify(`entity:delete:${entity}`, entity);
        }

        return true;
    }

    /**
     * @template {string} K
     *
     * @overload
     * @param {{ entity: string, owner?: string, predicate?: (component: Component) => boolean }} options
     * @return {Generator<Component>}
     *
     * @overload
     * @param {{ type: K, owner?: string, predicate?: (component: Component<K>) => boolean }} options
     * @return {Generator<Component<K>>}
     *
     * @overload
     * @param {{ owner: string, predicate?: (component: Component) => boolean }} options
     * @return {Generator<Component>}
     *
     * @overload
     * @param {{ predicate: (component: Component) => boolean }} options
     * @return {Generator<Component>}
     *
     * @param {{ entity?: string, type?: string, owner?: string, predicate?: (component: Component) => boolean }} options
     */
    * #iterateBy({ entity, type, owner, predicate }) {
        let set;
        if(owner && entity) {
            set = this.#indexes['owner:entity'].get(`${owner}:${entity}`);
        } else if(owner && type) {
            set = this.#indexes['owner:type'].get(`${owner}:${type}`);
        } else if(entity) {
            set = this.#indexes['entity'].get(entity);
        } else if(type) {
            set = this.#indexes['type'].get(type);
        } else if(owner) {
            set = this.#indexes['owner'].get(owner);
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
     * @template {string} K
     *
     * @overload
     * @param {{ entity: string, type: K, predicate?: (component: Component<K>) => boolean }} options
     * @return {Component<K>|null}
     *
     * @overload
     * @param {{ entity: string, owner?: string, predicate?: (component: Component) => boolean }} options
     * @return {Generator<Component>}
     *
     * @overload
     * @param {{ type: K, owner?: string, predicate?: (component: Component<K>) => boolean }} options
     * @return {Generator<Component<K>>}
     *
     * @overload
     * @param {{ owner: string, predicate?: (component: Component) => boolean }} options
     * @return {Generator<Component>}
     *
     * @overload
     * @param {{ predicate: (component: Component) => boolean }} options
     * @return {Generator<Component>}
     *
     * @param {{ entity?: string, type?: string, owner?: string, predicate?: (component: Component) => boolean }} options
     */
    find({ entity, type, owner, predicate }) {
        if(entity && type) {
            const component = this.#indexes['entity:type'].get(`${entity}:${type}`);
            return (component && (!predicate || predicate(component))) ? component : null;
        } else if (owner && entity) {
            return this.#iterateBy({ owner, entity, predicate });
        } else if(owner && type) {
            return this.#iterateBy({ owner, type, predicate });
        } else if (entity) {
            return this.#iterateBy({ entity, predicate });
        } else if(type) {
            return this.#iterateBy({ type, predicate });
        } else if(owner) {
            return this.#iterateBy({ owner, predicate });
        } else if(predicate) {
            return this.#iterateBy({ predicate });
        }
    }

    /**
     * @template {string} K
     *
     * @overload
     * @param {{ entity: string, type: K, predicate?: (component: Component<K>) => boolean }} options
     * @return {number}
     *
     * @overload
     * @param {{ entity: string, owner?: string, predicate?: (component: Component) => boolean }} options
     * @return {number}
     *
     * @overload
     * @param {{ type: K, owner?: string, predicate?: (component: Component<K>) => boolean }} options
     * @return {number}
     *
     * @overload
     * @param {{ owner: string, predicate?: (component: Component) => boolean }} options
     * @return {number}
     *
     * @overload
     * @param {{ predicate: (component: Component) => boolean }} [options]
     * @return {number}
     *
     * @param {{ entity?: string, type?: string, owner?: string, predicate?: (component: Component) => boolean }} [options]
     */
    count({ entity, type, owner, predicate } = {}) {
        let count = 0;
        let set;

        if(entity && type) {
            const component = this.#indexes['entity:type'].get(`${entity}:${type}`);
            return (component && (!predicate || predicate(component))) ? 1 : 0;
        } else if(owner && entity) {
            set = this.#indexes['owner:entity'].get(`${owner}:${entity}`);
        } else if(owner && type) {
            set = this.#indexes['owner:type'].get(`${owner}:${type}`);
        } else if(entity) {
            set = this.#indexes['entity'].get(entity);
        } else if(type) {
            set = this.#indexes['type'].get(type);
        } else if(owner) {
            set = this.#indexes['owner'].get(owner);
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
     * @template {string} K
     *
     * @overload
     * @param {{ entity: string, type: K, predicate?: (component: Component<K>) => boolean }} options
     * @return {boolean}
     *
     * @overload
     * @param {{ entity: string, owner?: string, predicate?: (component: Component) => boolean }} options
     * @return {boolean}
     *
     * @overload
     * @param {{ type: K, owner?: string, predicate?: (component: Component<K>) => boolean }} options
     * @return {boolean}
     *
     * @overload
     * @param {{ owner: string, predicate?: (component: Component) => boolean }} options
     * @return {boolean}
     *
     * @overload
     * @param {{ predicate: (component: Component) => boolean }} options
     * @return {boolean}
     *
     * @param {{ entity?: string, type?: string, owner?: string, predicate?: (component: Component) => boolean }} options
     */
    has({ entity, type, owner, predicate }) {
        let set;

        if(entity && type) {
            const component = this.#indexes['entity:type'].get(`${entity}:${type}`);
            return !!component && (!predicate || predicate(component));
        } else if(owner && entity) {
            set = this.#indexes['owner:entity'].get(`${owner}:${entity}`);
        } else if(owner && type) {
            set = this.#indexes['owner:type'].get(`${owner}:${type}`);
        } else if(entity) {
            set = this.#indexes['entity'].get(entity);
        } else if(type) {
            set = this.#indexes['type'].get(type);
        } else if(owner) {
            set = this.#indexes['owner'].get(owner);
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
