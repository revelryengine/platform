/**
 * The core glTF property module. All glTF properties extend from GLTFProperty.
 * @module
 */

/**
 * @import { ExtendablePropertyNames } from '@revelryengine/gltf/extensions';
 */
class GLTFExtensionRegistry {
    /** @type {Set<string>} */
    #supportedExtensions = new Set();

    /** @type {Record<string, Record<string, typeof GLTFProperty>>} */
    #schemas = {};

    /**
     * Adds a new extension to the set.
     * @param {string} name
     * @param {{ schema: Partial<Record<ExtendablePropertyNames, typeof GLTFProperty>> }} config
     */
    add(name, config) {
        this.#supportedExtensions.add(name);

        for(const entry of Object.entries(config.schema)) {
            const [property, factory] = /** @type {[string, typeof GLTFProperty ]} */(entry);
            this.#schemas[property] ??= {}
            this.#schemas[property][name] = factory;
        }
    }

    /**
     * Retrieves the factory function for a specific property and extension.
     * @param {string} property
     * @param {string} name
     */
    getFactory(property, name) {
        return this.#schemas[property]?.[name];
    }

    /**
     * Checks if an extension is supported.
     * @param {string} name
     */
    isSupported(name) {
        return this.#supportedExtensions.has(name);
    }
}

/**
 * @typedef {object} glTFPropertyData - glTFProperty data
 * @property {{ [key: string]: glTFPropertyData }} [extensions] - Extension-specific data.
 * @property {{ [key: string]: unknown }} [extras] - Application-specific data.
 */

/**
 * @typedef {object} GLTFPropertyData - GLTFProperty data
 * @property {{ [key: string]: GLTFPropertyData }} [extensions] - Extension-specific data.
 * @property {{ [key: string]: unknown }} [extras] - Application-specific data.
 */

/**
 * @typedef {object} namedGLTFPropertyData - glTFProperty data
 * @property {string} [name] - The name of this object.
 * @property {{ [key: string]: glTFPropertyData }} [extensions] - Extension-specific data.
 * @property {{ [key: string]: unknown }} [extras] - Application-specific data.
 */

/**
 * @typedef {object} NamedGLTFPropertyData - GLTFProperty data
 * @property {string} [name] - The name of this object.
 * @property {{ [key: string]: GLTFPropertyData }} [extensions] - Extension-specific data.
 * @property {{ [key: string]: unknown }} [extras] - Application-specific data.
 */

/**
 * @typedef {object} FromJSONGraph - Graph for unmarshalling JSON into GLTFProperty instances.
 * @property {Record<string, any>} root - The root glTF object.
 * @property {URL} [uri] - The base URI for resolving relative paths.
 * @property {Record<string, any>} [parent] - The parent object in the glTF hierarchy.
 */

/**
 * @typedef {object} ReferenceField - Definition of a reference field for unmarshalling.
 * @property {typeof GLTFProperty | typeof URL} [factory] - The factory to create the referenced object.
 * @property {string | string[]} [collection] - The collection name(s) where the referenced object can be found.
 * @property {'root' | 'parent'} [location='root'] - The location of the collection ('root' or 'parent').
 * @property {Record<string, any>} [assign] - Additional properties to assign to the referenced object.
 * @property {string} [alias] - An alternative name for the referenced field.
 * @property {string} [pointer] - If specified, indicates that this field is a JSON Pointer resolver.
 * @property {Record<string, ReferenceField>} [referenceFields] - Nested reference fields for complex objects.
 */


/**
 * @typedef {object} JSONPointerResolveResult - Result of resolving a JSON Pointer.
 * @property {any} target - The target object containing the property
 * @property {string} path - The property name within the target object
 * @property {object} root - The root collection and target object
 * @property {string} root.collection - The name of the root collection
 * @property {any} root.target - The target object within the root collection
 */

const pending = new WeakMap();

/**
 * GLTFProperty
 */
export class GLTFProperty {
    /**
     * Extension-specific data.
     * @type {{ [key: string]: glTFPropertyData } | undefined}
     */
    extensions;

    /**
     * Creates a new instance of GLTFProperty.
     * @param {GLTFPropertyData} glTFProperty - The properties of the GLTFProperty
     */
    constructor({ extras }) {
        /**
         * Application-specific data.
         */
        this.extras = extras;
    }

