import { NamedGLTFProperty } from './gltf-property.js';

/**
 * A texture and its sampler.
 * @typedef {namedGLTFProperty} texture
 * @property {Number} [sampler] - The index of the sampler used by this texture. When undefined, a sampler with repeat
 *  wrapping and auto filtering should be used.
 * @property {Number} [source] - The index of the image used by this texture.
 *
 * @see https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#texture
 */

/**
 * A class wrapper around the glTF texture object.
 */
export class Texture extends NamedGLTFProperty {
    /**
     * Boolean to indicate that texture uses sRGB transfer function 
     * @see https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#metallic-roughness-material
     */ 
    #sRGB = false;
    
    
    /**
     * Creates an instance of Texture.
     * @param {texture} texture - The properties of the texture.
     */
    constructor(texture) {
        super(texture);
        
        const { sampler, source } = texture;
        
        /**
         * The Sampler or the index of the Sampler used by this texture. When undefined, a sampler with repeat wrapping and
         * auto filtering should be used.
         * @type {Number|Sampler}
         */
        this.sampler = sampler;
        
        /**
         * The Image or the index of the Image used by this texture.
         * @type {Number|Image}
         */
        this.source = source;
    }
    
    static referenceFields = [
        { name: 'sampler', type: 'collection', collection: 'samplers' },
        { name: 'source',  type: 'collection', collection: 'images' },
    ];
    
    /**
     * Set this to true indicate that texture uses sRGB transfer function 
     * @see https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#metallic-roughness-material
     */ 
    set sRGB(v) {
        this.#sRGB = v;
    }
    
    get sRGB() {
        return this.#sRGB;
    }
}

export default Texture;

