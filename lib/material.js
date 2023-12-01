import { NamedGLTFProperty            } from './gltf-property.js';
import { MaterialPBRMetallicRoughness } from './material-pbr-metallic-roughness.js';
import { MaterialNormalTextureInfo    } from './material-normal-texture-info.js';
import { MaterialOcclusionTextureInfo } from './material-occlusion-texture-info.js';
import { TextureInfo                  } from './texture-info.js';

/**
 * @typedef {{
 *  pbrMetallicRoughness?: import('./material-pbr-metallic-roughness.js').materialPBRMetallicRoughness,
 *  normalTexture?:        import('./material-normal-texture-info.js').materialNormalTextureInfo,
 *  occlusionTexture?:     import('./material-occlusion-texture-info.js').materialOcclusionTextureInfo,
 *  emissiveTexture?:      import('./texture-info.js').textureInfo,
 *  emissiveFactor?:       [number, number, number],
 *  alphaMode?:            'OPAQUE' | 'MASK' | 'BLEND',
 *  alphaCutoff?:          number,
 *  doubleSided?:          boolean,
 *  extensions?:           Revelry.GLTF.Extensions.material,
 * } & import('./gltf-property.js').namedGLTFPropertyData} material
 */

/**
 * The material appearance of a primitive.
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-material
 */
export class Material extends NamedGLTFProperty {
    /**
     * @param {{
     *  pbrMetallicRoughness?: MaterialPBRMetallicRoughness,
     *  normalTexture?:        MaterialNormalTextureInfo,
     *  occlusionTexture?:     MaterialOcclusionTextureInfo,
     *  emissiveTexture?:      TextureInfo,
     *  emissiveFactor?:       [number, number, number],
     *  alphaMode?:            'OPAQUE' | 'MASK' | 'BLEND',
     *  alphaCutoff?:          number,
     *  doubleSided?:          boolean,
     *  extensions?:           Revelry.GLTF.Extensions.Material,
     * } & import('./gltf-property.js').NamedGLTFPropertyData} material
     */
    constructor(material) {
        super(material);

        const {
            pbrMetallicRoughness, normalTexture, occlusionTexture, emissiveTexture, emissiveFactor = [0, 0, 0],
            alphaMode = 'OPAQUE', alphaCutoff = 0.5, doubleSided = false, extensions
        } = material;

        /**
         * A set of parameter values that are used to define the
         * metallic-roughness material model from Physically-Based Rendering (PBR) methodology. When not specified, all the
         * default values of {@link pbrMetallicRoughness} apply.
         */
        this.pbrMetallicRoughness = pbrMetallicRoughness;

        /**
         * The normal map texture.
         */
        this.normalTexture = normalTexture;

        /**
         * The occlusion map texture.
         */
        this.occlusionTexture = occlusionTexture;

        /**
         * The emissive map texture.
         */
        this.emissiveTexture = emissiveTexture;

        /**
         * The emissive color of the material.
         */
        this.emissiveFactor = emissiveFactor;

        /**
         * The alpha rendering mode of the material.
         */
        this.alphaMode = alphaMode;

        /**
         * The alpha cutoff value of the material.
         */
        this.alphaCutoff = alphaCutoff;

        /**
         * Specifies whether the material is double sided.
         */
        this.doubleSided = doubleSided;

        this.extensions = extensions;
    }

    /**
     * @param {material} material
     * @param {import('./gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(material, options) {
        return new this(this.unmarshall( material, options, {
            pbrMetallicRoughness: { factory: MaterialPBRMetallicRoughness        },
            normalTexture:        { factory: MaterialNormalTextureInfo           },
            occlusionTexture:     { factory: MaterialOcclusionTextureInfo        },
            emissiveTexture:      { factory: TextureInfo, assign: { sRGB: true } },
        }, 'Material'));
    }
}
