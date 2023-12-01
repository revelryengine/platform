import { TextureInfo } from './texture-info.js';
import { Texture     } from './texture.js';

/**
 * @typedef {{
 *  index:       number,
 *  texCoord?:   number,
 *  strength?:   number,
 *  extensions?: Revelry.GLTF.Extensions.materialNormalTextureInfo,
 * } & import('./gltf-property.js').glTFPropertyData} materialOcclusionTextureInfo
 */

/**
 * A reference to a texture
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-material-occlusiontextureinfo
 */
export class MaterialOcclusionTextureInfo extends TextureInfo {
    /**
     * @param {{
     *  texture:     Texture,
     *  texCoord?:   number,
     *  strength?:   number,
     *  extensions?: Revelry.GLTF.Extensions.MaterialOcclusionTextureInfo,
     * } & import('./gltf-property.js').GLTFPropertyData} materialOcclusionTextureInfo
     */
    constructor(materialOcclusionTextureInfo) {
        super(materialOcclusionTextureInfo);

        const { strength = 1, extensions } = materialOcclusionTextureInfo;

        /**
         * A scalar multiplier controlling the amount of occlusion applied.
         * @type {Number}
         */
        this.strength = strength;

        this.extensions = extensions;
    }

    /**
     * @param {materialOcclusionTextureInfo} materialOcclusionTextureInfo
     * @param {import('./gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(materialOcclusionTextureInfo, options) {
        const unmarshalled = this.unmarshall(materialOcclusionTextureInfo, options, {
            index: { factory: Texture, collection: 'textures' },
        }, 'MaterialOcclusionTextureInfo');

        return new this({
            ...unmarshalled,
            texture: unmarshalled.index,
        });
    }
}
