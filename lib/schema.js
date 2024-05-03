import { NonNull } from '../../utils/lib/non-null.js';
import { deepEquals } from '../deps/utils.js';

/**
 * @import { Component, ComponentSchemaManagers, ComponentSchemas, ComponentTypeKey, ComponentTypeSchema, ComponentTypeSchemaArray, ComponentTypeSchemaObject, ComponentTypeSchemaTuple} from './ecs.js'
 */

/**
 * A map of schema initializers by type
 */
export const componentSchemas = /** @type {ComponentSchemaManagers} */({});


/**
 * @typedef {{ component: Component, pointer: string, target: Record<string, unknown>, observed?: string[] }} ComponentStateObject
 * @typedef {{ component: Component, pointer: string, target: unknown[] }} ComponentStateArray
 */
const _ = Symbol('Component State');

/**
 * @template {ComponentTypeSchema} [T=any]
 */
export class ComponentSchemaManager {
    #properties = /** @type {Record<string, { schema: ComponentSchemaManager, observed?: boolean }> & PropertyDescriptorMap} */({});
    #items      = /** @type {ComponentSchemaManager[]}*/([]);

    /** @type {ProxyHandler<unknown[] & { [key: symbol]: ComponentStateArray}>} */
    #proxyHandler = {};

    #simple    = false;
    #reference = false;
    #observed  = false;

    /**
     * @param {T} schema
     * @param {boolean} [observed]
     */
    constructor(schema, observed = false) {
        this.schema = schema;

        this.#observed  = observed;
        this.#simple    = ComponentSchemaManager.#isSimple(schema);
        this.#reference = ComponentSchemaManager.#hasReferences(schema);

        this.serialize   = this.#serializeSimple;
        this.deserialize = this.#deserializeSimple;

        /** use simple when no observed, default, or reference is present in any child properties */
        if(!this.#simple) {
            switch(schema.type) {
                case 'object':
                    this.#compileObject(schema);
                    this.serialize   = this.#serializeObject;
                    this.deserialize = this.#deserializeObject;
                    break;
                case 'array':
                    this.#compileArray(schema);
                    this.serialize   = this.#serializeArray;
                    this.deserialize = this.#deserializeArray;
                    break;
            }
        }
    }

    get hasReferences() {
        return this.#reference;
    }

