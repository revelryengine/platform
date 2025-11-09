
/**
 * Image data used to create a texture.
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-image
 *
 * @module
 */

import { NamedGLTFProperty } from './gltf-property.js';
import { BufferView        } from './buffer-view.js';
import { read as readKTX   } from "revelryengine/deps/ktx-parse.js";

/**
 * @import { namedGLTFPropertyData, NamedGLTFPropertyData, FromJSONGraph } from './gltf-property.js';
 * @import { imageExtensions, ImageExtensions } from 'virtual-rev-gltf-extensions';
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
     * @type {import("revelryengine/deps/ktx-parse.js").KTX2Container|undefined}
     */
    #imageDataKTX;

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
     * Creates an instance from JSON data.
     * @param {image & namedGLTFPropertyData} image - The image JSON representation.
     * @param {import('./gltf-property.js').FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(image, graph) {
        return this.unmarshall(graph, image, {
            bufferView: { factory: BufferView, collection: 'bufferViews' },
            uri:        { factory: URL },
        }, this);
    }

    /**
     * Loads the image data as a Uint8Array.
     * @param {AbortSignal} [signal] - AbortSignal to cancel the load request.
     */
    async loadBufferAsUint8Array(signal) {
        if(!this.bufferView) throw new Error('Invalid State');

        const { buffer, byteOffset, byteLength } = this.bufferView;
        await buffer.loadOnce(signal);
        return new Uint8Array(buffer.getArrayBuffer(), byteOffset, byteLength);
    }

    /**
     * Loads the image data as a Blob.
     * @param {AbortSignal} [signal] - AbortSignal to cancel the load request.
     */
    async loadBufferAsBlob(signal) {
        const uint8Array = await this.loadBufferAsUint8Array(signal)
        return new Blob([uint8Array], { type: this.mimeType });
    }

    /**
     * Loads the image data.
     * @param {AbortSignal} [signal] - AbortSignal to cancel the load request.
     * @override
     */
    async load(signal) {
        switch(this.mimeType) {
            case undefined: // If undefined presumed to be standard browser supported image type
            case 'image/png':
            case 'image/jpeg':
            case 'image/webp': {
                const blob = this.uri ? await fetch(this.uri.href, { signal }).then(response => response.blob()) : await this.loadBufferAsBlob(signal);
                this.#imageData = await createImageBitmap(blob, { premultiplyAlpha: 'none' });
                break;
            }
            default: //not browser supported image type so store the data as a buffer
                if(this.uri) {
                    const buffer = await fetch(this.uri, { signal }).then(response => response.arrayBuffer())
                    this.#imageData = new Uint8Array(buffer);
                } else {
                    this.#imageData = await this.loadBufferAsUint8Array();
                }
                if(this.mimeType === 'image/ktx2') {
                    this.#imageDataKTX = readKTX(this.#imageData);
                }
        }
        await super.load(signal);

        return this;
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
     * Gets the KTX image data.
     */
    getImageDataKTX() {
        if(!this.#imageDataKTX) throw new Error('Invalid State');
        return this.#imageDataKTX;
    }
}
