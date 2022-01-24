import { NamedGLTFProperty } from './gltf-property.js';

/**
 * Texture sampler properties for filtering and wrapping modes.
 * @typedef {namedGLTFProperty} sampler
 * @property {Number} [magFilter] - Magnification filter.
 * @property {Number} [minFilter] - Minification filter.
 * @property {Number} [wrapS=WebGLRenderingContext.REPEAT] - s wrapping mode.
 * @property {Number} [wrapT=WebGLRenderingContext.REPEAT] - t wrapping mode.
 *
 * @see https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#samplers
 */


/**
 * A class wrapper around the glTF sampler object.
 */
export class Sampler extends NamedGLTFProperty {
    /**
     * Creates an instance of Sampler.
     * @param {sampler} sampler - The properties of the sampler.
     */
    constructor(sampler) {
        super(sampler);
        
        const {
            magFilter, minFilter,
            wrapS = WebGLRenderingContext.REPEAT, wrapT = WebGLRenderingContext.REPEAT,
        } = sampler;
        
        /**
         * Magnification filter.
         * @type {Number}
         */
        this.magFilter = magFilter;
        
        /**
         * Minification filter.
         * @type {Number}
         */
        this.minFilter = minFilter;
        
        /**
         * s wrapping mode.
         * @type {Number}
         */
        this.wrapS = wrapS;
        
        /**
         * t wrapping mode.
         * @type {Number}
         */
        this.wrapT = wrapT;
    }
}

export default Sampler;

