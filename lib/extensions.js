/**
 * @typedef {Revelry.GLTF.Extensions.Supported} Supported
 * @typedef {keyof Revelry.GLTF.Extensions.ExtendableProperties} PropertyName
 */

/**
 * Extensions interface
 */
class GLTFExtensionsSet {
    /** @type {Set<Supported>} */
    #supportedExtensions = new Set();

    /** @type {Record<string, Record<string, typeof import('./gltf-property.js').GLTFProperty>>} */
    #schemas = {};

    /**
     * @template {Supported} E
     * @param {E} name
     * @param {{ schema: { [K in PropertyName]?: typeof import('./gltf-property.js').GLTFProperty } }} config
     */
    add(name, config) {
        this.#supportedExtensions.add(name);

        for(const entry of Object.entries(config.schema)) {
            const [property, factory] = /** @type {[PropertyName, typeof import('./gltf-property.js').GLTFProperty ]} */(entry);
            this.#schemas[property] ??= {}
            this.#schemas[property][name] = factory;
        }
    }

    /**
     * @param {PropertyName} property
     * @param {string} name
     */
    getFactory(property, name) {
        return this.#schemas[property]?.[name];
    }

    /**
     * @param {Revelry.GLTF.Extensions.Supported} name
     */
    isSupported(name) {
        return this.#supportedExtensions.has(name);
    }
}

export const extensions = new GLTFExtensionsSet();
