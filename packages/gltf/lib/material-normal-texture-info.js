import { TextureInfo } from './texture-info.js';
import { Texture     } from './texture.js';

/**
 * @typedef {{
 *  index:       number,
 *  texCoord?:   number,
 *  scale?:      number,
 *  extensions?: Revelry.GLTF.Extensions.materialNormalTextureInfo,
 * } & import('./gltf-property.js').glTFPropertyData} materialNormalTextureInfo
 */

/**
 * Reference to a texture.
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-material-normaltextureinfo
 */
export class MaterialNormalTextureInfo extends TextureInfo {
    /**
     * @param {{
     *  texture:     Texture,
     *  texCoord?:   number,
     *  scale?:      number,
     *  extensions?: Revelry.GLTF.Extensions.MaterialNormalTextureInfo,
     * } & import('./gltf-property.js').GLTFPropertyData} materialNormalTextureInfo
     */
    constructor(materialNormalTextureInfo) {
        super(materialNormalTextureInfo);

        const { scale = 1, extensions } = materialNormalTextureInfo;

        /**
         * The scalar multiplier applied to each normal vector of the normal texture.
         * @type {Number}
         */
        this.scale = scale;

        this.extensions = extensions;
    }

    /**
     * Creates a MaterialNormalTextureInfo instance from a JSON representation.
     * @param {materialNormalTextureInfo} materialNormalTextureInfo
     * @param {import('./gltf-property.js').FromJSONOptions} options
     * @override
     */
    static fromJSON(materialNormalTextureInfo, options) {
        const unmarshalled = this.unmarshall(materialNormalTextureInfo, options, {
            index: { factory: Texture, collection: 'textures' },
        }, 'MaterialNormalTextureInfo');

        return new this({
            ...unmarshalled,
            texture: unmarshalled.index,
        });
    }
}
