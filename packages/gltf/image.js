
/**
 * Image data used to create a texture.
 *
 * [Reference Spec - Image](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-image)
 *
 * @module
 */

import { NamedGLTFProperty } from './gltf-property.js';
import { BufferView        } from './buffer-view.js';

import { IMAGE_MIME_SNIFFING_PATTERNS } from './constants.js';

/**
 * @import { NamedGLTFPropertyData, ReferenceField } from './gltf-property.types.d.ts';
 * @import { imageExtensions, ImageExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @typedef {object} image - Image JSON representation.
 * @property {string} [uri] - The uri of the image.
 * @property {string} [mimeType] - The image's MIME type.
 * @property {number} [bufferView] - The index of the BufferView that contains the image. Use this instead of the image's uri property.
 * @property {imageExtensions} [extensions] - Extension-specific data.
 */

/**
 * Image class representation.
 */
export class Image extends NamedGLTFProperty {
    /**
     * @type {ImageBitmap|Uint8Array|undefined}
     */
    #imageData;

    /**
     * Creates an Image instance.
     * @param {{
     *  uri?:        URL,
     *  mimeType?:   string,
     *  bufferView?: BufferView,
     *  extensions?: ImageExtensions,
     * } & NamedGLTFPropertyData} unmarshalled - Unmarshalled image object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { uri, mimeType, bufferView, extensions } = unmarshalled;

        /**
         * The uri of the image.
         */
        this.uri = uri;

        /**
         * The image's MIME type.
         */
        this.mimeType = mimeType;

        /**
         * The BufferView that contains the image. Use this instead of the image's uri property.
         */
        this.bufferView = bufferView;

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
        bufferView: { factory: () => BufferView, collection: 'bufferViews' },
        uri:        { factory: () => URL                                      },
    };

    /**
     * Loads the image data using {@link createImageBitmap} or by reading the raw buffer for unsupported image types.
     *
     * [Deno does not yet support WebP in createImageBitmap](https://github.com/denoland/deno/pull/25517#issuecomment-2627763074).
     *
     * @param {AbortSignal} [signal] - AbortSignal to cancel the load request.
     * @override
     */
    async load(signal) {
        const { data, mimeType } = await this.#loadData(signal);

        switch(mimeType) {
            case 'image/webp':
            case 'image/png':
            case 'image/jpeg':
                this.#imageData = await createImageBitmap(new Blob([data], { type: mimeType }), { premultiplyAlpha: 'none' });
                break;
            default: //not createImageBitmap supported image type so just use the raw data
                this.#imageData = data;
        }

        return super.load(signal);
    }

    /**
     * Gets the image data.
     */
    getImageData() {
        if(!this.#imageData) throw new Error('Invalid State');
        return this.#imageData;
    }

    /**
     * Sets the image data directly.
     * @param {ImageBitmap} imageBitmap - The image bitmap data.
     */
    setImageData(imageBitmap) {
        this.#imageData = imageBitmap;
    }

    /**
     *
     * @param {AbortSignal} [signal]
     */
    async #loadData(signal) {
        let data, mimeType;
        if(this.uri) {
            const response = await fetch(this.uri, { signal });

            data = new Uint8Array(await response.arrayBuffer());
            mimeType = this.mimeType ?? response.headers.get('Content-Type') ?? this.#mimeSniff(data);
        } else if(this.bufferView) {
            const { buffer, byteOffset, byteLength } = this.bufferView;
            await buffer.loadOnce(signal);

            data = new Uint8Array(buffer.getArrayBuffer(), byteOffset, byteLength);
            mimeType = /** @type {string} */(this.mimeType);
        } else {
            throw new Error('Invalid Data');
        }

        return { data, mimeType };
    }
    /**
     * See [Matching a mime type pattern](https://mimesniff.spec.whatwg.org/#matching-a-mime-type-pattern)
     * @param {Uint8Array} data - The image data to sniff.
     */
    #mimeSniff(data) {
        for(const { pattern, mask, mime } of IMAGE_MIME_SNIFFING_PATTERNS) {
            let match = true;
            for(let p = 0; p < pattern.length; p++) {
                if((data[p] & mask[p]) !== pattern[p]) {
                    match = false;
                    break;
                }
            }
            if(match) return mime;
        }
        return null;
    }
}
