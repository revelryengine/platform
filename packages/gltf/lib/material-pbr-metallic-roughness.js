
import { GLTFProperty } from './gltf-property.js';
import { TextureInfo  } from './texture-info.js';

/**
 * @typedef {{
 *  baseColorFactor?:          [number, number, number, number],
 *  baseColorTexture?:         import('./texture-info.js').textureInfo,
 *  metallicFactor?:           number,
 *  roughnessFactor?:          number,
 *  metallicRoughnessTexture?: import('./texture-info.js').textureInfo,
 *  extensions?:               Revelry.GLTF.Extensions.materialPBRMetallicRoughness,
 * } & import('./gltf-property.js').glTFPropertyData} materialPBRMetallicRoughness
 */

/**
 * A set of parameter values that are used to define the metallic-roughness material model from Physically-Based Rendering (PBR) methodology.
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-material-pbrmetallicroughness
 */
export class MaterialPBRMetallicRoughness extends GLTFProperty {
    /**
     * @param {{
     *  baseColorFactor?:          [number, number, number, number],
     *  baseColorTexture?:         TextureInfo,
     *  metallicFactor?:           number,
     *  roughnessFactor?:          number,
     *  metallicRoughnessTexture?: TextureInfo,
     *  extensions?:               Revelry.GLTF.Extensions.MaterialPBRMetallicRoughness,
     * } & import('./gltf-property.js').GLTFPropertyData} materialPBRMetallicRoughness
     */
    constructor(materialPBRMetallicRoughness = {}) {
        super(materialPBRMetallicRoughness);

        const {
            baseColorFactor = [1, 1, 1, 1], baseColorTexture,
            metallicFactor = 1, roughnessFactor = 1, metallicRoughnessTexture, extensions
        } = materialPBRMetallicRoughness;

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

        this.extensions = extensions;
    }

    /**
     * Creates a MaterialPBRMetallicRoughness instance from a JSON representation.
     * @param {materialPBRMetallicRoughness} materialPBRMetallicRoughness
     * @param {import('./gltf-property.js').FromJSONOptions} options
     * @override
     */
    static fromJSON(materialPBRMetallicRoughness, options) {
        return new this(this.unmarshall(materialPBRMetallicRoughness, options, {
            baseColorTexture:         { factory: TextureInfo, assign: { sRGB: true } },
            metallicRoughnessTexture: { factory: TextureInfo                         },
        }, 'MaterialPBRMetallicRoughness'));
    }
}