    /**
     * Loads the GLTFProperty and its extensions.
     * @param {AbortSignal} [signal] - Optional AbortSignal to cancel loading
     */
    async load(signal) {
        this.extensions && await Promise.all(Object.values(this.extensions).map(ext => {
            return ext instanceof GLTFProperty && ext.load(signal);
        }));
        return this;
    }

    /**
     * Loads the GLTFProperty only once, caching the promise.
     * @param {AbortSignal} [signal] - Optional AbortSignal to cancel loading
     * @return {Promise<this>} - The loaded GLTFProperty
     */
    loadOnce(signal) {
        return (pending.get(this) || pending.set(this, this.load(signal)).get(this));
    }

    /**
     * Creates an instance from JSON data.
     * @param {Record<string, any>} json - The JSON representation of the GLTFProperty
     * @param {FromJSONGraph} _ options - Options for creating the instance from JSON
     */
    static fromJSON(json, _) {
        return new this(json);
    }

    static #instances = new WeakMap();

    /**
     * @param {Record<string, unknown>} root
     */
    static #ensureInstances(root) {
        return /** @type {WeakMap<Record<string, unknown>, GLTFProperty | Record<string, unknown>>} */(GLTFProperty.#instances.get(root) ?? GLTFProperty.#instances.set(root, new WeakMap()).get(root));
    }

    /**
     * Unmarshalls a JSON object into a GLTFProperty instance.
     * @template {GLTFProperty} C - The type of GLTFProperty to unmarshall
     * @param {FromJSONGraph} graph - Graph for unmarshalling
     * @param {Record<string, unknown>} json - The JSON representation of the GLTFProperty
     * @param {Record<string, ReferenceField>} referenceFields - Fields that reference other GLTFProperties
     * @param {new (unmarshalled: any) => C} ctor - The constructor of the GLTFProperty
     * @return {C} The unmarshalled GLTFProperty instance
     */
    static unmarshall({ uri, root, parent = {} }, json, referenceFields, ctor) {
        const instances = GLTFProperty.#ensureInstances(root);

        const object = GLTFProperty.#unmarshallObject({ uri, root, parent }, json, referenceFields);

        /**
         * @param {Record<string, unknown>} src
         * @param {typeof GLTFProperty} [factory]
         */
        const ensureInstance = (src, factory) => {
            let result = instances.get(src)
            if(!result) {
                result = factory ? factory.fromJSON(src, { uri, root, parent: json }) : src;
                instances.set(src, result);
            }
            return result
        }

        if(object.extensions) {
            object.extensions = Object.fromEntries(Object.entries(object.extensions).map(([name, value]) => {
                const factory = GLTFProperty.extensions.getFactory(ctor.name, name);
                if(factory) {
                    return [name, ensureInstance(value, factory)];
                }
                return [name, value];
            }));
        }

        return new ctor(object);
    }

    /**
     * Unmarshalls a JSON object by dereferencing its fields from the root or parent context.
     * @param {FromJSONGraph} graph - Graph for unmarshalling
     * @param {Record<string, unknown>} json - The JSON representation of the GLTFProperty
     * @param {Record<string, ReferenceField>} referenceFields - Fields that reference other GLTFProperties
     */
    static #unmarshallObject({ uri, root, parent = {} }, json, referenceFields) {
        const instances = GLTFProperty.#ensureInstances(root);

        const locations = /** @type {const} */({ root, parent });

        // constructor, collection, location, alias, assign
        // arrays and attributes object

        /** @type {Record<string, any>} */
        const references = {};

        /**
         * @param {Record<string, unknown>} src
         * @param {typeof GLTFProperty} [factory]
         */
        const ensureInstance = (src, factory) => {
            let result = instances.get(src)
            if(!result) {
                result = factory ? factory.fromJSON(src, { uri, root, parent: json }) : src;
                instances.set(src, result);
            }
            return result
        }

