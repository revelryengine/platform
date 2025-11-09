/**
 * Worker module for transcoding KTX2 textures using Basis Universal.
 * @module
 */

import { BasisUFactory } from "revelryengine/deps/basis_universal.js";

const basis = await BasisUFactory();

/**
 * @typedef {object} TranscodeResponse - The response from the transcode worker.
 * @property {object} result - The result of the transcode operation.
 * @property {Uint8Array} result.data - The transcoded texture data.
 * @property {number} result.format - The format of the transcoded texture.
 */
/**
 * Transcodes a KTX2 texture to a different format.
 * @param {object} options - The transcode options
 * @param {ArrayBuffer} options.arrayBuffer - The KTX2 texture data.
 * @param {{ astc: boolean, bc7: boolean, etc2: boolean, dxt: boolean, pvrtc: boolean }} options.supportedCompression - Supported compression formats.
 */
export async function transcode({ arrayBuffer, supportedCompression: { astc, bc7, etc2, dxt, pvrtc } }) {
    const { KTX2File, transcoder_texture_format } = basis;
    const ktx2File = new KTX2File(new Uint8Array(arrayBuffer));

    if (!ktx2File.isValid()) {
        throw new Error('Invalid ktx2 file');
    }

    const hasAlpha = ktx2File.getHasAlpha();

    let format;
    if (astc) {
        format = transcoder_texture_format.cTFASTC_4x4_RGBA.value;
    } else if (bc7) {
        format = transcoder_texture_format.cTFBC7_RGBA.value;
    } else if (dxt) {
        if (hasAlpha) {
            format = transcoder_texture_format.cTFBC3_RGBA.value;
        } else {
            format = transcoder_texture_format.cTFBC1_RGB.value;
        }
    } else if (pvrtc) {
        if (hasAlpha) {
            format = transcoder_texture_format.cTFPVRTC1_4_RGBA.value;
        }
        else {
            format = transcoder_texture_format.cTFPVRTC1_4_RGB.value;
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
        format = transcoder_texture_format.cTFETC2_RGBA.value;
    } else {
        format = transcoder_texture_format.cTFRGBA32.value;
    }

    if (!ktx2File.startTranscoding()) {
        throw new Error('transcoding start failed');
    }

    const size = ktx2File.getImageTranscodedSizeInBytes(0, 0, 0, format);
    const data = new Uint8Array(size);

    if (!ktx2File.transcodeImage(data, 0, 0, 0, format, 0, -1, -1)) {
        throw new Error('transcoding failed');
    }

    ktx2File?.close();
    ktx2File?.delete();

    return /** @type {TranscodeResponse}*/({
        result: { data, format },
        transfer: [data.buffer],
    });
}
