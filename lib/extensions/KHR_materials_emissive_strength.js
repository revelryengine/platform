import { GLTFProperty } from '../gltf-property.js';
import { extensions   } from '../extensions.js';

/**
 * @typedef {{
 *  emissiveStrength?: number,
 *  extensions?:       Revelry.GLTF.Extensions.khrMaterialsEmissiveStrengthMaterial,
 * } & import('../gltf-property.js').glTFPropertyData} khrMaterialsEmissiveStrengthMaterial
 */

/**
 * In this extension, a new emissiveStrength scalar factor is supplied, that governs the upper limit of emissive strength per material.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_emissive_strength
 */
export class KHRMaterialsEmissiveStrengthMaterial extends GLTFProperty {
    /**
     * @param {{
     *  emissiveStrength?: number,
     *  extensions?:       Revelry.GLTF.Extensions.KHRMaterialsEmissiveStrengthMaterial,
     * } & import('../gltf-property.js').GLTFPropertyData} khrMaterialsEmissiveStrengthMaterial
     */
    constructor(khrMaterialsEmissiveStrengthMaterial) {
        super(khrMaterialsEmissiveStrengthMaterial);

        const { emissiveStrength = 1.0, extensions } = khrMaterialsEmissiveStrengthMaterial;

        /**
         * The strength adjustment to be multiplied with the material's emissive value.
         */
        this.emissiveStrength = emissiveStrength;

        this.extensions = extensions;
    }

    /**
     * @param {khrMaterialsEmissiveStrengthMaterial} khrMaterialsEmissiveStrengthMaterial
     * @param {import('../gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(khrMaterialsEmissiveStrengthMaterial, options) {
        return new this(this.unmarshall(khrMaterialsEmissiveStrengthMaterial, options, {
        }, 'KHRMaterialsEmissiveStrengthMaterial'));
    }
}

extensions.add('KHR_materials_emissive_strength', {
    schema: {
        Material: KHRMaterialsEmissiveStrengthMaterial,
    },
});
