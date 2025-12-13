/// <reference path="revelryengine/settings.d.ts" />
/// <reference path="./KHR_texture_basisu.types.d.ts" />

/**
 * This extension adds the ability to specify textures using KTX v2 images with Basis Universal supercompression.
 *
 * [Reference Spec - KHR_texture_basisu](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_texture_basisu)
 *
 * @module
 */

import { GLTFProperty     } from '../gltf-property.js';
import { Image            } from '../image.js';
import { WorkerHelperPool } from 'revelryengine/utils/worker-helper.js';
import { read as readKTX  } from 'revelryengine/deps/ktx-parse.js';

/**
 * @import { GLTFPropertyData, ReferenceField } from '../gltf-property.types.d.ts';
 * @import { textureKHRTextureBasisuExtensions, TextureKHRTextureBasisuExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @typedef {object} textureKHRTextureBasisu - KHR_texture_basisu JSON representation.
 * @property {number} source - The images node which points to a KTX2 image with Basis Universal supercompression.
 * @property {textureKHRTextureBasisuExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_texture_basisu class representation.
 */
export class TextureKHRTextureBasisu extends GLTFProperty {
    /**
     * @type {import("revelryengine/deps/ktx-parse.js").KTX2Container|undefined}
     */
    #imageDataKTX;

    /**
     * Creates a new instance of TextureKHRTextureBasisu.
     * @param {{
     *  source:      Image,
     *  extensions?: TextureKHRTextureBasisuExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_texture_basisu object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { source, extensions } = unmarshalled;

        /**
         * The images node which points to a KTX2 image with Basis Universal supercompression.
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

    /**
     * Transcodes the texture given the support compression formats
     * @param {{ astc: boolean, bc7: boolean, etc2: boolean }} supportedCompression - astc, bc7, etc2
     * @param {AbortSignal} [signal] - The abort controller signal for the given transode request
     */
    async transcode(supportedCompression, signal) {
        const input = /** @type {Uint8Array}*/(this.source.getImageData());
        const response = await TextureKHRTextureBasisu.workerPool.callMethod({ method: 'transcode', args: [{ input, supportedCompression }], signal });
        return /** @type {Uint8Array} */(response.output);
    }

    /**
     * Initializes the worker helper and loads the KTX image data.
     * @param {AbortSignal} [signal] - The abort controller signal for the load request
     * @override
     */
    async load(signal) {
        await TextureKHRTextureBasisu.workerPool.connect(globalThis.REV?.KHR_texture_basisu?.workerCount ?? 4);
        await this.source.loadOnce(signal);
        this.#imageDataKTX = readKTX(this.source.getImageData());

        return super.load(signal);
    }

    /**
     * Gets the KTX image data.
     */
    getImageDataKTX() {
        if(!this.#imageDataKTX) throw new Error('Invalid State');
        return this.#imageDataKTX;
    }

    /**
     * Worker helper pool for transcoding KTX2 textures.
     */
    static workerPool = new WorkerHelperPool(import.meta.resolve('./KHR_texture_basisu.worker.js'), { type: 'module' });;
}

GLTFProperty.extensions.add('KHR_texture_basisu', {
    schema: {
        Texture: TextureKHRTextureBasisu,
    },
});
