import { extensions } from './extensions.js';

/**
 * @typedef {Extract<keyof Revelry.GLTF.Extensions.ExtendableProperties, string>} PropertyName
 */

/**
 * @typedef {{
 *  extensions?: { [key in Revelry.GLTF.Extensions.Supported]?: glTFPropertyData }
 *  extras?: { [key: string]: unknown }
 * }} glTFPropertyData
 */

/**
 * @typedef {{
 *  extensions?: { [key in Revelry.GLTF.Extensions.Supported]?: GLTFPropertyData }
 *  extras?: { [key: string]: unknown }
 * }} GLTFPropertyData
 */

/**
 * @typedef {glTFPropertyData & { name?: string }} namedGLTFPropertyData
 */

/**
 * @typedef {GLTFPropertyData & { name?: string }} NamedGLTFPropertyData
 */


/**
 * @typedef {{ root: Record<string, any>, uri?: URL, parent?: Record<string, any> }} FromJSONOptions
 */

/**
 * @typedef {{
 *  factory?:    typeof GLTFProperty | typeof URL,
 *  collection?: string | string[],
 *  location?:   'root' | 'parent',
 *  assign?:     Record<string, any>,
 * }} ReferenceField
 */

/**
 * @template {glTFPropertyData} T
 * @typedef {T[] | undefined} glTFCollection
 */

/**
 * @template T
 * @typedef {undefined extends T ? undefined : never } CanBeUndefined
 */

/**
 * @typedef {{ fromJSON: (json: Record<string, any>, options: { uri: URL, root: Record<string, any>, parent?: Record<string, any>, instances?: WeakMap<any, any> }) => any }} GLTFPropertyConstructor
 */

const pending = new WeakMap();

/**
 * GLTFProperty
 */
export class GLTFProperty {
    /**
     * @param {GLTFPropertyData} glTFProperty - The properties of the GLTFProperty
     */
    constructor({ extensions, extras }) {
        this.extensions = extensions;
        this.extras = extras;
    }

    /**
     * @param {AbortSignal} [signal]
     */
    async load(signal) {
        this.extensions && await Promise.all(Object.values(this.extensions).map(ext => {
            return ext instanceof GLTFProperty && ext.load(signal);
        }));
        return this;
    }

    /**
     * @param {AbortSignal} [signal]
     */
    async loadOnce(signal) {
        await (pending.get(this) || pending.set(this, this.load(signal)).get(this));
        return this;
    }

    /**
     * @param {Record<string, any>} json
     * @param {FromJSONOptions} options
     */
    static fromJSON(json, options) {
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
     * @template {PropertyName | undefined} N
     * @template {N extends undefined ? Record<string, any> : glTFPropertyData} J
     * @template {Partial<Record<keyof J, ReferenceField>>} R
     * @param {J} json
     * @param {FromJSONOptions} options
     * @param {R} referenceFields
     * @param {N} [extKey]
     * @return {{
     *  [K in keyof R]: (J[K] extends glTFCollection<any>
     *      ? R[K]['factory'] extends undefined
     *          ? J[K][]
     *          : InstanceType<R[K]['factory']>[]
     *      : R[K]['factory'] extends undefined
     *          ? J[K]
     *          : InstanceType<R[K]['factory']>) | CanBeUndefined<J[K]>
     * } & Omit<J, keyof R> & { extensions?: Partial<Revelry.GLTF.Extensions.ExtendableProperties[N]> }}
     */
    static unmarshall(json, { uri, root, parent = {} }, referenceFields, extKey) {
        const instances = GLTFProperty.#ensureInstances(root);

        const locations = /** @type {const} */({ root, parent });

        // constructor, collection, location, alias, assign
        // arrays and attributes object
        // handle case without constructor (plain POJO, XMP extension)

        /** @type {Partial<Record<keyof R, any>>} */
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
            const [name, { factory, collection, location = 'root', assign }] = /** @type {[keyof J, ReferenceField]} */(entry);

            const value = json[name];

            if(value != undefined) {
                let result;

                if(factory === URL) {
                    result = new URL(/** @type {string} */(value), uri);
                } else if(collection) {
                    const srcLocation   = locations[location];
                    const srcCollection = typeof collection === 'string' ? srcLocation[collection] : collection.reduce((obj, key) => obj[key], srcLocation);

                    if(value instanceof Array) {
                        result = [];
                        for(const v of value) {
                            const srcObject = srcCollection[v];
                            result.push(ensureInstance(srcObject, /** @type {typeof GLTFProperty|undefined} */(factory)));
                        }
                    } else {
                        const srcObject = srcCollection[value];
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
                        const srcObject = value;
                        result = ensureInstance(srcObject, /** @type {typeof GLTFProperty|undefined} */(factory));
                        if(assign) {
                            Object.assign(result, assign);
                        }
                    }
                }

                references[name] = result;
            }
        }

        const result = {
            ...json,
            ...references,
        }
        if(json.extensions && extKey) {
            result.extensions = Object.fromEntries(Object.entries(json.extensions).map(([name, value]) => {
                const factory = extensions.getFactory(extKey, name);
                if(factory) {
                    return [name, ensureInstance(value, factory)];
                }
                return [name, value];
            }));
        }
        return result
    }

    /**
     * @param {string} pointer
     * @param {Record<string, any>} root
     *
     * @see https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/ObjectModel.adoc#4-core-pointers
     */
    static unmarshallJSONPointerResolver(pointer, root) {
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

            return /** @type {{ root: { collection: string, target: any }, target: any, path: string }} */(state);
        }

        return resolve;
    }
}

/**
 * NamedGLTFProperty
 * @extends {GLTFProperty}
 */
export class NamedGLTFProperty extends GLTFProperty {
    /**
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
