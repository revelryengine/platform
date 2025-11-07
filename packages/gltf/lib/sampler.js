import { NamedGLTFProperty } from './gltf-property.js';
import { GL } from './constants.js';

/**
 * @typedef {{
 *  magFilter?:  typeof GL.NEAREST | typeof GL.LINEAR,
 *  minFilter?:  typeof GL.NEAREST | typeof GL.LINEAR | typeof GL.NEAREST_MIPMAP_NEAREST | typeof GL.LINEAR_MIPMAP_NEAREST | typeof GL.NEAREST_MIPMAP_LINEAR | typeof GL.LINEAR_MIPMAP_LINEAR,
 *  wrapS?:      typeof GL.CLAMP_TO_EDGE | typeof GL.MIRRORED_REPEAT | typeof GL.REPEAT
 *  wrapT?:      typeof GL.CLAMP_TO_EDGE | typeof GL.MIRRORED_REPEAT | typeof GL.REPEAT,
 *  extensions?: Revelry.GLTF.Extensions.sampler,
 * } & import('./gltf-property.js').namedGLTFPropertyData} sampler
 */

/**
 * Texture sampler properties for filtering and wrapping modes.
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-sampler
 */
export class Sampler extends NamedGLTFProperty {
    /**
     * @param {{
     *  magFilter?:  sampler['magFilter'],
     *  minFilter?:  sampler['minFilter'],
     *  wrapS?:      sampler['wrapS'],
     *  wrapT?:      sampler['wrapT'],
     *  extensions?: Revelry.GLTF.Extensions.Sampler,
     * } & import('./gltf-property.js').NamedGLTFPropertyData} sampler
     */
    constructor(sampler) {
        super(sampler);

        const { magFilter, minFilter, wrapS = GL.REPEAT, wrapT = GL.REPEAT, extensions } = sampler;

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

        this.extensions = extensions;
    }

    /**
     * @param {sampler} sampler
     * @param {import('./gltf-property.js').FromJSONOptions} options
     * @override
     */
    static fromJSON(sampler, options) {
        return new this(this.unmarshall(sampler, options, {
        }, 'Sampler'));
    }
}
