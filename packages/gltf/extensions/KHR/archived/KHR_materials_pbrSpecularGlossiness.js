/// <reference path="./KHR_materials_pbrSpecularGlossiness.types.d.ts" />

/**
 * This extension defines the specular-glossiness material model from Physically-Based Rendering (PBR). This extensions allows glTF to support this additional workflow.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Archived/KHR_materials_pbrSpecularGlossiness
 *
 * @module
 */

import { GLTFProperty } from '../../../gltf-property.js';
import { TextureInfo  } from '../../../texture-info.js';
import { registry     } from '../../registry.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, FromJSONGraph } from '../../../gltf-property.js';
 * @import { materialKHRMaterialsPBRSpecularGlossinessExtensions, MaterialKHRMaterialsPBRSpecularGlossinessExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @import { textureInfo } from '../../../texture-info.js';
 */

/**
 * @typedef {object} materialKHRMaterialsPBRSpecularGlossiness - KHR_materials_pbrSpecularGlossiness JSON representation.
 * @property {[number, number, number, number]} [diffuseFactor] - The RGBA components of the reflected diffuse color of the material. Metals have a diffuse value of `[0.0, 0.0, 0.0]`. The fourth component (A) is the alpha coverage of the material. The `alphaMode` property specifies how alpha is interpreted. The values are linear.
 * @property {[number, number, number]} [specularFactor] - The specular RGB color of the material. This value is linear.
 * @property {number} [glossinessFactor] - The glossiness or smoothness of the material. A value of 1.0 means the material has full glossiness or is perfectly smooth. A value of 0.0 means the material has no glossiness or is completely rough. This value is linear.
 * @property {textureInfo} [diffuseTexture] - The texture information for the diffuse color.
 * @property {textureInfo} [specularGlossinessTexture] - The texture information for the specular-glossiness.
 * @property {materialKHRMaterialsPBRSpecularGlossinessExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_materials_pbrSpecularGlossiness class representation.
 */
export class MaterialKHRMaterialsPBRSpecularGlossiness extends GLTFProperty {
    /**
     * Creates a new instance of MaterialKHRMaterialsPBRSpecularGlossiness.
     * @param {{
     *  diffuseFactor?:             [number, number, number, number],
     *  specularFactor?:            [number, number, number],
     *  glossinessFactor?:          number,
     *  diffuseTexture?:            TextureInfo,
     *  specularGlossinessTexture?: TextureInfo,
     *  extensions?:                MaterialKHRMaterialsPBRSpecularGlossinessExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_materials_pbrSpecularGlossiness object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const {
            diffuseFactor = [1, 1, 1, 1], specularFactor = [1, 1, 1], glossinessFactor = 1,
            diffuseTexture, specularGlossinessTexture, extensions
        } = unmarshalled;

        /**
         * The RGBA components of the reflected diffuse color of the material. Metals have a diffuse value of
         * `[0.0, 0.0, 0.0]`. The fourth component (A) is the alpha coverage of the material. The `alphaMode` property
         * specifies how alpha is interpreted. The values are linear.
         */
        this.diffuseFactor = diffuseFactor;

        /**
         * The specular RGB color of the material. This value is linear.
         */
        this.specularFactor = specularFactor;

        /**
         * The glossiness or smoothness of the material. A value of 1.0 means the material has full glossiness or is
         * perfectly smooth. A value of 0.0 means the material has no glossiness or is completely rough. This value is linear.
         */
        this.glossinessFactor = glossinessFactor;

        /**
         * The diffuse texture. This texture contains RGB components of the reflected diffuse color of the material encoded
         * with the sRGB transfer function. If the fourth component (A) is present, it represents the linear alpha coverage
         * of the material. Otherwise, an alpha of 1.0 is assumed. The `alphaMode` property specifies how alpha is interpreted.
         * The stored texels must not be premultiplied.
         */
        this.diffuseTexture = diffuseTexture;

        /**
         * The specular-glossiness texture is an RGBA texture, containing the specular color (RGB) encoded with the sRGB
         * transfer function and the linear glossiness value (A).
         */
        this.specularGlossinessTexture = specularGlossinessTexture;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates a MaterialKHRMaterialsPBRSpecularGlossiness instance from its JSON representation.
     * @param {materialKHRMaterialsPBRSpecularGlossiness & glTFPropertyData} materialKHRMaterialsPBRSpecularGlossiness - The KHR_materials_pbrSpecularGlossiness JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(materialKHRMaterialsPBRSpecularGlossiness, graph) {
        return this.unmarshall(graph, materialKHRMaterialsPBRSpecularGlossiness, {
            diffuseTexture:            { factory: TextureInfo, assign: { sRGB: true } },
            specularGlossinessTexture: { factory: TextureInfo, assign: { sRGB: true } },
        }, this);
    }
}

registry.add('KHR_materials_pbrSpecularGlossiness', {
    schema: {
        Material: MaterialKHRMaterialsPBRSpecularGlossiness,
    },
});
