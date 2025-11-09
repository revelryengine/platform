/**
 * Reference to a texture.
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-textureinfo
 *
 * @module
 */

import { GLTFProperty } from './gltf-property.js';
import { Texture      } from './texture.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, FromJSONGraph } from './gltf-property.js';
 * @import { textureInfoExtensions, TextureInfoExtensions } from 'virtual-rev-gltf-extensions';
 */

/**
 * @typedef {object} textureInfo - TextureInfo JSON representation.
 * @property {number} index - The index of the texture.
 * @property {number} [texCoord] - The set index of texture's TEXCOORD attribute used for texture coordinate mapping.
 * @property {textureInfoExtensions} [extensions] - Extension-specific data.
 */

/**
 * TextureInfo class representation.
 */
export class TextureInfo extends GLTFProperty {
    /**
     * Creates an instance of TextureInfo.
     * @param {{
     *  texture:     Texture,
     *  texCoord?:   number,
     *  extensions?: TextureInfoExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled textureInfo object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { texture, texCoord = 0, extensions } = unmarshalled;

        /**
         * The Texture.
         */
        this.texture = texture;

        /**
         * The set index of texture's TEXCOORD attribute used for texture coordinate mapping.
         */
        this.texCoord = texCoord;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {textureInfo & glTFPropertyData} textureInfo - The textureInfo JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(textureInfo, graph) {
        return this.unmarshall(graph, textureInfo, {
            index: { factory: Texture, collection: 'textures', alias: 'texture' },
        }, this);
    }

    /**
     * Set this to true indicate that texture uses sRGB transfer function
     *
     * @see https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#metallic-roughness-material
     *
     * @param {boolean} v - Whether this texture uses sRGB transfer function.
     */
    set sRGB(v) {
        this.texture.sRGB = v;
    }
}
