import { GLTFProperty } from '../gltf-property.js';
import { Image        } from '../image.js';
import { WorkerHelper } from '../utils/worker-helper.js';
import { extensions   } from '../extensions.js';

const BASISU_TRANSCODER_URL = import.meta.resolve('../../deps/basis_universal.js');

const workerHelper = new WorkerHelper({
    count:  4,
    constants: `const BASISU_TRANSCODER_URL = '${BASISU_TRANSCODER_URL}';`,

    worker: () => {
        const BASIS_FORMAT = {
            ETC1: 0,
            ETC2: 1,
            BC1: 2,
            BC3: 3,
            BC4: 4,
            BC5: 5,
            BC7: 6,
            PVRTC1_4_RGB: 8,
            PVRTC1_4_RGBA: 9,
            ASTC_4X4: 10,
            ATC_RGB: 11,
            ATC_RGBA_INTERPOLATED_ALPHA: 12,
            RGBA32: 13,
            RGB565: 14,
            BGR565: 15,
            RGBA4444: 16,
            FXT1_RGB: 17,
            PVRTC2_4_RGB: 18,
            PVRTC2_4_RGBA: 19,
            ETC2_EAC_R11: 20,
            ETC2_EAC_RG11: 21
        };

        /** @type {any} */
        let basis;
        import(BASISU_TRANSCODER_URL).then(async ({ BasisUFactory }) => {
            basis = await BasisUFactory()
            self.postMessage({ taskId: 0 });
        });

        self.onmessage = (message) => {
            const { type, taskId } = message.data;
            if (type === 'transcode') {
                let ktx2File;
                try {
                    const { arrayBuffer, supportedCompression: { astc, bc7, etc2, dxt, pvrtc } } = message.data;

                    const { KTX2File } = basis;

                    ktx2File = new KTX2File(new Uint8Array(arrayBuffer));

                    if (!ktx2File.isValid()) {
                        throw new Error('Invalid ktx2 file');
                    }

                    const hasAlpha = ktx2File.getHasAlpha();

                    let format;
                    if (astc) {
                        format = BASIS_FORMAT.ASTC_4X4;
                    } else if (bc7) {
                        format = BASIS_FORMAT.BC7;
                    } else if (dxt) {
                        if (hasAlpha) {
                            format = BASIS_FORMAT.BC3;
                        } else {
                            format = BASIS_FORMAT.BC1;
                        }
                    } else if (pvrtc) {
                        if (hasAlpha) {
                            format = BASIS_FORMAT.PVRTC1_4_RGBA;
                        }
                        else {
                            format = BASIS_FORMAT.PVRTC1_4_RGB;
                        }

                        const width  = ktx2File.getImageWidth(0, 0);
                        const height = ktx2File.getImageHeight(0, 0);

                        if (((width & (width - 1)) != 0) || ((height & (height - 1)) != 0)) {
                            throw new Error('PVRTC1 requires square power of 2 textures');
                        }
                        if (width != height) {
                            throw new Error('PVRTC1 requires square power of 2 textures');
                        }
                    } else if (etc2) {
                        format = BASIS_FORMAT.ETC2;
                    } else {
                        format = BASIS_FORMAT.RGBA32;
                    }

                    if (!ktx2File.startTranscoding()) {
                        throw new Error('transcoding start failed');
                    }

                    const size = ktx2File.getImageTranscodedSizeInBytes(0, 0, 0, format);
                    const data = new Uint8Array(size);

                    if (!ktx2File.transcodeImage(data, 0, 0, 0, format, 0, -1, -1)) {
                        throw new Error('transcoding failed');
                    }

                    self.postMessage({ data, format, taskId });
                } catch (error) {
                    self.postMessage({ error, taskId });
                }

                ktx2File?.close();
                ktx2File?.delete();
            }
        }
    },
});

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
     * @param {string} supportedCompression - astc, bc7, etc2
     * @param {AbortSignal} [signal] - The abort controller signal for the given transode request
     */
    async transcode(supportedCompression, signal) {
        const arrayBuffer = this.source.getImageData();
        const response = await workerHelper.postMessage({ type: 'transcode', arrayBuffer, supportedCompression }, signal);
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
