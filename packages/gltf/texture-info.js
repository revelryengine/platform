/**
 * Reference to a texture.
 *
 * [Reference Spec - Texture Info](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-textureinfo)
 *
 * @module
 */

import { GLTFProperty } from './gltf-property.js';
import { Texture      } from './texture.js';

/**
 * @import { GLTFPropertyData, ReferenceField } from './gltf-property.types.d.ts';
 * @import { textureInfoExtensions, TextureInfoExtensions } from '@revelryengine/gltf/extensions';
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
     * Reference fields for this class.
     * @type {Record<string, ReferenceField>}
     * @override
     */
    static referenceFields = {
        index: { factory: () => Texture, collection: 'textures', alias: 'texture' },
    };

    /**
     * Set this to true indicate that texture uses sRGB transfer function
     * @param {boolean} v - Whether this texture uses sRGB transfer function.
     */
    set sRGB(v) {
        this.texture.sRGB = v;
    }
}
