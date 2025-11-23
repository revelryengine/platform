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

/**
 * @import { GLTFPropertyData, ReferenceField } from '../gltf-property.types.d.ts';
 * @import { textureKHRTextureBasisuExtensions, TextureKHRTextureBasisuExtensions } from '@revelryengine/gltf/extensions';
 */

const workerHelper = new WorkerHelperPool(import.meta.resolve('./KHR_texture_basisu.worker.js'), { count: 4, type: 'module' });

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
        const arrayBuffer = this.source.getImageData();
        const response = await workerHelper.callMethod({ method: 'transcode', args: [{ arrayBuffer, supportedCompression }], signal });
        return /** @type {Uint8Array} */(response.data);
    }

    /**
     * Initializes the worker helper
     * @override
     */
    async load() {
        await workerHelper.init();
        return this;
    }
}

GLTFProperty.extensions.add('KHR_texture_basisu', {
    schema: {
        Texture: TextureKHRTextureBasisu,
    },
});