    /**
     * @param {unknown} value
     */
    #serializeSimple(value) {
        if('default' in this.schema){
            if(deepEquals(value, this.schema.default)) {
                return undefined;
            }
        }
        return structuredClone(value?.valueOf());
    }

    /**
     * @param {Record<string, any>} value
     */
    #serializeObject(value) {
        if('default' in this.schema){
            if(deepEquals(value, this.schema.default)) {
                return undefined;
            }
        }

        const result = /** @type {Record<String, unknown>} */({});

        for(const prop in this.#properties) {
            result[prop] = this.#properties[prop].schema.serialize(value[prop]);
        }

        return result;
    }

    /**
     * @param {unknown[]} value
     */
    #serializeArray(value) {
        if('default' in this.schema){
            if(deepEquals(value, this.schema.default)) {
                return undefined;
            }
        }

        const result = /** @type {unknown[]} */([]);

        for(let i = 0; i < value.length; i++) {
            result[i] = this.#items[i % this.#items.length].serialize(value[i]);
        }

        return result;
    }

    /**
     * @param {Component} component
     * @param {any} [value]
     * @param {string} [pointer]
     * @param {boolean} [silent]
     */
    #deserializeSimple(component, value, pointer = '', silent = false) {
        value ??= structuredClone(this.schema.default);

        if(this.#reference) {
            pointer = pointer || '/'; //root pointer

            ComponentSchemaManager.#clearReferences(component, pointer);

            if(value) {
                let ref;
                if('component' in this.schema) {
                    ref = component.stage.references.components.create(component, { entity: value, type: this.schema.component });
                }

                if('asset' in this.schema) {
                    ref = component.stage.references.assets.create(component, { uri: value, type: this.schema.asset });
                }

                if(ref) {
                    ref.get().then(() => component.notify(`reference:resolve:${pointer}`, ref)).catch(() => {});
                    NonNull(component.references)[pointer] = ref;
                }
            }
        }

        if(this.#observed && !silent) {
            component.notify(`value:change:${pointer || '/'}`, undefined);
        }

        return value;
    }



    /**
     * @param {Component} component
     * @param {Record<string, any>} [value]
     * @param {string} [pointer]
     * @param {boolean} [silent]
     */
    #deserializeObject(component, value, pointer = '', silent = false) {
        value ??= structuredClone(/** @type {ComponentSchemaManager<ComponentTypeSchemaObject>} */(this).schema.default);

        const obj = Object.create(null);

        obj[_] = { component, target: {}, pointer };

        Object.defineProperties(obj, this.#properties);

        if(value) {
            for(const prop in this.#properties) {
                obj[_].target[prop] = this.#properties[prop].schema.deserialize(component, value[prop], `${pointer}/${prop}`);
            }
            for(const prop in value) {
                if(prop in this.#properties) continue;
                obj[prop] = value[prop];
            }
        }

        if(this.#observed && !silent) {
            component.notify(`value:change:${pointer || '/'}`, undefined);
        }

        return obj;
    }

    /**
     * @param {Component} component
     * @param {any[]} [value]
     * @param {string} [pointer]
     * @param {boolean} [silent]
     */
    #deserializeArray(component, value, pointer = '', silent = false) {
        const { default: defaulValue, items } = /** @type {ComponentSchemaManager<ComponentTypeSchemaArray>} */(this).schema;

        value ??= structuredClone(defaulValue)

        const arr = /** @type {(unknown[]) & ({ [key: symbol]: ComponentStateArray })} */(/** @type {unknown} */([]));

        arr[_] = { component, pointer, target: arr };

        const proxy = new Proxy(arr, this.#proxyHandler);

        if(value) {
            if(Array.isArray(items)) {//tuple
                for(let i = 0; i < items.length; i++) {
                    arr[i] = this.#items[i % this.#items.length].deserialize(component, value[i], `${pointer}/${i}`);
                }
            } else {
                for(let i = 0; i < value.length; i++) {
                    arr[i] = this.#items[i % this.#items.length].deserialize(component, value[i], `${pointer}/${i}`);
                }
            }
        }

        if(this.#observed && !silent) {
            component.notify(`value:change:${pointer || '/'}`, undefined);
        }

        return proxy;
    }

    /**
     * @template {ComponentTypeSchemaObject} S
     * @param {S} schema
     */
    #compileObject(schema) {
        for(const prop in schema.properties) {
            const propSchema  = schema.properties[prop];
            const childSchema = new ComponentSchemaManager(propSchema, schema.observed?.includes(prop));

            this.#properties[prop] = {
                schema: childSchema,
                enumerable: true,

                /**
                 * @this {{ [key: symbol]: ComponentStateObject }}
                 */
                get() {
                    return this[_].target[prop];
                },

                /**
                 * @this {{ [key: symbol]: ComponentStateObject }}
                 * @param {any} value
                 */
                set(value) {
                    const { component, target, pointer } = this[_];

                    childSchema.#assign(component, target, prop, value, `${pointer}/${prop}`);
                }
            };
        }
    }

    /**
     * @param {ComponentTypeSchemaArray|ComponentTypeSchemaTuple} schema
     */
    #compileArray(schema) {
        const items = this.#items;
        for(const item of (Array.isArray(schema.items) ? schema.items : [schema.items])) {
            items.push(new ComponentSchemaManager(item));
        }

        this.#proxyHandler = {
            get(target, prop) {
                switch(prop) {
                    case 'splice':
                    case 'shift':
                    case 'unshift':
                    case 'sort':
                    case 'reverse':
                    case 'copyWithin':
                        return () => { throw new Error(`${prop} not allowed on complex component value array`) }
                    case 'pop':
                        return () => {
                            const i = target.length - 1;

                            const { component, pointer } = target[_];

                            ComponentSchemaManager.#clearReferences(component, `${pointer}/${i}`);

                            target.pop();
                        }
                }
                return Reflect.get(target, prop);
            },
            set(target, prop, value) {
                if(typeof prop === 'symbol') throw new Error('Cannot set symbol properties on a complex component value array');

                const { component, pointer } = target[_];

                if(prop === 'length') {
                    if(value < target.length) {
                        for(let i = value; i < target.length; i++) {
                            ComponentSchemaManager.#clearReferences(component, `${pointer}/${i}`);
                        }
                    }
                    target.length = value;
                } else {
                    const i = Number(prop);

                    items[(i % items.length)].#assign(component, target, i, value, `${pointer}/${i}`);
                }
                return true;
            }
        }
    }

    /**
     * Deeply copy the value based on the schema
     *
     * @param {any} value
     */
    copy(value) {
        if(this.#simple) return structuredClone(value);

        switch(this.schema.type) {
            case 'object': {
                const result = /** @type {Record<string, unknown>} */({});
                for(const prop in this.#properties) {
                    if(value[prop] !== undefined) result[prop] = this.#properties[prop].schema.copy(value[prop]);
                }
                for(const prop in value) {
                    if(prop in this.#properties) continue;
                    if(value[prop] !== undefined) result[prop] = structuredClone(value[prop]);
                }
                return result;
            }
            case 'array': {
                const result = /** @type {unknown[]} */([]);
                for(let i = 0; i < value.length; i++) {
                    result[i] = this.#items[i % this.#items.length].copy(value[i]);
                }
                return result;
            }
        }
    }

    /**
     *
     *
     * @param {Component} component
     * @param {any} oldValue
     * @param {any} newValue
     */
    updateValue(component, oldValue, newValue) {
        const wrapper = { value: oldValue };
        this.#assign(component, wrapper, 'value', newValue);
        return wrapper.value;
    }

    /**
     * If property is observed, notify the component of the change
     *
     * @param {Component} component
     * @param {any} target
     * @param {PropertyKey} key
     * @param {any} [value]
     * @param {string} [pointer]
     */
    #assign(component, target, key, value, pointer = '') {
        const original = this.#observed && this.copy(target[key]);

        if(this.#simple || target[key] == undefined || value == undefined) {
            target[key] = this.deserialize(component, value, pointer, true);
        } else {
            switch(this.schema.type) {
                case 'object': {
                    for(const prop in this.#properties) {
                        this.#properties[prop].schema.#assign(component, target[key][_].target, prop, value[prop], `${pointer}/${prop}`);
                    }
                    for(const prop in value) {
                        if(prop in this.#properties) continue;
                        target[key][prop] = value[prop];
                    }
                }
                case 'array': {
                    const { items } = /** @type {ComponentTypeSchemaTuple|ComponentTypeSchemaArray} */(this.schema);

                    if(Array.isArray(items)) {//tuple
                        for(let i = 0; i < items.length; i++) {
                            this.#items[i % this.#items.length].#assign(component, target[key][_].target, i, value[i], `${pointer}/${i}`);
                        }
                    } else {
                        target[key].length = value.length;

                        for(let i = 0; i < value.length; i++) {
                            this.#items[i % this.#items.length].#assign(component, target[key][_].target, i, value[i], `${pointer}/${i}`);
                        }
                    }
                }
            }
        }

        if(this.#observed && !deepEquals(original, target[key])) {
            component.notify(`value:change:${pointer || '/'}`, original);
        }
    }

    /**
     * Returns true use when no observed, default, or reference is present in any child properties
     *
     * @param {ComponentTypeSchema} schema
     */
    static #isSimple(schema) {
        switch(schema.type) {
            case 'object':
                if('observed' in schema) {
                    return false;
                }
                for(const prop in schema.properties) {
                    if(this.#isComplex(schema.properties[prop])) {
                        return false;
                    }
                }
                break;
            case 'array':
                for(const item of Array.isArray(schema.items) ? schema.items : [schema.items]) {
                    if(this.#isComplex(item)) {
                        return false;
                    }
                }
                break;
        }

        return true;
    }



    /**
     * Returns true if has default or is a reference
     * @param {ComponentTypeSchema} schema
     */
    static #isComplex(schema) {
        if('default' in schema) {
            return true;
        }
        if('component' in schema) {
            return true;
        }
        if('asset' in schema) {
            return true;
        }
        if('observed' in schema) {
            return true;
        }

        switch(schema.type) {
            case 'object':
                for(const prop in schema.properties) {
                    if(this.#isComplex(schema.properties[prop])) {
                        return true;
                    }
                }
                break;
            case 'array':
                for(const item of Array.isArray(schema.items) ? schema.items : [schema.items]) {
                    if(this.#isComplex(item)) {
                        return true;
                    }
                }
                break;
        }

        return false
    }

    /**
     * Returns true when the schema has references or any child properties have references
     *
     * @param {ComponentTypeSchema} schema
     */
    static #hasReferences(schema) {
        if('component' in schema) {
            return true;
        }
        if('asset' in schema) {
            return true;
        }

        switch(schema.type) {
            case 'object':
                for(const prop in schema.properties) {
                    if(this.#hasReferences(schema.properties[prop])) {
                        return true;
                    }
                }
                break;
            case 'array':
                for(const item of Array.isArray(schema.items) ? schema.items : [schema.items]) {
                    if(this.#hasReferences(item)) {
                        return true;
                    }
                }
                break;
        }

        return false;
    }

    /**
     * @param {Component} component
     * @param {string} pointer
     */
    static #clearReferences(component, pointer) {
        if(!component.references) return;

        const refs = component.references;
        for(const prop in refs) {
            if(prop.startsWith(pointer)) {
                refs[prop]?.release();
                delete refs[prop];
            }
        }
    }
}

/**
 * @template {ComponentTypeKey} K
 * @template {ComponentSchemas[K]} S
 *
 * @overload
 * @param {K} type
 * @param {S} schema
 * @return {void}
 *
 * @overload
 * @param {string} type
 * @param {ComponentTypeSchema} schema
 * @return {void}
 *
 * @param {string} type
 * @param {ComponentTypeSchema} schema
 */
export function registerSchema(type, schema) {
    if(componentSchemas[type]) return;

    componentSchemas[type] = new ComponentSchemaManager(schema, true)
}

/**
 * @param {string} type
 */
export function unregisterSchema(type) {
    delete componentSchemas[type];
}
