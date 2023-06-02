import { extensions   } from '../extensions.js';
import { GLTFProperty } from '../gltf-property.js';
import { WorkerHelper } from '../utils/worker-helper.js';

const BASISU_TRANSCODER_URL = 'https://cdn.jsdelivr.net/gh/BinomialLLC/basis_universal/webgl/transcoder/build/basis_transcoder.js';

const workerHelper = new WorkerHelper({ 
    count:  4, constants: `const BASISU_TRANSCODER_URL = '${BASISU_TRANSCODER_URL}';`, 
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

        let basis;
        importUMD(BASISU_TRANSCODER_URL).then(async ({ BASIS }) => {
            const wasmBinary = await fetch(new URL('./basis_transcoder.wasm', BASISU_TRANSCODER_URL)).then(res => res.arrayBuffer());
            basis = await new Promise((resolve) => BASIS({ wasmBinary }).then(module => { module.initializeBasis(); resolve(module); }));
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
 * @see https://github.com/KhronosGroup/glTF/tree/khr_ktx2_ibl/extensions/2.0/Khronos/KHR_texture_basisu
 */

/**
 * KHR_texture_basisu texture extension
 * @typedef {glTFProperty} khrTextureBasisuTexture
 * @property {Number} source - The index of the images node which points to a KTX2 image with Basis Universal supercompression.
 */


/**
 * A class wrapper for the image khrTextureBasisuTexture object.
 */
export class KHRTextureBasisuTexture extends GLTFProperty {

    /**
     * Creates an instance of KHRTextureBasisuTexture.
     * @param {khrTextureBasisuTexture} khrTextureBasisuTexture - The properties of the KHR_texture_basisu texture extension.
     */
    constructor(khrTextureBasisuTexture) {
        super(khrTextureBasisuTexture);

        const { source } = khrTextureBasisuTexture;

        /**
         * The images node or the index of the images node which points to a KTX2 image with Basis Universal supercompression.
         * @type {Number|Image}
         */
        this.source = source;
    }

    static referenceFields = [
        { name: 'source', type: 'collection', collection: 'images' },
    ];

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
    }
}

extensions.set('KHR_texture_basisu', {
    schema: {
        Texture: KHRTextureBasisuTexture,
    },
});
