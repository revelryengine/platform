import { GLTFProperty     } from '../gltf-property.js';
import { Image            } from '../image.js';
import { extensions       } from '../extensions.js';
import { WorkerHelperPool } from '../../deps/utils.js';

const workerHelper = new WorkerHelperPool(import.meta.resolve('./KHR_texture_basisu.worker.js'), 4);

/**
 * KHR_texture_basisu texture extension
 * @typedef {{
 *  source:      number,
 *  extensions?: Revelry.GLTF.Extensions.khrTextureBasisuTexture,
 * } & import('../gltf-property.js').glTFPropertyData} khrTextureBasisuTexture
 */

/**
 * This extension adds the ability to specify textures using KTX v2 images with Basis Universal supercompression.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_texture_basisu
 */
export class KHRTextureBasisuTexture extends GLTFProperty {

    /**
     * @param {{
     *  source:      Image,
     *  extensions?: Revelry.GLTF.Extensions.KHRTextureBasisuTexture,
     * } & import('../gltf-property.js').GLTFPropertyData} khrTextureBasisuTexture
     */
    constructor(khrTextureBasisuTexture) {
        super(khrTextureBasisuTexture);

        const { source, extensions } = khrTextureBasisuTexture;

        /**
         * The images node which points to a KTX2 image with Basis Universal supercompression.
         */
        this.source = source;

        this.extensions = extensions;
    }

    /**
     * @param {khrTextureBasisuTexture} khrTextureBasisuTexture
     * @param {import('../gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(khrTextureBasisuTexture, options) {
        return new this(this.unmarshall(khrTextureBasisuTexture, options, {
            source: { factory: Image, collection: 'images' },
        }, 'KHRTextureBasisuTexture'));
    }

    /**
     * Transcodes the texture given the support compression formats
     * @param {{ astc: boolean, bc7: boolean, etc2: boolean }} supportedCompression - astc, bc7, etc2
     * @param {AbortSignal} [signal] - The abort controller signal for the given transode request
     * @return {Promise<Uint8Array>}
     */
    async transcode(supportedCompression, signal) {
        const arrayBuffer = this.source.getImageData();
        const response = await workerHelper.callMethod({ method: 'transcode', args: [{ arrayBuffer, supportedCompression }], signal });
        return response.data;
    }

    async load() {
        await workerHelper.init();
        return this;
    }
}

extensions.add('KHR_texture_basisu', {
    schema: {
        Texture: KHRTextureBasisuTexture,
    },
});
