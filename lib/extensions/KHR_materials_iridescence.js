import { extensions   } from '../extensions.js';
import { GLTFProperty } from '../gltf-property.js';
import { TextureInfo  } from '../texture-info.js';

/**
 * @see https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_iridescence
 */

/**
 * KHR_materials_iridescence material extension
 * @typedef {glTFProperty} khrMaterialsIridescenceMaterial
 * @property {Number} [iridescenceFactor=0] - The iridescence intensity factor.
 * @property {textureInfo} [iridescenceTexture] - The iridescence intensity texture.
 * @property {Number} [iridescenceIor=1.3] - The index of refraction of the dielectric thin-film layer.
 * @property {Number} [iridescenceThicknessMinimum=0] - The minimum thickness of the thin-film layer given in nanometers.
 * @property {Number} [iridescenceThicknessMaximum=400] - The maximum thickness of the thin-film layer given in nanometers.
 * @property {textureInfo} [iridescenceThicknessTexture] - The thickness texture of the thin-film layer.
 */

/**
 * A class wrapper for the material khrMaterialsIridescenceMaterial object.
 */
export class KHRMaterialsIridescenceMaterial extends GLTFProperty {
    /**
     * Creates an instance of KHRMaterialsIridescenceMaterial.
     * @param {khrMaterialsIridescenceMaterial} khrMaterialsIridescenceMaterial - The properties of the KHR_materials_iridescence material extension.
     */
    constructor(khrMaterialsIridescenceMaterial) {
        super(khrMaterialsIridescenceMaterial);
        
        const { iridescenceFactor = 1, iridescenceTexture, iridescenceIor = 1.3, iridescenceThicknessMinimum = 0, iridescenceThicknessMaximum = 400, iridescenceThicknessTexture } = khrMaterialsIridescenceMaterial;
        
        /**
         * The iridescence intensity factor.
         * @type {Number[]}
         */
        this.iridescenceFactor = iridescenceFactor;
        
        /**
         * The iridescence intensity texture. The values are sampled from the R channel. These values are linear. If a texture is not given, a value of `1.0` **MUST** be assumed. If other channels are present (GBA), they are ignored for iridescence intensity calculations.
         * @type {TextureInfo}
         */
        this.iridescenceTexture = iridescenceTexture ? new TextureInfo(iridescenceTexture) : undefined;
        
        /**
         * The index of refraction of the dielectric thin-film layer.
         * @type {Number}
         */
        this.iridescenceIor = iridescenceIor;

        /**
         * The minimum thickness of the thin-film layer given in nanometers. The value **MUST** be less than or equal to the value of `iridescenceThicknessMaximum`.
         * @type {Number}
         */
        this.iridescenceThicknessMinimum = iridescenceThicknessMinimum;

        /**
         * The maximum thickness of the thin-film layer given in nanometers. The value **MUST** be greater than or equal to the value of `iridescenceThicknessMinimum`.
         * @type {Number}
         */
        this.iridescenceThicknessMaximum = iridescenceThicknessMaximum;
        
        /**
         * The thickness texture of the thin-film layer to linearly interpolate between the minimum and maximum thickness given by the corresponding properties, where a sampled value of `0.0` represents the minimum thickness and a sampled value of `1.0` represents the maximum thickness. The values are sampled from the G channel. These values are linear. If a texture is not given, the maximum thickness **MUST** be assumed. If other channels are present (RBA), they are ignored for thickness calculations.
         * @type {TextureInfo}
         */
        this.iridescenceThicknessTexture = iridescenceThicknessTexture ? new TextureInfo(iridescenceThicknessTexture) : undefined;
    }
    
    static referenceFields = [
        { name: 'iridescenceTexture',          type: 'sub' },
        { name: 'iridescenceThicknessTexture', type: 'sub' },
    ];
}

extensions.set('KHR_materials_iridescence', {
    schema: {
        Material: KHRMaterialsIridescenceMaterial,
    },
});
