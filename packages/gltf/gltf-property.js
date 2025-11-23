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
 * @import {
 *  glTFPropertyData,
 *  GLTFPropertyData,
 *  NamedGLTFPropertyData,
 *  GLTFPropertyClassInterface,
 *  FromJSONGraph,
 *  PreparedFromJSON,
 *  ReferenceField
 * } from './gltf-property.types.d.ts';
 */

const pending = new WeakMap();

const instances = new WeakMap();

/**
 * @param {Record<string, unknown>} root
 */
function ensureInstances(root) {
    return /** @type {WeakMap<Record<string, unknown>, GLTFProperty | Record<string, unknown>>} */(instances.get(root) ?? instances.set(root, new WeakMap()).get(root));
}

/**
 * @param {FromJSONGraph} graph
 * @param {Record<string, unknown>} src
 * @param {typeof GLTFProperty} [factory]
 */
function ensureInstance(graph, src, factory){
    const instances = ensureInstances(graph.root);
    let result = instances.get(src)
    if(!result) {
        result = factory ? factory.fromJSON(src, graph) : src;
        instances.set(src, result);
    }
    return result
}

/**
 * Unmarshalls a JSON object into a GLTFProperty instance.
 * @template {GLTFProperty} C - The type of GLTFProperty to unmarshall
 * @param {Record<string, unknown>} json - The JSON representation of the GLTFProperty
 * @param {FromJSONGraph} graph - Graph for unmarshalling
 * @param {GLTFPropertyClassInterface<C>} ctor - The constructor of the GLTFProperty
 * @return {C} The unmarshalled GLTFProperty instance
 */
