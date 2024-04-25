import { deepEquals, SetMap } from '../deps/utils.js';
import { Watchable          } from './watchable.js';
import { componentSchemas     } from './schema.js';

/**
 * @import { Stage, ComponentTypeKey, ComponentDataMap, ComponentDataMapSerialized, ComponentValueChangeEventMap } from './ecs.js';
 */

/**
 * @template {string} [K = any]
 * @extends {Watchable<ComponentValueChangeEventMap[K]>}
 */
export class Component extends Watchable {
    #stage;
    #entity;
    #owner;
    #type;

    /**
     * @type {ComponentDataMap[K]['value']}
     */
    #value;

    /**
     * @param {Stage} stage
     * @param {{type: K } & ComponentDataMapSerialized[K]} componentData
     */
    constructor(stage, componentData) {
        super();

        this.#stage = stage;

        const { entity, owner, type, value } = componentData;

        this.#entity = entity;
        this.#owner  = owner;
        this.#type   = type;
        this.#value  = componentSchemas[type] ? componentSchemas[type].deserialize(this, value) : value;
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
        if(value && deepEquals(this.#value, value)) return;

        const schema = componentSchemas[this.type];

        let original;
        if(schema) {
            original = schema.copy(this.#value);

            schema.clearValue(this.#value);

            value = schema.deserialize(this, value);
        } else {
            original = structuredClone(this.value);
        }

        this.#value = value

        this.notify('value:change', original);
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

    /** @type {SetMap<string, Component>} */
    #byEntity = new SetMap();

    /** @type {SetMap<string, Component>} */
    #byType = new SetMap();

    /** @type {Map<`${string}:${string}`, Component>} */
    #byComponent = new Map();

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
     * @template {string} K
     * @param {{ type: K } & Component<K>} component
     */
    add(component) {
        if(this.#byComponent.has(`${component.entity}:${component.type}`)) throw new Error('Entity can only contain one component of a given type');
        this.#byEntity.add(component.entity, component);
        this.#byType.add(component.type, component);
        this.#byComponent.set(`${component.entity}:${component.type}`, component);

        this.#set.add(component);

        this.notify(`component:add`, component);
        this.notify(`component:add:${component.entity}`, component);
        this.notify(`component:add:${component.entity}:${/** @type {unknown} */(component.type)}`, component);

        this.#register(component);

        if(this.#byEntity.get(component.entity)?.size === 1) {
            this.notify(`entity:add`, component.entity);
            this.notify(`entity:add:${component.entity}`, component.entity);
        }

        return component;
    }

    /**
     * @template {string} K
     * @param {{ type: K, entity: string }} componentData
     */
    delete(componentData) {
        const component = this.find(componentData);

        if(!component) return false;

        this.#unregister(component);

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
     * @template {string} K
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
     * @param {{ entity?: string, type?: string, predicate?: (component: Component) => boolean }} options
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
     * @template {string} K
     *
     * @overload
     * @param {{ entity: string, type: K, predicate?: (component: Component<K>) => boolean }} options
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
     * @param {{ entity?: string, type?: string, predicate?: (component: Component) => boolean }} options
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
     * @template {string} K
     * @overload
     * @param {{ entity: string, type: K, predicate?: (component: Component<K>) => boolean }} options
     * @return {number}
     *
     * @overload
     * @param {{ entity: string, predicate?: (component: Component) => boolean }} options
     * @return {number}
     *
     * @template {string} K
     * @overload
     * @param {{ type: K, predicate?: (component: Component<K>) => boolean }} options
     * @return {number}
     *
     * @overload
     * @param {{ predicate: (component: Component) => boolean }} [options]
     * @return {number}
     *
     * @param {{ entity?: string, type?: string, predicate?: (component: Component) => boolean }} [options]
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
     * @template {string} K
     * @overload
     * @param {{ entity: string, type: K, predicate?: (component: Component<K>) => boolean }} options
     * @return {boolean}
     *
     * @overload
     * @param {{ entity: string, predicate?: (component: Component) => boolean }} options
     * @return {boolean}
     *
     * @template {string} K
     * @overload
     * @param {{ type: K, predicate?: (component: Component<K>) => boolean }} options
     * @return {boolean}
     *
     * @template {string} K
     * @overload
     * @param {{ predicate: (component: Component) => boolean }} options
     * @return {boolean}
     *
     * @param {{ entity?: string, type?: string, predicate?: (component: Component) => boolean }} options
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
