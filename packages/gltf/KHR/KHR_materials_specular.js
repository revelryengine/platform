/// <reference path="./KHR_materials_specular.types.d.ts" />

/**
 * This extension adds two parameters to the metallic-roughness material: specular and specularColor.
 *
 * [Reference Spec - KHR_materials_specular](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_specular)
 *
 * @module
 */

import { GLTFProperty } from '../gltf-property.js';
import { TextureInfo  } from '../texture-info.js';

/**
 * @import { GLTFPropertyData, ReferenceField } from '../gltf-property.types.d.ts';
 * @import { materialKHRMaterialsSpecularExtensions, MaterialKHRMaterialsSpecularExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @import { textureInfo } from '../texture-info.js';
 */

/**
 * @typedef {object} materialKHRMaterialsSpecular - KHR_materials_specular JSON representation.
 * @property {number} [specularFactor] - The specular channel.
 * @property {textureInfo} [specularTexture] - A texture that defines the strength of the specular reflection, stored in the alpha (A) channel. This will be multiplied by specularFactor.
 * @property {[number, number, number]} [specularColorFactor] - The F0 color of the specular reflection (linear RGB).
 * @property {textureInfo} [specularColorTexture] - A texture that defines the F0 color of the specular reflection, stored in the RGB channels and encoded in sRGB. This texture will be multiplied by specularColorFactor.
 * @property {materialKHRMaterialsSpecularExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_materials_specular class representation.
 */
export class MaterialKHRMaterialsSpecular extends GLTFProperty {
    /**
     * Creates a new instance of MaterialKHRMaterialsSpecular.
     * @param {{
     *  specularFactor?:       number,
     *  specularTexture?:      TextureInfo,
     *  specularColorFactor?:  [number, number, number],
     *  specularColorTexture?: TextureInfo,
     *  extensions?:           MaterialKHRMaterialsSpecularExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_materials_specular object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { specularFactor = 1, specularTexture, specularColorFactor = [1, 1, 1], specularColorTexture, extensions } = unmarshalled;

        /**
         * The specular channel.
         */
        this.specularFactor = specularFactor;


        /**
         * A texture that defines the strength of the specular reflection, stored in the alpha (A) channel. This will be multiplied by specularFactor.
         */
        this.specularTexture = specularTexture;

        /**
         * The F0 color of the specular reflection (linear RGB).
         */
        this.specularColorFactor = specularColorFactor;

        /**
         * A texture that defines the F0 color of the specular reflection, stored in the RGB channels and encoded in sRGB. This texture will be multiplied by specularColorFactor.
         */
        this.specularColorTexture = specularColorTexture;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Reference fields for this class.
     * @type {Record<string, ReferenceField>}
     * @override
     */
    static referenceFields = {
        specularTexture:      { factory: () => TextureInfo },
        specularColorTexture: { factory: () => TextureInfo, assign: { sRGB: true } },
    };
}

GLTFProperty.extensions.add('KHR_materials_specular', {
    schema: {
        Material: MaterialKHRMaterialsSpecular,
    },
});

