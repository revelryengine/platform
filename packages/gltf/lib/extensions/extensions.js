
/**
 * @import {GLTFProperty} from '../gltf-property.js'
 */
/**
 * Extensions interface
 */
class GLTFExtensionsSet {
    /** @type {Set<Revelry.GLTF.Extensions.Supported>} */
    #supportedExtensions = new Set();

    /** @type {Record<string, Record<string, typeof GLTFProperty>>} */
    #schemas = {};

    /**
     * Adds a new extension to the set.
     * @template {Revelry.GLTF.Extensions.Supported} E
     * @param {E} name
     * @param {{ schema: { [K in Revelry.GLTF.Extensions.ExtendablePropertyNames]?: typeof GLTFProperty } }} config
     */
    add(name, config) {
        this.#supportedExtensions.add(name);

        for(const entry of Object.entries(config.schema)) {
            const [property, factory] = /** @type {[Revelry.GLTF.Extensions.ExtendablePropertyNames, typeof GLTFProperty ]} */(entry);
            this.#schemas[property] ??= {}
            this.#schemas[property][name] = factory;
        }
    }

    /**
     * Retrieves the factory function for a specific property and extension.
     * @param {Revelry.GLTF.Extensions.ExtendablePropertyNames} property
     * @param {string} name
     */
    getFactory(property, name) {
        return this.#schemas[property]?.[name];
    }

    /**
     * Checks if an extension is supported.
     * @param {Revelry.GLTF.Extensions.Supported} name
     */
    isSupported(name) {
        return this.#supportedExtensions.has(name);
    }
}

export const extensions = new GLTFExtensionsSet();
