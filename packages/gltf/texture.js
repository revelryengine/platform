/**
 * A texture and its sampler.
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-texture
 *
 * @module
 */

import { NamedGLTFProperty } from './gltf-property.js';
import { Image             } from './image.js';
import { Sampler           } from './sampler.js';

/**
 * @import { namedGLTFPropertyData, NamedGLTFPropertyData, FromJSONGraph } from './gltf-property.js';
 * @import { textureExtensions, TextureExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @typedef {object} texture - Texture JSON representation.
 * @property {number} [sampler] - The index of the sampler used by this texture.
 * @property {number} [source] - The index of the image used by this texture.
 * @property {textureExtensions} [extensions] - Extension-specific data.
 */

/**
 * Texture class representation.
 */
export class Texture extends NamedGLTFProperty {
    /**
     * Boolean to indicate that texture uses sRGB transfer function
     * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#metallic-roughness-material
     */
    #sRGB = false;

    /**
     * Creates an instance of Texture.
     * @param {{
     *  sampler?:    Sampler,
     *  source?:     Image,
     *  extensions?: TextureExtensions,
     * } & NamedGLTFPropertyData} unmarshalled - Unmarshalled texture object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { sampler, source, extensions } = unmarshalled;

        /**
         * The Sampler used by this texture. When undefined, a sampler with repeat wrapping and
         * auto filtering should be used.
         */
        this.sampler = sampler;

        /**
         * The Image used by this texture.
         */
        this.source = source;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Returns the source image of this texture from any extensions that may be present or falls back to the default source.
     */
    getSource() {
        return this.extensions?.EXT_texture_webp?.source ?? this.source;
    }

    /**
     * Creates an instance from JSON data.
     * @param {texture & namedGLTFPropertyData} texture - The texture JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(texture, graph) {
        return this.unmarshall(graph, texture, {
            sampler: { factory: Sampler, collection: 'samplers' },
            source:  { factory: Image,   collection: 'images'   },
        }, this);
    }

    /**
     * Set this to true indicate that texture uses sRGB transfer function
     * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#metallic-roughness-material
     *
     * @param {boolean} v - Whether this texture uses sRGB transfer function.
     */
    set sRGB(v) {
        this.#sRGB = v;
    }

    /**
     * Returns whether this texture uses sRGB transfer function.
     */
    get sRGB() {
        return this.#sRGB;
    }
}

