import { GLTFProperty              } from '../gltf-property.js';
import { TextureInfo               } from '../texture-info.js';
import { MaterialNormalTextureInfo } from '../material-normal-texture-info.js';
import { extensions                } from './extensions.js';

/**
 * @typedef {{
 *  clearcoatFactor?:           number,
 *  clearcoatTexture?:          import('../texture-info.js').textureInfo,
 *  clearcoatRoughnessFactor?:  number,
 *  clearcoatRoughnessTexture?: import('../texture-info.js').textureInfo,
 *  clearcoatNormalTexture?:    import('../material-normal-texture-info.js').materialNormalTextureInfo,
 *  extensions?:                Revelry.GLTF.Extensions.khrMaterialsClearcoatMaterial,
 * } & import('../gltf-property.js').glTFPropertyData} khrMaterialsClearcoatMaterial
 */

/**
 * This extension defines a clear coating that can be layered on top of an existing glTF material definition.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_clearcoat
 */
export class KHRMaterialsClearcoatMaterial extends GLTFProperty {
    /**
     * @param {{
     *  clearcoatFactor?:           number,
     *  clearcoatTexture?:          TextureInfo,
     *  clearcoatRoughnessFactor?:  number,
     *  clearcoatRoughnessTexture?: TextureInfo,
     *  clearcoatNormalTexture?:    MaterialNormalTextureInfo,
     *  extensions?:                Revelry.GLTF.Extensions.KHRMaterialsClearcoatMaterial,
     * } & import('../gltf-property.js').GLTFPropertyData} khrMaterialsClearcoatMaterial
     */
    constructor(khrMaterialsClearcoatMaterial) {
        super(khrMaterialsClearcoatMaterial);

        const { clearcoatFactor = 0, clearcoatTexture, clearcoatRoughnessFactor = 0, clearcoatRoughnessTexture, clearcoatNormalTexture, extensions } = khrMaterialsClearcoatMaterial;

        /**
         * The clearcoat layer intensity (aka opacity) of the material. A value of 0.0 means the material has no clearcoat layer enabled.
         */
        this.clearcoatFactor = clearcoatFactor;

        /**
         * The clearcoat layer intensity texture. Stored in channel R with default linear value 1.0.
         */
        this.clearcoatTexture = clearcoatTexture;

        /**
         * The clearcoat layer roughness of the material.
         */
        this.clearcoatRoughnessFactor = clearcoatRoughnessFactor;

        /**
         * The clearcoat layer roughness texture. Stored in channel G with default linear value 1.0.
         */
        this.clearcoatRoughnessTexture = clearcoatRoughnessTexture;

        /**
         * A tangent space normal map for the clearcoat layer.
         */
        this.clearcoatNormalTexture = clearcoatNormalTexture;

        this.extensions = extensions;
    }

    /**
     * Creates a KHRMaterialsClearcoatMaterial instance from its JSON representation.
     * @param {khrMaterialsClearcoatMaterial} khrMaterialsClearcoatMaterial
     * @param {import('../gltf-property.js').FromJSONOptions} options
     * @override
     */
    static fromJSON(khrMaterialsClearcoatMaterial, options) {
        return new this(this.unmarshall(khrMaterialsClearcoatMaterial, options, {
            clearcoatTexture:          { factory: TextureInfo               },
            clearcoatRoughnessTexture: { factory: TextureInfo               },
            clearcoatNormalTexture:    { factory: MaterialNormalTextureInfo },
        }, 'KHRMaterialsClearcoatMaterial'));
    }
}

extensions.add('KHR_materials_clearcoat', {
    schema: {
        Material: KHRMaterialsClearcoatMaterial,
    },
});