function unmarshall(json, { uri, root, parent = {} }, ctor) {
    const object = unmarshallObject({ uri, root, parent }, json, ctor.referenceFields);

    if(object.extensions) {
        object.extensions = Object.fromEntries(Object.entries(object.extensions).map(([name, value]) => {
            const factory = GLTFProperty.extensions.getFactory(ctor.name, name);
            if(factory) {
                return [name, ensureInstance({ uri, root, parent: json }, value, factory)];
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
function unmarshallObject({ uri, root, parent = {} }, json, referenceFields) {
    const locations = /** @type {const} */({ root, parent });

    // constructor, collection, location, alias, assign
    // arrays and attributes object

    /** @type {Record<string, any>} */
    const references = {};

    for(const entry of Object.entries(referenceFields)) {
        const [name, { factory, collection, location = 'root', assign, alias, referenceFields }] = /** @type {[string, ReferenceField]} */(entry);

        const value = json[name];

        const ctor = factory ? factory() : undefined;

        if(value != undefined) {
            let result;

            if(referenceFields) { //Nested reference fields, value must be an object
                result = unmarshallObject({ uri, root, parent }, /** @type {Record<string, unknown>} */(value), referenceFields);
                references[name] = result;
                continue;
            }

            if(ctor === URL) { //value is a string
                result = new URL(/** @type {string} */(value), uri);
            } else if (ctor === JSONPointer) { //value is a string
                result = new JSONPointer(/** @type {string} */(value), root);
            } else if(collection) { // value is either a number index or an array of number indices
                const srcLocation = locations[location];

                const srcCollection = /** @type {Record<number, Record<string, unknown>>} */(
                    typeof collection === 'string'
                        ? srcLocation[collection]
                        : collection.reduce((obj, key) => /** @type {Record<number, Record<string, unknown>>} */(obj[key]), srcLocation)
                );

                if(value instanceof Array) {
                    result = [];
                    for(const v of value) {
                        const srcObject = srcCollection[v];
                        result.push(ensureInstance({ uri, root, parent: json }, srcObject, /** @type {typeof GLTFProperty|undefined} */(ctor)));
                    }
                } else {
                    const srcObject = srcCollection[/** @type {number} */(value)];
                    result = ensureInstance({ uri, root, parent: json }, srcObject, /** @type {typeof GLTFProperty|undefined} */(ctor));
                    if(assign) {
                        Object.assign(result, assign);
                    }
                }
            } else {
                if(value instanceof Array) {
                    result = [];
                    for(const v of value) {
                        const srcObject = v;
                        result.push(ensureInstance({ uri, root, parent: json }, srcObject, /** @type {typeof GLTFProperty|undefined} */(ctor)));
                    }
                } else {
                    const srcObject = /** @type {Record<string, unknown>} */(value);
                    result = ensureInstance({ uri, root, parent: json }, srcObject, /** @type {typeof GLTFProperty|undefined} */(ctor));
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
     * Reference fields for this class.
     * @type {Record<string, ReferenceField>}
     */
    static referenceFields = {};

    /**
     * Creates an instance from JSON data.
     *
     * It automatically unmarshalls referenced fields based on the referenceFields static property.
     *
     * See [Unmarshalling](./__docs__/development.md#unmarshalling) for more details.
     *
     * @template {typeof GLTFProperty} T - The GLTFProperty subclass type
     * @this {T} - The constructor of the GLTFProperty subclass
     * @param {Record<string, any>} json - The JSON representation of the GLTFProperty
     * @param {Partial<FromJSONGraph>} [graph] - The graph for creating the instance from JSON.
     * @returns {InstanceType<T>}
     */
    static fromJSON(json, graph = {}) {
        const { json: preparedJson, graph: preparedGraph } = this.prepareJSON(json, graph);
        return /** @type {InstanceType<T>} */(unmarshall(preparedJson, preparedGraph, this));
    }

    /**
     * Hook for subclasses to customize JSON/graph before unmarshalling.
     * @param {Record<string, any>} json - Original JSON payload.
     * @param {Partial<FromJSONGraph>} graph - Original graph.
     * @returns {PreparedFromJSON}
     */
    static prepareJSON(json, graph) {
        graph.root ??= json;
        return /** @type {PreparedFromJSON} */({ json, graph });
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

/**
 * Resolves a JSON Pointer within the context of a GLTFProperty.
 *
 * [Reference Spec - Pointers](https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/ObjectModel.adoc#4-core-pointers)
 */
export class JSONPointer {
    /**
     * @typedef {{
     *  instances: WeakMap<Record<string, unknown>, GLTFProperty | Record<string, unknown>>
     *  root: Record<string, unknown>,
     *  target: Record<string, unknown>,
     * }} JSONPointerReferences
     */

    /**
     * @type {JSONPointerReferences | null}
     */
    #references;

    /**
     * @type {Record<string, unknown>|undefined}
     */
    #target;

    /**
     * @type {Record<string, unknown>|undefined}
     */
    #rootTarget;


    /**
     * Creates a new instance of JSONPointer.
     * @param {string} pointer - The JSON Pointer string
     * @param {Record<string, any>} root - The root glTF object
     */
    constructor(pointer, root) {
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
         * The collection name this JSON Pointer targets.
         * This is used to update the scene graph during animations.
         */
        this.collection = collection;

        /**
         * The property name within the target object.
         */
        this.path = path;

        this.#references = {
            instances: ensureInstances(root),
            root: target,
            target: tokens.slice(0, -1).reduce((obj, key) => obj[key], root),
        }
    }

    /**
     * The target object of this JSON Pointer.
     */
    get target() {
        if(this.#target) return this.#target;
        this.#resolve();
        return this.#target;
    }

    /**
     * The root target object of this JSON Pointer.
     * This is used to update the scene graph during animations.
     * This may be identical to the target.
     */
    get rootTarget() {
        if(this.#rootTarget) return this.#rootTarget;
        this.#resolve();
        return this.#rootTarget;
    }

    /**
     * Gets the value at the JSON Pointer's path.
     */
    get value() {
        return this.target[this.path];
    }

    /**
     * Sets the value at the JSON Pointer's path.
     * @param {unknown} v - The value to set
     */
    set value(v) {
        this.target[this.path] = v;
    }

    /**
     * @returns {asserts this is { #target: Record<string, unknown>, #rootTarget: Record<string, unknown> }}
     */
    #resolve() {
        const refs = /** @type {JSONPointerReferences} */(this.#references);

        const rootTarget = refs.instances.get(refs.root);
        const target     = refs.instances.get(refs.target) ?? refs.target; // may not be a GLTFProperty

        if(!rootTarget || !target) throw new Error('Invalid State');

        this.#rootTarget = /** @type {Record<string, unknown>} */(rootTarget);
        this.#target     = /** @type {Record<string, unknown>} */(target);

        // allow garbage collection of unmarshalled json after first resolve call
        this.#references = null;
    }
}