        for(const entry of Object.entries(referenceFields)) {
            const [name, { factory, collection, location = 'root', assign, alias, pointer, referenceFields }] = /** @type {[string, ReferenceField]} */(entry);

            const value = json[name];

            if(value != undefined) {
                let result;

                if(pointer) {
                    result = GLTFProperty.#unmarshallJSONPointerResolver(root, /** @type {string} */(value));
                    references[pointer] = result;
                    continue;
                }

                if(referenceFields) { //Nested reference fields
                    result = GLTFProperty.#unmarshallObject({ uri, root, parent }, /** @type {Record<string, unknown>} */(value), referenceFields);
                    references[name] = result;
                    continue;
                }

                if(factory === URL) {
                    result = new URL(/** @type {string} */(value), uri);
                } else if(collection) { // value is either a number index or an array of number indices
                    const srcLocation   = locations[location];
                    const srcCollection = typeof collection === 'string' ? srcLocation[collection] : collection.reduce((obj, key) => obj[key], srcLocation);

                    if(value instanceof Array) {
                        result = [];
                        for(const v of value) {
                            const srcObject = srcCollection[v];
                            result.push(ensureInstance(srcObject, /** @type {typeof GLTFProperty|undefined} */(factory)));
                        }
                    } else {
                        const srcObject = srcCollection[/** @type {number} */(value)];
                        result = ensureInstance(srcObject, /** @type {typeof GLTFProperty|undefined} */(factory));
                        if(assign) {
                            Object.assign(result, assign);
                        }
                    }
                } else {
                    if(value instanceof Array) {
                        result = [];
                        for(const v of value) {
                            const srcObject = v;
                            result.push(ensureInstance(srcObject, /** @type {typeof GLTFProperty|undefined} */(factory)));
                        }
                    } else {
                        const srcObject = /** @type {Record<string, unknown>} */(value);
                        result = ensureInstance(srcObject, /** @type {typeof GLTFProperty|undefined} */(factory));
                        if(assign) {
                            Object.assign(result, assign);
                        }
                    }
                }

                references[name] = result;

                if(alias) {
                    references[alias] = result;
                }
            }
        }

        return {
            ...json,
            ...references
        };
    }

    /**
     * Resolves a JSON Pointer within the context of a GLTFProperty.
     *
     * [Reference Spec - Pointers](https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/ObjectModel.adoc#4-core-pointers)
     *
     * @param {Record<string, any>} root - The root glTF object
     * @param {string} pointer - The JSON Pointer string
     */
    static #unmarshallJSONPointerResolver(root, pointer) {
        /**
         * Root Collections we need to track so that they can be updated in the scene graph after animations
         *
         * /cameras/{}/
         * /materials/{}/
         * /meshes/{}/
         * /nodes/{}/
         * /extensions/KHR_lights_punctual/lights/{}/
         *
         * Find first instance of /{}/ then the collection name is everything before that
         */
        const indexMatch = pointer.match(/\/(\d+)\//);

        if(!indexMatch) throw new Error('Invalid JSON Pointer');

        const collection = pointer.substring(0, indexMatch.index);
        const target     = collection.substring(1).split(/\//).reduce((obj, key) => obj[key], root)[Number(indexMatch[1])]
        const tokens     = pointer.substring(1).split(/\//);
        const path       = /** @type {string} */(tokens.at(-1));

        /**
         * @type {{
         *  instances?: WeakMap<Record<string, unknown>, GLTFProperty | Record<string, unknown>>,
         *  root: { collection: string, target: any },
         *  target: any,
         *  path: string,
         * }}
         */
        const state = {
            instances: GLTFProperty.#ensureInstances(root),
            root:   { collection, target },
            target: tokens.slice(0, -1).reduce((obj, key) => obj[key], root),
            path,
        }

        const resolve = () => {
            if(!state.instances) return state;

            const rootTarget = state.instances.get(state.root.target);
            const target     = state.instances.get(state.target);

            if(!rootTarget || !target) throw new Error('Invalid State');

            // allow garbage collection of unmarshalled json after first resolve call
            state.root.target = rootTarget;
            state.target      = target;
            delete state.instances;

            return /** @type {JSONPointerResolveResult} */(state);
        }

        return resolve;
    }

    /**
     * Extension registry
     */
    static extensions = new GLTFExtensionRegistry();
}

/**
 * NamedGLTFProperty
 * @extends {GLTFProperty}
 */
export class NamedGLTFProperty extends GLTFProperty {
    /**
     * Creates a new instance of NamedGLTFProperty.
     * @param {NamedGLTFPropertyData} namedGLTFProperty - The properties of the NamedGLTFProperty
     */
    constructor(namedGLTFProperty) {
        super(namedGLTFProperty);

        const { name } = namedGLTFProperty

        /**
         * The user-defined name of this object.
         */
        this.name = name;
    }
}
