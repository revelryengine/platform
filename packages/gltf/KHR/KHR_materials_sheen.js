/// <reference path="./KHR_materials_sheen.types.d.ts" />

/**
 * This extension defines a sheen that can be layered on top of an existing glTF material definition.
 *
 * [Reference Spec - KHR_materials_sheen](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_sheen)
 *
 * @module
 */

import { GLTFProperty } from '../gltf-property.js';
import { TextureInfo  } from '../texture-info.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, FromJSONGraph } from '../gltf-property.js';
 * @import { materialKHRMaterialsSheenExtensions, MaterialKHRMaterialsSheenExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @import { textureInfo } from '../texture-info.js';
 */

/**
 * @typedef {object} materialKHRMaterialsSheen - KHR_materials_sheen JSON representation.
 * @property {[number, number, number]} [sheenColorFactor] - The sheen color in linear space.
 * @property {textureInfo} [sheenColorTexture] - The sheen color (RGB) texture.
 * @property {number} [sheenRoughnessFactor] - The sheen layer roughness.
 * @property {textureInfo} [sheenRoughnessTexture] - The sheen roughness (Alpha) texture.
 * @property {materialKHRMaterialsSheenExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_materials_sheen class representation.
 */
export class MaterialKHRMaterialsSheen extends GLTFProperty {
    /**
     * Creates a new instance of MaterialKHRMaterialsSheen.
     * @param {{
     *  sheenColorFactor?:      [number, number, number],
     *  sheenColorTexture?:     TextureInfo,
     *  sheenRoughnessFactor?:  number,
     *  sheenRoughnessTexture?: TextureInfo,
     *  extensions?:            MaterialKHRMaterialsSheenExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_materials_sheen object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { sheenColorFactor = [0, 0, 0], sheenColorTexture, sheenRoughnessFactor = 0, sheenRoughnessTexture, extensions } = unmarshalled;

        /**
         * The sheen color in linear space.
         */
        this.sheenColorFactor = sheenColorFactor;

        /**
         * The sheen color (RGB) texture.
         */
        this.sheenColorTexture = sheenColorTexture;

        /**
         * The sheen layer roughness.
         */
        this.sheenRoughnessFactor = sheenRoughnessFactor;

        /**
         * The sheen roughness (Alpha) texture.
         */
        this.sheenRoughnessTexture = sheenRoughnessTexture;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {materialKHRMaterialsSheen & glTFPropertyData} materialKHRMaterialsSheen - The KHR_materials_sheen JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(materialKHRMaterialsSheen, graph) {
        return this.unmarshall(graph, materialKHRMaterialsSheen, {
            sheenColorTexture:     { factory: TextureInfo },
            sheenRoughnessTexture: { factory: TextureInfo },
        }, this);
    }
}

GLTFProperty.extensions.add('KHR_materials_sheen', {
    schema: {
        Material: MaterialKHRMaterialsSheen,
    },
});
