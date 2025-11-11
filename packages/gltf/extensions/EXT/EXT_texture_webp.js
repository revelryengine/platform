/// <reference path="./EXT_texture_webp.types.d.ts" />

/**
 * This extension allows glTF assets to use WebP as a valid image format.
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/EXT_texture_webp
 * @module
 */

import { GLTFProperty } from '../../gltf-property.js';
import { Image        } from '../../image.js';
import { registry     } from '../registry.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, FromJSONGraph } from '../../gltf-property.js';
 * @import { textureEXTTextureWebPExtensions, TextureEXTTextureWebPExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @typedef {object} textureEXTTextureWebP - EXT_texture_webp JSON representation.
 * @property {number} source - The index of the image in the images array.
 * @property {textureEXTTextureWebPExtensions} [extensions] - Extension-specific data.
 */

/**
 * EXT_texture_webp class representation.
 */
export class TextureEXTTextureWebP extends GLTFProperty {

    /**
     * Creates a new instance of TextureEXTTextureWebP.
     * @param {{
     *  source:      Image,
     *  extensions?: TextureEXTTextureWebPExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled EXT_texture_webp object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { source, extensions } = unmarshalled;

        /**
         * The images node which points to a WebP image.
         */
        this.source = source;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {textureEXTTextureWebP & glTFPropertyData} textureEXTTextureWebP - The EXT_texture_webp JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(textureEXTTextureWebP, graph) {
        return this.unmarshall(graph, textureEXTTextureWebP, {
            source: { factory: Image, collection: 'images' },
        }, this);
    }
}

registry.add('EXT_texture_webp', {
    schema: {
        Texture: TextureEXTTextureWebP,
    },
});
