
import { NamedGLTFProperty } from './gltf-property.js';
import { BufferView        } from './buffer-view.js';
import { read as readKTX   } from '../deps/ktx-parse.js';

/**
 * @typedef {{
 *  uri?:        string,
 *  mimeType?:   string,
 *  bufferView?: string,
 *  extensions?: Revelry.GLTF.Extensions.image,
 * } & import('./gltf-property.js').namedGLTFPropertyData} image
 */

/**
 * Image data used to create a texture.
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-image
 */
export class Image extends NamedGLTFProperty {
    /**
     * @type {ImageBitmap|Uint8Array|undefined}
     */
    #imageData;

    /**
     * @type {import('../deps/ktx-parse.js').KTX2Container|undefined}
     */
    #imageDataKTX;

    /**
     * @param {{
     *  uri?:        URL,
     *  mimeType?:   string,
     *  bufferView?: BufferView,
     *  extensions?: Revelry.GLTF.Extensions.Image,
     * } & import('./gltf-property.js').NamedGLTFPropertyData} image
     */
    constructor(image) {
        super(image);

        const { uri, mimeType, bufferView, extensions } = image;

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

        this.extensions = extensions;
    }

    /**
     * Creates an Image instance from a JSON representation.
     * @param {image} image
     * @param {import('./gltf-property.js').FromJSONOptions} options
     * @override
     */
    static fromJSON(image, options) {
        return new this(this.unmarshall(image, options, {
            bufferView: { factory: BufferView, collection: 'bufferViews' },
            uri:        { factory: URL },
        }, 'Image'));
    }

    /**
     * Loads the image data as a Uint8Array.
     * @param {AbortSignal} [signal]
     */
    async loadBufferAsUint8Array(signal) {
        if(!this.bufferView) throw new Error('Invalid State');

        const { buffer, byteOffset, byteLength } = this.bufferView;
        await buffer.loadOnce(signal);
        return new Uint8Array(buffer.getArrayBuffer(), byteOffset, byteLength);
    }

    /**
     * Loads the image data as a Blob.
     * @param {AbortSignal} [signal]
     */
    async loadBufferAsBlob(signal) {
        const uint8Array = await this.loadBufferAsUint8Array(signal)
        return new Blob([uint8Array], { type: this.mimeType });
    }

    /**
     * Loads the image data.
     * @param {AbortSignal} [signal]
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
     * @param {ImageBitmap} imageBitmap
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
