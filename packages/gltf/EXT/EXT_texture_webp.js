/// <reference path="./EXT_texture_webp.types.d.ts" />

/**
 * This extension allows glTF assets to use WebP as a valid image format.
 *
 * [Reference Spec - EXT_texture_webp](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/EXT_texture_webp)
 *
 * @module
 */

import { GLTFProperty } from '../gltf-property.js';
import { Image        } from '../image.js';

/**
 * @import { GLTFPropertyData, ReferenceField } from '../gltf-property.types.d.ts';
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
     * Reference fields for this class.
     * @type {Record<string, ReferenceField>}
     * @override
     */
    static referenceFields = {
        source: { factory: () => Image, collection: 'images' },
    };
}

GLTFProperty.extensions.add('EXT_texture_webp', {
    schema: {
        Texture: TextureEXTTextureWebP,
    },
});

