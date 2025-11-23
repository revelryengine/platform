/**
 * The material appearance of a primitive.
 *
 * [Reference Spec - Material](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-material)
 *
 * @module
 */

import { NamedGLTFProperty            } from './gltf-property.js';
import { MaterialPBRMetallicRoughness } from './material-pbr-metallic-roughness.js';
import { MaterialNormalTextureInfo    } from './material-normal-texture-info.js';
import { MaterialOcclusionTextureInfo } from './material-occlusion-texture-info.js';
import { TextureInfo                  } from './texture-info.js';

/**
 * @import { NamedGLTFPropertyData, ReferenceField } from './gltf-property.types.d.ts';
 * @import { materialExtensions, MaterialExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @import { materialPBRMetallicRoughness } from './material-pbr-metallic-roughness.js';
 * @import { materialNormalTextureInfo    } from './material-normal-texture-info.js';
 * @import { materialOcclusionTextureInfo } from './material-occlusion-texture-info.js';
 * @import { textureInfo                  } from './texture-info.js';
 */

/**
 * @typedef {object} material - Material JSON representation.
 * @property {materialPBRMetallicRoughness} [pbrMetallicRoughness] - A set of parameter values that are used to define the metallic-roughness material model from Physically-Based Rendering (PBR) methodology.
 * @property {materialNormalTextureInfo} [normalTexture] - The normal map texture.
 * @property {materialOcclusionTextureInfo} [occlusionTexture] - The occlusion map texture.
 * @property {textureInfo} [emissiveTexture] - The emissive map texture.
 * @property {[number, number, number]} [emissiveFactor] - The emissive color of the material.
 * @property {'OPAQUE' | 'MASK' | 'BLEND'} [alphaMode] - The alpha rendering mode of the material.
 * @property {number} [alphaCutoff] - The alpha cutoff value of the material.
 * @property {boolean} [doubleSided] - Specifies whether the material is double sided.
 * @property {materialExtensions} [extensions] - Extension-specific data.
 */

/**
 * Material class representation.
 */
export class Material extends NamedGLTFProperty {
    /**
     * Creates an instance of Material.
     * @param {{
     *  pbrMetallicRoughness?: MaterialPBRMetallicRoughness,
     *  normalTexture?:        MaterialNormalTextureInfo,
     *  occlusionTexture?:     MaterialOcclusionTextureInfo,
     *  emissiveTexture?:      TextureInfo,
     *  emissiveFactor?:       [number, number, number],
     *  alphaMode?:            'OPAQUE' | 'MASK' | 'BLEND',
     *  alphaCutoff?:          number,
     *  doubleSided?:          boolean,
     *  extensions?:           MaterialExtensions,
     * } & NamedGLTFPropertyData} unmarshalled - Unmarshalled material object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const {
            pbrMetallicRoughness, normalTexture, occlusionTexture, emissiveTexture, emissiveFactor = [0, 0, 0],
            alphaMode = 'OPAQUE', alphaCutoff = 0.5, doubleSided = false, extensions
        } = unmarshalled;

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
        pbrMetallicRoughness: { factory: () => MaterialPBRMetallicRoughness },
        normalTexture:        { factory: () => MaterialNormalTextureInfo    },
        occlusionTexture:     { factory: () => MaterialOcclusionTextureInfo },
        emissiveTexture:      { factory: () => TextureInfo, assign: { sRGB: true } },
    };
}
