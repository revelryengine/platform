/**
 * Texture sampler properties for filtering and wrapping modes.
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-sampler
 *
 * @module
 */

import { NamedGLTFProperty } from './gltf-property.js';
import { GL } from './constants.js';

/**
 * @import { namedGLTFPropertyData, NamedGLTFPropertyData, FromJSONGraph } from './gltf-property.js';
 * @import { samplerExtensions, SamplerExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @typedef {object} sampler - Sampler JSON representation.
 * @property {typeof GL.NEAREST | typeof GL.LINEAR} [magFilter] - Magnification filter.
 * @property {typeof GL.NEAREST | typeof GL.LINEAR | typeof GL.NEAREST_MIPMAP_NEAREST | typeof GL.LINEAR_MIPMAP_NEAREST | typeof GL.NEAREST_MIPMAP_LINEAR | typeof GL.LINEAR_MIPMAP_LINEAR} [minFilter] - Minification filter.
 * @property {typeof GL.CLAMP_TO_EDGE | typeof GL.MIRRORED_REPEAT | typeof GL.REPEAT} [wrapS] - s wrapping mode.
 * @property {typeof GL.CLAMP_TO_EDGE | typeof GL.MIRRORED_REPEAT | typeof GL.REPEAT} [wrapT] - t wrapping mode.
 * @property {samplerExtensions} [extensions] - Extension-specific data.
 */

/**
 * Sampler class representation.
 */
export class Sampler extends NamedGLTFProperty {
    /**
     * Creates an instance of Sampler.
     * @param {{
     *  magFilter?:  sampler['magFilter'],
     *  minFilter?:  sampler['minFilter'],
     *  wrapS?:      sampler['wrapS'],
     *  wrapT?:      sampler['wrapT'],
     *  extensions?: SamplerExtensions,
     * } & NamedGLTFPropertyData} unmarshall - Unmarshalled sampler object
     */
    constructor(unmarshall) {
        super(unmarshall);

        const { magFilter, minFilter, wrapS = GL.REPEAT, wrapT = GL.REPEAT, extensions } = unmarshall;

        /**
         * Magnification filter.
         */
        this.magFilter = magFilter;

        /**
         * Minification filter.
         */
        this.minFilter = minFilter;

        /**
         * s wrapping mode.
         */
        this.wrapS = wrapS;

        /**
         * t wrapping mode.
         */
        this.wrapT = wrapT;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {sampler & namedGLTFPropertyData} sampler - The sampler JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(sampler, graph) {
        return this.unmarshall(graph, sampler, {
            // No reference fields
        }, this);
    }
}
