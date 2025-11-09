/**
 * A reference to a texture
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-material-occlusiontextureinfo
 *
 * @module
 */

import { TextureInfo } from './texture-info.js';
import { Texture     } from './texture.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, FromJSONGraph } from './gltf-property.js';
 * @import { materialOcclusionTextureInfoExtensions, MaterialOcclusionTextureInfoExtensions } from 'virtual-rev-gltf-extensions';
 */

/**
 * @typedef {object} materialOcclusionTextureInfo - MaterialOcclusionTextureInfo JSON representation.
 * @property {number} index - The index of the texture.
 * @property {number} [texCoord] - The set index of texture's TEXCOORD attribute used for texture coordinate mapping.
 * @property {number} [strength] - A scalar multiplier controlling the amount of occlusion applied.
 * @property {materialOcclusionTextureInfoExtensions} [extensions] - Extension-specific data.
 */

/**
 * MaterialOcclusionTextureInfo class representation.
 */
export class MaterialOcclusionTextureInfo extends TextureInfo {
    /**
     * Creates an instance of MaterialOcclusionTextureInfo.
     * @param {{
     *  texture:     Texture,
     *  texCoord?:   number,
     *  strength?:   number,
     *  extensions?:MaterialOcclusionTextureInfoExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled material occlusion texture info object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { strength = 1, extensions } = unmarshalled;

        /**
         * A scalar multiplier controlling the amount of occlusion applied.
         * @type {Number}
         */
        this.strength = strength;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {materialOcclusionTextureInfo & glTFPropertyData} materialOcclusionTextureInfo - The material occlusion texture info JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(materialOcclusionTextureInfo, graph) {
        return this.unmarshall(graph, materialOcclusionTextureInfo, {
            index: { factory: Texture, collection: 'textures', alias: 'texture' },
        }, this);
    }
}
