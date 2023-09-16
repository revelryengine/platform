import { SetMap    } from './utils/set-map.js';
import { Watchable } from './utils/watchable.js';

/**
 * @template {ComponentTypesDefinition} [T = ComponentTypesDefinition]
 * @template {Extract<keyof T, string>} [K = Extract<keyof T, string>]
 * @extends {Watchable<{'value:change': T[K]['value'], 'value:notify': Map<string, unknown> }>}
 */
export class Component extends Watchable {
    /** @type {string} */
    #entity;

    /** @type {K} */
    #type;

    /** @type {T[K]['value']} */
    #value;

    /** @type {AbortController|null} */
    #abortCtl = null;
    
    /**
     * @param {ComponentData<T, K>} componentData
     */
    constructor(componentData) {
        super();
        
        const { entity, type, value } = componentData;

        this.#entity = entity;
        this.#type   = type;
        this.#value  = value;
        
        if(Watchable.isWatchable(this.#value)) {
            this.#abortCtl = new AbortController();
            this.#value.watch({ handler: (events) => this.notify('value:notify', events), signal: this.#abortCtl.signal });
        }
    }

    get entity() {
        return this.#entity;
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
                this.#value.watch({ handler: (events) => this.notify('value:notify', events), signal: this.#abortCtl.signal });
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
     * @return {ComponentTypeMap<T>[K]['json']}
     */
    getJSONValue () {
        return /** @type {{ toJSON?: () => ComponentTypeMap<T>[K]['json'] }} */(this.value).toJSON?.() ?? this.value;
    }
}

/** 
 * @template {ComponentTypesDefinition} T
 * @typedef {{ 
 *     'entity:add':    string, 
 *     'entity:delete': string, 
 *     [key: `entity:add:${string}`]:    string, 
 *     [key: `entity:delete:${string}`]: string,
 * }} EntityEvents
 */
/** 
 * @template {ComponentTypesDefinition} T
 * @typedef {{ 
 *    'component:add':    Component<T, any>, 
 *    'component:delete': Component<T, any>, 
 *    [key: `component:add:${string}`]:    Component<T, any>,
 *    [key: `component:delete:${string}`]: Component<T, any>,
 * }} ComponentEvents
 */

/** 
 * @typedef {{ referer: string, count: number }} ReferenceEvent
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
 * @template {ComponentTypesDefinition} [T = ComponentTypesDefinition]
 * @extends {Watchable<EntityEvents<T> & ComponentEvents<T>>}
 */
export class ComponentSet extends Watchable {

    /** @type {Set<Component<T>>} */
    #set = new Set();

    /** @type {SetMap<string, Component<T>>} */
    #byEntity = new SetMap();

    /** @type {SetMap<Extract<keyof T, string>, Component<T>>} */
    #byType = new SetMap();

    /** @type {Map<`${string}:${Extract<keyof T, string>}`, Component<T>>} */
    #byComponent = new Map();

    [Symbol.iterator]() {
        return this.#set[Symbol.iterator]();
    }

    /** @type {ComponentReferenceSet<T>} */
    references = new ComponentReferenceSet(this);

    /**
     * @template {ComponentData<T>} C 
     * @param {C} componentData
     * @return {Component<T, C['type']>}
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
        this.notify(`component:add:${component.entity}:${component.type}`, component);

        if(this.#byEntity.get(component.entity)?.size === 1) {
            this.notify(`entity:add`, component.entity);
            this.notify(`entity:add:${component.entity}`, component.entity);
        }

        return component;
    }

    /**
     * @param {{ entity: string, type: Extract<keyof T, string>}} componentData
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
        this.notify(`component:delete:${component.entity}:${component.type}`, component);

        if(!this.#byEntity.get(component.entity)) {
            this.notify(`entity:delete`, component.entity);
            this.notify(`entity:delete:${component.entity}`, component.entity);
        }

        return true;
    }

    /**
     * @overload
     * @param {{ entity: string, predicate?: (component: Component<T>) => boolean }} options
     * @return {Generator<Component<T>>}
     */
    /**
     * @template {Extract<keyof T, string>} K
     * @overload
     * @param {{ type: K, predicate?: (component: Component<T, K>) => boolean }} options
     * @return {Generator<Component<T, K>>}
     */
    /**
     * @overload
     * @param {{ predicate: (component: Component<T>) => boolean }} options
     * @return {Generator<Component<T>>}
     */
    /**
     * @param {{ entity?: string, type?: Extract<keyof T, string>, predicate?: (component: Component<T>) => boolean }} options
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
     * @template {Extract<keyof T, string>} K
     * @overload
     * @param {{ entity: string, type: K, predicate?: (component: Component<T>) => boolean }} options
     * @return {Component<T, K>|undefined}
     */
    /**
     * @overload
     * @param {{ entity: string, predicate?: (component: Component<T>) => boolean }} options
     * @return {Generator<Component<T>>}
     */
    /**
     * @template {Extract<keyof T, string>} K
     * @overload
     * @param {{ type: K, predicate?: (component: Component<T, K>) => boolean }} options
     * @return {Generator<Component<T, K>>}
     */
    /**
     * @overload
     * @param {{ predicate: (component: Component<T>) => boolean }} options
     * @return {Generator<Component<T>>}
     */
    /**
     * @param {{ entity?: string, type?: Extract<keyof T, string>, predicate?: (component: Component<T>) => boolean }} options
     */
    find({ entity, type, predicate }) {
        if(entity && type) {
            const component = this.#byComponent.get(`${entity}:${type}`);
            return (component && (!predicate || predicate(component))) ? component : undefined;
        } else if (entity) {
            return this.#iterateBy({ entity, predicate });
        } else if(type) {
            return this.#iterateBy({ type, predicate });
        } else if(predicate) {
            return this.#iterateBy({ predicate });
        }
    }

    /**
     * @template {Extract<keyof T, string>} K
     * @overload
     * @param {{ entity: string, type: K, predicate?: (component: Component<T>) => boolean }} options
     * @return {number}
     */
    /**
     * @overload
     * @param {{ entity: string, predicate?: (component: Component<T>) => boolean }} options
     * @return {number}
     */
    /**
     * @template {Extract<keyof T, string>} K
     * @overload
     * @param {{ type: K, predicate?: (component: Component<T, K>) => boolean }} options
     * @return {number}
     */
    /**
     * @overload
     * @param {{ predicate: (component: Component<T>) => boolean }} [options]
     * @return {number}
     */
    /**
     * @param {{ entity?: string, type?: Extract<keyof T, string>, predicate?: (component: Component<T>) => boolean }} [options]
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
     * @template {Extract<keyof T, string>} K
     * @overload
     * @param {{ entity: string, type: K, predicate?: (component: Component<T>) => boolean }} options
     * @return {boolean}
     */
    /**
     * @overload
     * @param {{ entity: string, predicate?: (component: Component<T>) => boolean }} options
     * @return {boolean}
     */
    /**
     * @template {Extract<keyof T, string>} K
     * @overload
     * @param {{ type: K, predicate?: (component: Component<T, K>) => boolean }} options
     * @return {boolean}
     */
    /**
     * @template {Extract<keyof T, string>} K
     * @overload
     * @param {{ predicate: (component: Component<T>) => boolean }} options
     * @return {boolean}
     */
    /**
     * @param {{ entity?: string, type?: Extract<keyof T, string>, predicate?: (component: Component<T>) => boolean }} options
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
 * @template {ComponentTypesDefinition} [T = ComponentTypesDefinition]
 * @template {Extract<keyof T, string>} [K = Extract<keyof T, string>]
 * @extends {Watchable<{ abort: void, release: void, resolve: Component<T, K>, destroy: void }>}
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
     * @type {Component<T, K>|null}
     */
    #component = null;

    /**
     * @param {ComponentSet<T>} components 
     * @param {string} referer
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
            this.#components.waitFor(`entity:delete:${this.#referer}`, this.#abortCtl.signal), 
            this.#components.waitFor(`component:delete:${this.#entity}:${this.#type}`, this.#abortCtl.signal),
        ]).then(() => {
            this.#destroyed = true;
            this.notify('destroy');
        }).catch(() => this.#aborted = true);
        
        
        if(component) {
            this.#component = component;
        } else {
            try {
                this.#component = /** @type {Component<T, K>} */(/** @type {unknown} */(await this.#components.waitFor(`component:add:${this.#entity}:${this.#type}`, this.#abortCtl.signal)));
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
 * @template {ComponentTypesDefinition} [T = ComponentTypesDefinition]
 * @extends {Watchable<ReferenceEvents>}
 */
export class ComponentReferenceSet extends Watchable {
    /** @type {ComponentSet<T>} */
    #components;

    /** @type {Set<ComponentReference<T>>} */
    #set = new Set();

    /** @type {SetMap<string, ComponentReference<T>>} */
    #byEntity = new SetMap();

    /** @type {SetMap<`${string}:${Extract<keyof T, string>}`, ComponentReference<T>>} */
    #byComponent = new SetMap();

    [Symbol.iterator]() {
        return this.#set[Symbol.iterator]();
    }

    /**
     * @param {ComponentSet<T>} components
     */
    constructor(components) {
        super();
        this.#components = components;
    }


    /**
     * @template {{ entity: string, type: Extract<keyof T, string> }} C
     * @param {string} referer
     * @param {C} componentData
     * @return {ComponentReference<T, C['type']>}
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
     * @template {Extract<keyof T, string>} K
     * @overload
     * @param {{ entity: string, type: K, predicate?: (reference: ComponentReference<T, K>) => boolean }} options
     * @return {Generator<ComponentReference<T, K>>}
     */
    /**
     * @overload
     * @param {{ entity: string, predicate?: (reference: ComponentReference<T>) => boolean }} options
     * @return {Generator<ComponentReference<T, any>>}
     */
    /**
     * @overload
     * @param {{ predicate: (reference: ComponentReference<T>) => boolean }} options
     * @return {Generator<ComponentReference<T>>}
     */
    /**
     * @param {{ entity?: string, type?: Extract<keyof T, string>, predicate?: (reference: ComponentReference<T>) => boolean }} options
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
     * @template {Extract<keyof T, string>} K
     * @overload
     * @param {{ entity: string, type: K, predicate?: (reference: ComponentReference<T>) => boolean }} options
     * @return {Generator<ComponentReference<T, K>>}
     */
    /**
     * @overload
     * @param {{ entity: string, predicate?: (reference: ComponentReference<T>) => boolean }} options
     * @return {Generator<ComponentReference<T>>}
     */
    /**
     * @overload
     * @param {{ predicate: (reference: ComponentReference<T>) => boolean }} options
     * @return {Generator<ComponentReference<T>>}
     */
    /**
     * @param {{ entity?: string, type?: Extract<keyof T, string>, predicate?: (reference: ComponentReference<T>) => boolean }} options
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
     * @template {Extract<keyof T, string>} K
     * @overload
     * @param {{ entity: string, type: K, predicate?: (reference: ComponentReference<T>) => boolean }} options
     * @return {number}
     */
    /**
     * @overload
     * @param {{ entity: string, predicate?: (reference: ComponentReference<T>) => boolean }} options
     * @return {number}
     */
    /**
     * @overload
     * @param {{ predicate: (reference: ComponentReference<T>) => boolean }} [options]
     * @return {number}
     */
    /**
     * @param {{ entity?: string, type?: Extract<keyof T, string>, predicate?: (reference: ComponentReference<T>) => boolean }} [options]
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
     * @template {Extract<keyof T, string>} K
     * @overload
     * @param {{ entity: string, type: K, predicate?: (reference: ComponentReference<T>) => boolean }} options
     * @return {boolean}
     */
    /**
     * @overload
     * @param {{ entity: string, predicate?: (reference: ComponentReference<T>) => boolean }} options
     * @return {boolean}
     */
    /**
     * @template {Extract<keyof T, string>} K
     * @overload
     * @param {{ predicate: (reference: ComponentReference<T>) => boolean }} options
     * @return {boolean}
     */
    /**
     * @param {{ entity?: string, type?: Extract<keyof T, string>, predicate?: (reference: ComponentReference<T>) => boolean }} options
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




/**
 * @typedef {Record<string, { value: unknown, json?: unknown }>} ComponentTypesDefinition
 */



/**
 * @template {ComponentTypesDefinition} T
 * @typedef {{
 *    [K in Extract<keyof T, string>]: { value: T[K]['value'], json: T[K] extends { json: unknown } ? T[K]['json']: T[K]['value'] }
 * }} ComponentTypeMap
 */

/**
 * @template {ComponentTypesDefinition} T
 * @typedef {{
 *      [K in Extract<keyof ComponentTypeMap<T>, string>]: ComponentTypeMap<T>[K]['value'] | ComponentTypeMap<T>[K]['json'];
 * }} ComponentTypeValueMap
 */

/**
 * @template {ComponentTypesDefinition} T
 * @typedef {{
 *  [K in Extract<keyof T, string>]: {
 *       entity:   string;
 *       type:     K;
 *       value:    ComponentTypeMap<T>[K]['value'];
 *  }}} ComponentDataMap
 */

/**
 * @template {ComponentTypesDefinition} T
 * @template {Extract<keyof T, string>} [K = Extract<keyof T, string>]
 * @typedef {ComponentDataMap<T>[K]} ComponentData
 */

/**
 * @template {ComponentTypesDefinition} T
 * @typedef {{
 *  [K in Extract<keyof T, string>]: {
 *       entity:   string;
 *       type:     K;
 *       value:    ComponentTypeMap<T>[K]['json'];
 *  }}} ComponentJSONMap
 */

/**
 * @template {ComponentTypesDefinition} T
 * @template {Extract<keyof T, string>} [K = Extract<keyof T, string>]
 * @typedef {ComponentJSONMap<T>[K]} ComponentJSON
 */

/** 
 * An initializer is used to initialize complex component data that can not be serialized directly to/from JSON.
 * When a component is registered, if an initializer is defined for the specified component type the component value is set to the result of `new Initializer(value)`.
 * When a component is serialized the value will be converted to JSON using JSON.stringify. Therefore to control serializing complex data add a toJSON method to the Initializer.
 * 
 * All complex component data should implement set and toJSON methods to support maintaining component state.
 * 
 * For example the following should return the component to the same state:
 * 
 * @example
 * ```js
 * const data = new ComponentInitializer();
 * 
 * //save state
 * const state = data.toJSON();
 * 
 * //undo
 * data.set(state);
 * ```
 * 
 * To register new initializers add them to the stage.initializers
 * ```
 * stage.initializers[keyof ComponentTypesDefinition] = (component: ComponentData) => ComplexComponentValue
 * ```
 * 
 * @template {ComponentTypesDefinition} T
 * @typedef {Partial<{
 *     [K in Extract<keyof T, string>]: (c: ComponentJSON<T, K>) => ComponentData<T, K>['value'];
 * }>}  ComponentInitializers
 */

/**
 * @typedef {{
 *     set(value: unknown): void;
 *     toJSON(): Record<string, unknown>;
 * }} ComplexComponentValue
 */