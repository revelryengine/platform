/// <reference path="./KHR_materials_transmission.types.d.ts" />

/**
 * A transparent material is defined by adding the KHR_materials_transmission extension to any glTF material.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_transmission
 *
 * @module
 */

import { GLTFProperty } from '../../gltf-property.js';
import { TextureInfo  } from '../../texture-info.js';
import { registry     } from '../registry.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, FromJSONGraph } from '../../gltf-property.js';
 * @import { materialKHRMaterialsTransmissionExtensions, MaterialKHRMaterialsTransmissionExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @import { textureInfo } from '../../texture-info.js';
 */

/**
 * @typedef {object} materialKHRMaterialsTransmission - KHR_materials_transmission JSON representation.
 * @property {number} [transmissionFactor] - The base percentage of light that is transmitted through the surface. A value of 0.0 means that no light is transmitted. A value of 1.0 means that all light is transmitted.
 * @property {textureInfo} [transmissionTexture] - A texture that defines the transmission percentage of the surface, stored in the R channel. This will be multiplied by transmissionFactor.
 * @property {materialKHRMaterialsTransmissionExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_materials_transmission class representation.
 */
export class MaterialKHRMaterialsTransmission extends GLTFProperty {
    /**
     * Creates a new instance of KHRMaterialsTransmissionMaterial.
     * @param {{
     *  transmissionFactor?:  number,
     *  transmissionTexture?: TextureInfo,
     *  extensions?:          MaterialKHRMaterialsTransmissionExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_materials_transmission object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { transmissionFactor = 0, transmissionTexture, extensions } = unmarshalled;

        /**
         * The base percentage of light that is transmitted through the surface.
         */
        this.transmissionFactor = transmissionFactor;


        /**
         * A texture that defines the transmission percentage of the surface, stored in the R channel. This will be multiplied by transmissionFactor.
         */
        this.transmissionTexture = transmissionTexture;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {materialKHRMaterialsTransmission & glTFPropertyData} materialKHRMaterialsTransmission - The KHR_materials_transmission JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(materialKHRMaterialsTransmission, graph) {
        return this.unmarshall(graph, materialKHRMaterialsTransmission, {
            transmissionTexture: { factory: TextureInfo },
        }, this);
    }
}

registry.add('KHR_materials_transmission', {
    schema: {
        Material: MaterialKHRMaterialsTransmission,
    },
});
