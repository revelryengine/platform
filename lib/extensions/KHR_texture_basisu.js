import { extensions   } from '../extensions.js';
import { GLTFProperty } from '../gltf-property.js';
import { WorkerHelper } from '../utils/worker-helper.js';

const BASISU_TRANSCODER_URL = 'https://cdn.jsdelivr.net/gh/BinomialLLC/basis_universal/webgl/transcoder/build/basis_transcoder.js';

/**
* This function is not to be called directly. The function is converted to a string and loaded as a Web Worker.
*/
async function worker() {
    // Same as the Module.transcoder_texture_format enum
    const BASIS_FORMAT = {
        cTFETC1: 0,
        cTFETC2: 1,
        cTFBC1: 2,
        cTFBC3: 3,
        cTFBC4: 4,
        cTFBC5: 5,
        cTFBC7: 6,
        cTFPVRTC1_4_RGB: 8,
        cTFPVRTC1_4_RGBA: 9,
        cTFASTC_4x4: 10,
        cTFATC_RGB: 11,
        cTFATC_RGBA_INTERPOLATED_ALPHA: 12,
        cTFRGBA32: 13,
        cTFRGB565: 14,
        cTFBGR565: 15,
        cTFRGBA4444: 16,
        cTFFXT1_RGB: 17,
        cTFPVRTC2_4_RGB: 18,
        cTFPVRTC2_4_RGBA: 19,
        cTFETC2_EAC_R11: 20,
        cTFETC2_EAC_RG11: 21
    };

    const basisPromise = new Promise(async (resolve) => {
        const { BASIS } = await importUMD(BASISU_TRANSCODER_URL);
        BASIS({
            wasmBinary: await fetch(new URL('./basis_transcoder.wasm', BASISU_TRANSCODER_URL)).then(res => res.arrayBuffer()),
        }).then(module => {
            module.initializeBasis();
            resolve(module);
        });
    });

    self.onmessage = async (message) => {
        const { type, taskId } = message.data;
        if (type === 'transcode') {
            let ktx2File;
            try {
                const { arrayBuffer, astcSupported, bc7Supported, etcSupported, dxtSupported, pvrtcSupported } = message.data;
                const { KTX2File } = await basisPromise;

                ktx2File = new KTX2File(new Uint8Array(arrayBuffer));

                if (!ktx2File.isValid()) {
                    throw new Error('Invalid ktx2 file');
                }

                const hasAlpha = ktx2File.getHasAlpha();

                let format;
                if (astcSupported) {
                    format = BASIS_FORMAT.cTFASTC_4x4;
                } else if (bc7Supported) {
                    format = BASIS_FORMAT.cTFBC7;
                } else if (dxtSupported) {
                    if (hasAlpha) {
                        format = BASIS_FORMAT.cTFBC3;
                    } else {
                        format = BASIS_FORMAT.cTFBC1;
                    }
                } else if (pvrtcSupported) {
                    if (hasAlpha) {
                        format = BASIS_FORMAT.cTFPVRTC1_4_RGBA;
                    }
                    else {
                        format = BASIS_FORMAT.cTFPVRTC1_4_RGB;
                    }

                    if (((width & (width - 1)) != 0) || ((height & (height - 1)) != 0)) {
                        throw new Error('PVRTC1 requires square power of 2 textures');
                    }
                    if (width != height) {
                        throw new Error('PVRTC1 requires square power of 2 textures');
                    }
                } else if (etcSupported) {
                    format = BASIS_FORMAT.cTFETC1;
                } else {
                    format = BASIS_FORMAT.cTFRGBA32;
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
}


const workerHelper = new WorkerHelper({ worker, count:  4, constants: `const BASISU_TRANSCODER_URL = '${BASISU_TRANSCODER_URL}';` })

/**
 * @see https://github.com/KhronosGroup/glTF/tree/khr_ktx2_ibl/extensions/2.0/Khronos/KHR_texture_basisu
 */

const GL = WebGLRenderingContext;


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
     * @param {string} target - rgba32, astc, or bc7
     */
    async transcode(options, abortCtl) {
        const arrayBuffer = this.source.getImageData();
        const response = await workerHelper.postMessage({ type: 'transcode', arrayBuffer, ...options }, abortCtl);
        return response.data;
    }

    async load(abortCtl) {
        if (!workerHelper.initialized) workerHelper.init();
    }
}

extensions.set('KHR_texture_basisu', {
    schema: {
        Texture: KHRTextureBasisuTexture,
    },
});
