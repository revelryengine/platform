import { GLTFProperty } from '../gltf-property.js';
import { TextureInfo  } from '../texture-info.js';
import { extensions   } from './extensions.js';


/**
 * @typedef {{
 *  iridescenceFactor?:           number,
 *  iridescenceTexture?:          import('../texture-info.js').textureInfo,
 *  iridescenceIor?:              number,
 *  iridescenceThicknessMinimum?: number,
 *  iridescenceThicknessMaximum?: number,
 *  iridescenceThicknessTexture?: import('../texture-info.js').textureInfo,
 *  extensions?:                  Revelry.GLTF.Extensions.khrMaterialsIridescenceMaterial,
 * } & import('../gltf-property.js').glTFPropertyData} khrMaterialsIridescenceMaterial
 */

/**
 * The iridescence materials are defined by adding the KHR_materials_iridescence extension to any glTF material.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_iridescence
 */

export class KHRMaterialsIridescenceMaterial extends GLTFProperty {
    /**
     * @param {{
     *  iridescenceFactor?:           number,
     *  iridescenceTexture?:          TextureInfo,
     *  iridescenceIor?:              number,
     *  iridescenceThicknessMinimum?: number,
     *  iridescenceThicknessMaximum?: number,
     *  iridescenceThicknessTexture?: TextureInfo,
     *  extensions?:                  Revelry.GLTF.Extensions.KHRMaterialsIridescenceMaterial,
     * } & import('../gltf-property.js').GLTFPropertyData} khrMaterialsIridescenceMaterial
     */
    constructor(khrMaterialsIridescenceMaterial) {
        super(khrMaterialsIridescenceMaterial);

        const {
            iridescenceFactor = 1, iridescenceTexture, iridescenceIor = 1.3,
            iridescenceThicknessMinimum = 0, iridescenceThicknessMaximum = 400, iridescenceThicknessTexture, extensions
        } = khrMaterialsIridescenceMaterial;

        /**
         * The iridescence intensity factor.
         */
        this.iridescenceFactor = iridescenceFactor;

        /**
         * The iridescence intensity texture. The values are sampled from the R channel. These values are linear. If a texture is not given, a value of `1.0` **MUST** be assumed. If other channels are present (GBA), they are ignored for iridescence intensity calculations.
         */
        this.iridescenceTexture = iridescenceTexture;

        /**
         * The index of refraction of the dielectric thin-film layer.
         */
        this.iridescenceIor = iridescenceIor;

        /**
         * The minimum thickness of the thin-film layer given in nanometers. The value **MUST** be less than or equal to the value of `iridescenceThicknessMaximum`.
         */
        this.iridescenceThicknessMinimum = iridescenceThicknessMinimum;

        /**
         * The maximum thickness of the thin-film layer given in nanometers. The value **MUST** be greater than or equal to the value of `iridescenceThicknessMinimum`.
         */
        this.iridescenceThicknessMaximum = iridescenceThicknessMaximum;

        /**
         * The thickness texture of the thin-film layer to linearly interpolate between the minimum and maximum thickness given by
         * the corresponding properties, where a sampled value of `0.0` represents the minimum thickness and a sampled value of `1.0` represents the maximum thickness.
         * The values are sampled from the G channel. These values are linear. If a texture is not given, the maximum thickness **MUST** be assumed.
         * If other channels are present (RBA), they are ignored for thickness calculations.
         */
        this.iridescenceThicknessTexture = iridescenceThicknessTexture;

        this.extensions = extensions;
    }

    /**
     * Creates a KHRMaterialsIridescenceMaterial instance from its JSON representation.
     * @param {khrMaterialsIridescenceMaterial} khrMaterialsIridescenceMaterial
     * @param {import('../gltf-property.js').FromJSONOptions} options
     * @override
     */
    static fromJSON(khrMaterialsIridescenceMaterial, options) {
        return new this(this.unmarshall(khrMaterialsIridescenceMaterial, options, {
            iridescenceTexture:          { factory: TextureInfo },
            iridescenceThicknessTexture: { factory: TextureInfo },
        }, 'KHRMaterialsIridescenceMaterial'));
    }
}

extensions.add('KHR_materials_iridescence', {
    schema: {
        Material: KHRMaterialsIridescenceMaterial,
    },
});
