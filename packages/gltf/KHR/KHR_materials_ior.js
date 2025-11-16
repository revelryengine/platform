/// <reference path="./KHR_materials_ior.types.d.ts" />

/**
 * The index of refraction of a material is configured by adding the KHR_materials_ior extension to any glTF material.
 *
 * [Reference Spec - KHR_materials_ior](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_ior)
 *
 * @module
 */

import { GLTFProperty } from '../gltf-property.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, FromJSONGraph } from '../gltf-property.js';
 * @import { materialKHRMaterialsIORExtensions, MaterialKHRMaterialsIORExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @typedef {object} materialKHRMaterialsIOR - KHR_materials_ior JSON representation.
 * @property {number} [ior] - The index of refraction.
 * @property {materialKHRMaterialsIORExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_materials_ior class representation.
 */
export class MaterialKHRMaterialsIOR extends GLTFProperty {
    /**
     * Creates a new instance of KHRMaterialsIORMaterial.
     * @param {{
     *  ior?:        number
     *  extensions?: MaterialKHRMaterialsIORExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_materials_ior object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { ior = 1.5, extensions } = unmarshalled;

        /**
         * The index of refraction.
         */
        this.ior = ior;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {materialKHRMaterialsIOR & glTFPropertyData} materialKHRMaterialsIOR - The KHR_materials_ior JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(materialKHRMaterialsIOR, graph) {
        return this.unmarshall(graph, materialKHRMaterialsIOR, {
            // No reference fields
        }, this);
    }
}

GLTFProperty.extensions.add('KHR_materials_ior', {
    schema: {
        Material: MaterialKHRMaterialsIOR,
    },
});
