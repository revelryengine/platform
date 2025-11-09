/// <reference path="./extensions.types.d.ts" />

/**
 * @import  { ExtendablePropertyNames } from 'virtual-rev-gltf-extensions';
 */

/**
 * glTF Extensions Registry
 *
 * @remarks
 * ```js
 * // EXT_example.js
 * ```
 * ```ts
 * // EXT_example.types.d.ts
 * declare module 'virtual-rev-gltf-extensions' {
 *    interface nodeExtensions {
 *        EXT_example?: extExampleNode;
 *    }
 *
 *    interface NodeExtensions {
 *        EXT_example?: EXTExampleNode;
 *    }
 *
 *    interface ExtendableProperties {
 *        EXTExampleNode: true,
 *    }
 *
 *    interface extExampleNodeExtensions {}
 *    interface EXTExampleNodeExtensions {}
 * }
 *
 * const n = new GLTFNode({ extensions: { EXT_example: { } } });
 * console.log(n.extensions.EXT_example) // EXTExampleNode
 * ```
 *
 * @module
 */

/**
 * @import {GLTFProperty} from '../gltf-property.js'
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
 * Extensions
 */
export const registry = new GLTFExtensionRegistry();
