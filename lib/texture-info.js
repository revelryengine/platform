import { GLTFProperty } from './gltf-property.js';
import { Texture      } from './texture.js';

/**
 * @typedef {{
 *  index:       number,
 *  texCoord?:   number,
 *  extensions?: Revelry.GLTF.Extensions.textureInfo,
 * } & import('./gltf-property.js').glTFPropertyData} textureInfo
 */

/**
 * Reference to a texture.
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-textureinfo
 */
export class TextureInfo extends GLTFProperty {
    /**
     * @param {{
     *  texture:     Texture,
     *  texCoord?:   number,
     *  extensions?: Revelry.GLTF.Extensions.TextureInfo,
     * } & import('./gltf-property.js').GLTFPropertyData} textureInfo
     */
    constructor(textureInfo) {
        super(textureInfo);

        const { texture, texCoord = 0, extensions } = textureInfo;

        /**
         * The Texture.
         */
        this.texture = texture;

        /**
         * The set index of texture's TEXCOORD attribute used for texture coordinate mapping.
         */
        this.texCoord = texCoord;

        this.extensions = extensions;
    }

    /**
     * @param {textureInfo} textureInfo
     * @param {import('./gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(textureInfo, options) {
        const unmarshalled = this.unmarshall(textureInfo, options, {
            index: { factory: Texture, collection: 'textures' },
        }, 'TextureInfo');

        return new this({
            ...unmarshalled,
            texture: unmarshalled.index,
        });
    }

    /**
     * Set this to true indicate that texture uses sRGB transfer function
     *
     * @see https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#metallic-roughness-material
     *
     * @param {boolean} v
     */
    set sRGB(v) {
        this.texture.sRGB = v;
    }
}
