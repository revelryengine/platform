
/**
 * A minimal type definition for BasisU Module as defined in [basis_universal](https://github.com/BinomialLLC/basis_universal/blob/master/webgl/transcoder/basis_wrappers.cpp).
 * @typedef {{
 *  KTX2File: {
 *      new(data: Uint8Array): {
 *          close: () => void;
 *          delete: () => void;
 *          isValid: () => boolean;
 *          getHasAlpha: () => boolean;
 *          getImageWidth(image_index: number, level_index: number): number;
 *          getImageHeight(image_index: number, level_index: number): number;
 *          getImageTranscodedSizeInBytes(level_index: number, layer_index: number, face_index: number, format: number): number;
 *          startTranscoding: () => boolean;
 *          transcodeImage(dst: Uint8Array, level_index: number, layer_index: number, face_index: number, format: number, get_alpha_for_opaque_formats: number, channel0: number, channel1: number): boolean
 *      };
 *  },
 *  transcoder_texture_format: {
 *      cTFASTC_4x4_RGBA:     { value: 10 },
 *      cTFASTC_HDR_4x4_RGBA: { value: 23 },
 *      cTFASTC_HDR_6x6_RGBA: { value: 27 },
 *      cTFATC_RGB:           { value: 11 },
 *      cTFATC_RGBA:          { value: 12 },
 *      cTFBC1_RGB:           { value: 2  },
 *      cTFBC3_RGBA:          { value: 3  },
 *      cTFBC4_R:             { value: 4  },
 *      cTFBC5_RG:            { value: 5  },
 *      cTFBC6H:              { value: 22 },
 *      cTFBC7_RGBA:          { value: 6  },
 *      cTFBGR565:            { value: 15 },
 *      cTFETC1_RGB:          { value: 0  },
 *      cTFETC2_EAC_R11:      { value: 20 },
 *      cTFETC2_EAC_RG11:     { value: 21 },
 *      cTFETC2_RGBA:         { value: 1  },
 *      cTFFXT1_RGB:          { value: 17 },
 *      cTFPVRTC1_4_RGB:      { value: 8  },
 *      cTFPVRTC1_4_RGBA:     { value: 9  },
 *      cTFPVRTC2_4_RGB:      { value: 18 },
 *      cTFPVRTC2_4_RGBA:     { value: 19 },
 *      cTFRGB565:            { value: 14 },
 *      cTFRGBA32:            { value: 13 },
 *      cTFRGBA4444:          { value: 16 },
 *      cTFRGBA_HALF:         { value: 25 },
 *      cTFRGB_9E5:           { value: 26 },
 *      cTFRGB_HALF:          { value: 24 },
 *  },
 *  initializeBasis: () => void;
 * }} BasisUModule
 */

/**
 * @internal
 * @callback BasisUDefine
 * @param {string|Array<string>} _
 * @param {() => (options: { locateFile: () => string }) => Promise<BasisUModule>} factory
 *
 * @internal
 * @typedef {BasisUDefine & { amd?: boolean }} AMDDefine
 */

/**
 * @type {Promise<BasisUModule>|null}
 */
let promise = null;

/**
 * Imports and initializes the BasisU wasm module
 */
export async function BasisUFactory() {
    promise ??= new Promise(async (resolve, reject) => {
        //import from UMD by setting global AMD define function
        const global = /** @type {{ define: AMDDefine, process: unknown }} */(/** @type {unknown} */(globalThis));
        const originalDefine  = global.define;
        const originalProcess = global.process;

        try {
            //We need to ensure that module treats it as web (i.e. ENVIRONMENT_IS_WEB)
            delete global.process;
            global.define = (_, factory) => {
                factory()({
                    locateFile: () => import.meta.resolve('basis_universal/basis_transcoder.wasm'),
                }).then(module => {
                    module.initializeBasis();
                    resolve(module);
                });
            };
            global.define.amd = true;
            await import('basis_universal/basis_transcoder.js');
        } catch(e) {
            reject(e);
        } finally {
            global.process = originalProcess;
            global.define  = originalDefine;
        }
    });
    return promise;
}
