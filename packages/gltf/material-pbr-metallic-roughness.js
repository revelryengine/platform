
/**
 * A set of parameter values that are used to define the metallic-roughness material model from Physically-Based Rendering (PBR) methodology.
 *
 * [Reference Spec - Material PBR Metallic Roughness](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-material-pbrmetallicroughness)
 *
 * @module
 */

import { GLTFProperty } from './gltf-property.js';
import { TextureInfo  } from './texture-info.js';

/**
 * @import { GLTFPropertyData, ReferenceField } from './gltf-property.types.d.ts';
 * @import { materialPBRMetallicRoughnessExtensions, MaterialPBRMetallicRoughnessExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @import { textureInfo } from './texture-info.js';
 */

/**
 * @typedef {object} materialPBRMetallicRoughness - MaterialPBRMetallicRoughness JSON representation.
 * @property {[number, number, number, number]} [baseColorFactor] - The material's base color factor.
 * @property {textureInfo} [baseColorTexture] - The base color texture.
 * @property {number} [metallicFactor] - The metalness of the material.
 * @property {number} [roughnessFactor] - The roughness of the material.
 * @property {textureInfo} [metallicRoughnessTexture] - The metallic-roughness texture.
 * @property {materialPBRMetallicRoughnessExtensions} [extensions] - Extension-specific data.
 */

/**
 * MaterialPBRMetallicRoughness class representation.
 */
export class MaterialPBRMetallicRoughness extends GLTFProperty {
    /**
     * Creates a new instance of MaterialPBRMetallicRoughness.
     * @param {{
     *  baseColorFactor?:          [number, number, number, number],
     *  baseColorTexture?:         TextureInfo,
     *  metallicFactor?:           number,
     *  roughnessFactor?:          number,
     *  metallicRoughnessTexture?: TextureInfo,
     *  extensions?:               MaterialPBRMetallicRoughnessExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled material PBR metallic-roughness object
     */
    constructor(unmarshalled = {}) {
        super(unmarshalled);

        const {
            baseColorFactor = [1, 1, 1, 1], baseColorTexture,
            metallicFactor = 1, roughnessFactor = 1, metallicRoughnessTexture, extensions
        } = unmarshalled;

        /**
         * The material's base color factor.
         */
        this.baseColorFactor = baseColorFactor;

        /**
         * The base color texture.
         */
        this.baseColorTexture = baseColorTexture;

        /**
         * The metalness of the material.
         */
        this.metallicFactor = metallicFactor;

        /**
         * The roughness of the material.
         */
        this.roughnessFactor = roughnessFactor;

        /**
         * The metallic-roughness texture.
         */
        this.metallicRoughnessTexture = metallicRoughnessTexture;

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
        baseColorTexture:         { factory: () => TextureInfo, assign: { sRGB: true } },
        metallicRoughnessTexture: { factory: () => TextureInfo                         },
    };
}
