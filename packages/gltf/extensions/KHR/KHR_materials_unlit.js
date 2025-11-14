/// <reference path="./KHR_materials_unlit.types.d.ts" />

/**
 * This extension defines an unlit shading model for use in glTF 2.0 materials, as an alternative to the Physically Based Rendering (PBR) shading models provided by the core specification.
 *
 * [Reference Spec - KHR_materials_unlit](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_unlit)
 *
 * @module
 */

import { GLTFProperty } from '../../gltf-property.js';
import { registry     } from '../registry.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, FromJSONGraph } from '../../gltf-property.js';
 * @import { materialKHRMaterialsUnlitExtensions, MaterialKHRMaterialsUnlitExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 *
 * @typedef {object} materialKHRMaterialsUnlit - KHR_materials_unlit JSON representation.
 * @property {materialKHRMaterialsUnlitExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_materials_unlit class representation.
 */
export class MaterialKHRMaterialsUnlit extends GLTFProperty {
    /**
     * Creates a new instance of MaterialKHRMaterialsUnlit.
     * @param {{
     *  extensions?: MaterialKHRMaterialsUnlitExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_materials_unlit object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { extensions } = unmarshalled;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {materialKHRMaterialsUnlit & glTFPropertyData} materialKHRMaterialsUnlit - The KHR_materials_unlit JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(materialKHRMaterialsUnlit, graph) {
        return this.unmarshall(graph, materialKHRMaterialsUnlit, {
            // No reference fields
        }, this);
    }
}

registry.add('KHR_materials_unlit', {
    schema: {
        Material: MaterialKHRMaterialsUnlit,
    },
});
