/// <reference path="./KHR_materials_emissive_strength.types.d.ts" />

/**
 * In this extension, a new emissiveStrength scalar factor is supplied, that governs the upper limit of emissive strength per material.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_emissive_strength
 *
 * @module
 */

import { GLTFProperty } from '../../gltf-property.js';
import { registry     } from '../registry.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, FromJSONGraph } from '../../gltf-property.js';
 * @import { materialKHRMaterialsEmissiveStrengthExtensions, MaterialKHRMaterialsEmissiveStrengthExtensions } from 'virtual-rev-gltf-extensions';
 */

/**
 * @typedef {object} materialKHRMaterialsEmissiveStrength - KHR_materials_emissive_strength JSON representation.
 * @property {number} [emissiveStrength] - The strength adjustment to be multiplied with the material's emissive value.
 * @property {materialKHRMaterialsEmissiveStrengthExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_materials_emissive_strength class representation.
 */
export class MaterialKHRMaterialsEmissiveStrength extends GLTFProperty {
    /**
     * Creates a new instance of KHRMaterialsEmissiveStrengthMaterial.
     * @param {{
     *  emissiveStrength?: number,
     *  extensions?:       MaterialKHRMaterialsEmissiveStrengthExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_materials_emissive_strength object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { emissiveStrength = 1.0, extensions } = unmarshalled;

        /**
         * The strength adjustment to be multiplied with the material's emissive value.
         */
        this.emissiveStrength = emissiveStrength;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {materialKHRMaterialsEmissiveStrength & glTFPropertyData} materialKHRMaterialsEmissiveStrength - The KHR_materials_emissive_strength JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(materialKHRMaterialsEmissiveStrength, graph) {
        return this.unmarshall(graph, materialKHRMaterialsEmissiveStrength, {
            // No reference fields
        }, this);
    }
}

registry.add('KHR_materials_emissive_strength', {
    schema: {
        Material: MaterialKHRMaterialsEmissiveStrength,
    },
});
