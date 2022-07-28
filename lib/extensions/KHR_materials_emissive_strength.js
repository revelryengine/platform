import { extensions   } from '../extensions.js';
import { GLTFProperty } from '../gltf-property.js';

/**
 * @see https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_emissive_strength
 */

/**
 * KHR_materials_emissive_strength material extension
 * @typedef {glTFProperty} khrMaterialsEmissiveStrengthMaterial
 * @property {Number} [emissiveStrength=1.0] - The strength adjustment to be multiplied with the material's emissive value.
 */

/**
 * A class wrapper for the material khrMaterialsEmissiveStrengthMaterial object.
 */
export class KHRMaterialsEmissiveStrengthMaterial extends GLTFProperty {
    /**
     * Creates an instance of KHRMaterialsEmissiveStrengthMaterial.
     * @param {khrMaterialsEmissiveStrengthMaterial} khrMaterialsEmissiveStrengthMaterial - The properties of the KHR_materials_emissive_strength material extension.
     */
    constructor(khrMaterialsEmissiveStrengthMaterial) {
        super(khrMaterialsEmissiveStrengthMaterial);
        
        const { emissiveStrength = 1.0 } = khrMaterialsEmissiveStrengthMaterial;
        
        /**
         * The strength adjustment to be multiplied with the material's emissive value.
         * @type {Number}
         */
        this.emissiveStrength = emissiveStrength;
    }
}

extensions.set('KHR_materials_emissive_strength', {
    schema: {
        Material: KHRMaterialsEmissiveStrengthMaterial,
    },
});
