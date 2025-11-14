/// <reference path="./KHR_materials_iridescence.types.d.ts" />

/**
 * The iridescence materials are defined by adding the KHR_materials_iridescence extension to any glTF material.
 *
 * [Reference Spec - KHR_materials_iridescence](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_iridescence)
 *
 * @module
 */

import { GLTFProperty } from '../../gltf-property.js';
import { TextureInfo  } from '../../texture-info.js';
import { registry     } from '../registry.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, FromJSONGraph } from '../../gltf-property.js';
 * @import { materialKHRMaterialsIridescenceExtensions, MaterialKHRMaterialsIridescenceExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @import { textureInfo } from '../../texture-info.js';
 */

/**
 * @typedef {object} materialKHRMaterialsIridescence - KHR_materials_iridescence JSON representation.
 * @property {number} [iridescenceFactor] - The iridescence intensity factor.
 * @property {textureInfo} [iridescenceTexture] - The iridescence intensity texture. The values are sampled from the R channel. These values are linear. If a texture is not given, a value of `1.0` **MUST** be assumed. If other channels are present (GBA), they are ignored for iridescence intensity calculations.
 * @property {number} [iridescenceIor] - The index of refraction of the dielectric thin-film layer.
 * @property {number} [iridescenceThicknessMinimum] - The minimum thickness of the thin-film layer given in nanometers. The value **MUST** be less than or equal to the value of `iridescenceThicknessMaximum`.
 * @property {number} [iridescenceThicknessMaximum] - The maximum thickness of the thin-film layer given in nanometers. The value **MUST** be greater than or equal to the value of `iridescenceThicknessMinimum`.
 * @property {textureInfo} [iridescenceThicknessTexture] - The thickness texture of the thin-film layer to linearly interpolate between the minimum and maximum thickness given by the corresponding properties, where a sampled value of `0.0` represents the minimum thickness and a sampled value of `1.0` represents the maximum thickness. The values are sampled from the G channel. These values are linear. If a texture is not given, the maximum thickness **MUST** be assumed. If other
 * @property {materialKHRMaterialsIridescenceExtensions} [extensions] - Extension-specific data.
 */

/**
 *  KHR_materials_iridescence class representation.
 */
export class MaterialKHRMaterialsIridescence extends GLTFProperty {
    /**
     * Creates a new instance of MaterialKHRMaterialsIridescence.
     * @param {{
     *  iridescenceFactor?:           number,
     *  iridescenceTexture?:          TextureInfo,
     *  iridescenceIor?:              number,
     *  iridescenceThicknessMinimum?: number,
     *  iridescenceThicknessMaximum?: number,
     *  iridescenceThicknessTexture?: TextureInfo,
     *  extensions?:                  MaterialKHRMaterialsIridescenceExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_materials_iridescence object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const {
            iridescenceFactor = 1, iridescenceTexture, iridescenceIor = 1.3,
            iridescenceThicknessMinimum = 0, iridescenceThicknessMaximum = 400, iridescenceThicknessTexture, extensions
        } = unmarshalled;

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

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {materialKHRMaterialsIridescence & glTFPropertyData} materialKHRMaterialsIridescence - The KHR_materials_iridescence JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(materialKHRMaterialsIridescence, graph) {
        return this.unmarshall(graph, materialKHRMaterialsIridescence, {
            iridescenceTexture:          { factory: TextureInfo },
            iridescenceThicknessTexture: { factory: TextureInfo },
        }, this);
    }
}

registry.add('KHR_materials_iridescence', {
    schema: {
        Material: MaterialKHRMaterialsIridescence,
    },
});
