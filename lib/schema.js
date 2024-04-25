import { deepEquals } from '../deps/utils.js';

/**
 * @import { Component, ComponentSchemaManagers, ComponentSchemas, ComponentTypeKey, ComponentTypeSchema, ComponentTypeSchemaArray, ComponentTypeSchemaObject, ComponentTypeSchemaTuple } from './ecs.js'
 */

/**
 * A map of schema initializers by type
 */
export const componentSchemas = /** @type {ComponentSchemaManagers} */({});


/**
 * @typedef {{ component: Component, pointer: string, target: Record<string, unknown> }} ComponentStateObject
 * @typedef {{ component: Component, pointer: string }} ComponentStateArray
 */
const _ = Symbol('Component State');

/**
 * @template {ComponentTypeSchema} [T=any]
 */
export class ComponentSchemaManager {
    #properties = /** @type {Record<string, { schema: ComponentSchemaManager }> & PropertyDescriptorMap} */({});
    #items      = /** @type {ComponentSchemaManager[]}*/([]);

    /** @type {ProxyHandler<unknown[] & { [key: symbol]: ComponentStateArray}>} */
    #proxyHandler = {};

    #simple = false;
    #reference = false;

    /**
     * @param {T} schema
     */
    constructor(schema) {
        this.schema = schema;

        this.#simple    = ComponentSchemaManager.#isSimple(schema);
        this.#reference = !!('component' in schema || 'asset' in schema);

        /** @todo use simple when no observed, default, or reference is present in any child properties */
        if(this.#simple) {
            this.serialize   = this.#serializeSimple;
            this.deserialize = this.#deserializeSimple;
        } else {
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
                default:
                    this.serialize   = this.#serializeSimple;
                    this.deserialize = this.#deserializeSimple;
            }
        }
    }

    /**
     * @param {number} i
     */
    #getItemSchema(i) {
        return this.#items[i % this.#items.length];
    }

    /**
     * @param {unknown} value
     */
    #serializeSimple(value) {
        return 'default' in this.schema && deepEquals(value, this.schema.default) ? undefined : structuredClone(value);
    }

    /**
     * @param {Record<string, any>} value
     */
    #serializeObject(value) {
        if('default' in this.schema && deepEquals(value, this.schema.default)) return undefined;

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
        if('default' in this.schema && deepEquals(value, this.schema.default)) return undefined;

        const result = /** @type {unknown[]} */([]);

        for(let i = 0; i < value.length; i++) {
            result[i] = this.#getItemSchema(i).serialize(value[i]);
        }

        return result;
    }

    /**
     * @param {Component} component
     * @param {any} [value]
     */
    #deserializeSimple(component, value) {
        value ??= structuredClone(this.schema.default);
        if('component' in this.schema && this.schema.component) {
            return component.stage.references.components.create(component, { entity: value, type: this.schema.component });
        }
        if('asset' in this.schema && this.schema.asset) {
            return component.stage.references.assets.create(component, { uri: value, type: this.schema.asset });
        }
        return value;
    }

    /**
     * @param {Component} component
     * @param {Record<string, any>} [value]
     * @param {string} [pointer]
     */
    #deserializeObject(component, value, pointer = '') {
        value ??= structuredClone(/** @type {ComponentSchemaManager<ComponentTypeSchemaObject>} */(this).schema.default)

        const obj = Object.create(null);

        obj[_] = { component, target: {}, pointer };

        Object.defineProperties(obj, this.#properties);

        if(value) {
            for(const prop in this.#properties) {
                obj[_].target[prop] = this.#properties[prop].schema.deserialize(component, value[prop], pointer);
            }
        }

        return obj;
    }

    /**
     * @param {Component} component
     * @param {any[]} [value]
     * @param {string} [pointer]
     */
    #deserializeArray(component, value, pointer = '') {
        value ??= structuredClone(/** @type {ComponentSchemaManager<ComponentTypeSchemaArray>} */(this).schema.default)

        const arr = /** @type {(unknown[]) & ({ [key: symbol]: ComponentStateArray })} */(/** @type {unknown} */([]));

        arr[_] = { component, pointer };

        const proxy = new Proxy(arr, this.#proxyHandler);

        if(value) {
            for(let i = 0; i < value.length; i++) {
                arr[i] = this.#getItemSchema(i).deserialize(component, value[i], `${pointer}/${i}`);
            }
        }

        return proxy;
    }

    /**
     * @template {ComponentTypeSchemaObject} S
     * @param {S} schema
     */
    #compileObject(schema) {
        for(const prop in schema.properties) {
            const propSchema = schema.properties[prop];
            const observed   = schema.observed?.includes(prop);

            const childSchema = new ComponentSchemaManager(propSchema);

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

                    const propPointer = `${pointer}/${prop}`;

                    if(value && deepEquals(target[prop], value)) return;

                    childSchema.clearValue(target[prop]);

                    if(observed){
                        const event = `value:change:${propPointer}`;

                        if(component.isWatched(event)) {
                            const original = childSchema.copy(target[prop]);

                            target[prop] = childSchema.deserialize(component, value, propPointer);

                            component.notify(event, original);
                            return;
                        }
                    }

                    target[prop] = childSchema.deserialize(component, value, propPointer);
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

                            items[(i % items.length)].clearValue(target[i]);

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
                            const itemSchema = items[(i % items.length)];

                            itemSchema.clearValue(target[i]);
                        }
                    }
                    target.length = value;
                } else {
                    const i = Number(prop);

                    const itemPointer = `${pointer}/${prop}`;
                    const itemSchema  = items[(i % items.length)];

                    itemSchema.clearValue(target[i]);

                    Reflect.set(target, i, items[(i % items.length)].deserialize(component, value, itemPointer));
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
        if(this.#reference) return value.valueOf();

        switch(this.schema.type) {
            case 'object': {
                const result = /** @type {Record<string, unknown>} */({});
                for(const prop in this.#properties) {
                    result[prop] = this.#properties[prop].schema.copy(value[prop]);
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
            default:
                return value;
        }
    }

    /**
     * Deeply clears the references for the value based on the schema
     *
     * @param {any} value
     */
    clearValue(value) {
        if(!value) return;
        if(this.#simple) return;
        if(this.#reference) return value?.release();

        switch(this.schema.type) {
            case 'object':
                for(const prop in this.#properties) {
                    this.#properties[prop].schema.clearValue(value[prop]);
                }
                break;
            case 'array':
                for(let i = 0; i < value.length; i++) {
                    this.#items[i % this.#items.length].clearValue(value[i]);
                }
                break;
        }
    }

    /**
     * @param {ComponentTypeSchema} schema
     */
    static #isSimple(schema) {
        if('default' in schema) {
            return false;
        }
        if('observed' in schema) {
            return false;
        }
        if('component' in schema) {
            return false;
        }
        if('asset' in schema) {
            return false;
        }

        switch(schema.type) {
            case 'object':
                for(const prop in schema.properties) {
                    if(!this.#isSimple(schema.properties[prop])) {
                        return false;
                    }
                }
                break;
            case 'array':
                for(const item of Array.isArray(schema.items) ? schema.items : [schema.items]) {
                    if(!this.#isSimple(item)) {
                        return false;
                    }
                }
                break;
        }

        return true;
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

    componentSchemas[type] = new ComponentSchemaManager(schema)
}

/**
 * @param {string} type
 */
export function unregisterSchema(type) {
    delete componentSchemas[type];
}
