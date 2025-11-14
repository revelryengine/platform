/// <reference path="./KHR_materials_clearcoat.types.d.ts" />

/**
 * This extension defines a clear coating that can be layered on top of an existing glTF material definition.
 *
 * [Reference Spec - KHR_materials_clearcoat](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_clearcoat)
 *
 * @module
 */

import { GLTFProperty              } from '../../gltf-property.js';
import { TextureInfo               } from '../../texture-info.js';
import { MaterialNormalTextureInfo } from '../../material-normal-texture-info.js';
import { registry                  } from '../registry.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, FromJSONGraph } from '../../gltf-property.js';
 * @import { materialKHRMaterialsClearcoatExtensions, MaterialKHRMaterialsClearcoatExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @import { textureInfo } from '../../texture-info.js';
 * @import { materialNormalTextureInfo } from '../../material-normal-texture-info.js';
 */

/**
 * @typedef {object} materialKHRMaterialsClearcoat - KHR_materials_clearcoat JSON representation.
 * @property {number} [clearcoatFactor] - The clearcoat layer intensity (aka opacity) of the material. A value of 0.0 means the material has no clearcoat layer enabled.
 * @property {textureInfo} [clearcoardTexture] - The clearcoat layer intensity texture. Stored in channel R with default linear value 1.0.
 * @property {number} [clearcoatRoughnessFactor] - The clearcoat layer roughness of the material.
 * @property {textureInfo} [clearcoatRoughnessTexture] - The clearcoat layer roughness texture. Stored in channel G with default linear value 1.0.
 * @property {materialNormalTextureInfo} [clearcoatNormalTexture] - A tangent space normal map for the clearcoat layer.
 * @property {materialKHRMaterialsClearcoatExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_materials_clearcoat class representation.
 */
export class MaterialKHRMaterialsClearcoat extends GLTFProperty {
    /**
     * Creates a new instance of MaterialKHRMaterialsClearcoat.
     * @param {{
     *  clearcoatFactor?:           number,
     *  clearcoatTexture?:          TextureInfo,
     *  clearcoatRoughnessFactor?:  number,
     *  clearcoatRoughnessTexture?: TextureInfo,
     *  clearcoatNormalTexture?:    MaterialNormalTextureInfo,
     *  extensions?:                MaterialKHRMaterialsClearcoatExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_materials_clearcoat object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { clearcoatFactor = 0, clearcoatTexture, clearcoatRoughnessFactor = 0, clearcoatRoughnessTexture, clearcoatNormalTexture, extensions } = unmarshalled;

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

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {materialKHRMaterialsClearcoat & glTFPropertyData} materialKHRMaterialsClearcoat - The KHR_materials_clearcoat JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(materialKHRMaterialsClearcoat, graph) {
        return this.unmarshall(graph, materialKHRMaterialsClearcoat, {
            clearcoatTexture:          { factory: TextureInfo               },
            clearcoatRoughnessTexture: { factory: TextureInfo               },
            clearcoatNormalTexture:    { factory: MaterialNormalTextureInfo },
        }, this);
    }
}

registry.add('KHR_materials_clearcoat', {
    schema: {
        Material: MaterialKHRMaterialsClearcoat,
    },
});
