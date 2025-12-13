// deno-coverage-ignore-file - Coverage does not work well with workers in Deno, will be covered in browser tests
/**
 * Worker module for transcoding KTX2 textures using Basis Universal.
 * @module
 */

import { BasisUFactory } from 'revelryengine/deps/basis_universal.js';

const basis = await BasisUFactory();

/**
 * @typedef {object} TranscodeResponse - The response from the transcode worker.
 * @property {object} result - The result of the transcode operation.
 * @property {Uint8Array} result.output - The transcoded texture data.
 * @property {number} result.format - The format of the transcoded texture.
 */
/**
 * Transcodes a KTX2 texture to a different format.
 * @param {object} options - The transcode options
 * @param {Uint8Array} options.input - The KTX2 texture data.
 * @param {{ astc: boolean, bc7: boolean, etc2: boolean }} options.supportedCompression - Supported compression formats.
 */
export async function transcode({ input, supportedCompression: { astc, bc7, etc2 } }) {
    const { KTX2File, transcoder_texture_format } = basis;
    const ktx2File = new KTX2File(input);

    let format;
    if (astc) {
        format = transcoder_texture_format.cTFASTC_4x4_RGBA.value;
    } else if (bc7) {
        format = transcoder_texture_format.cTFBC7_RGBA.value;
    } else if (etc2) {
        format = transcoder_texture_format.cTFETC2_RGBA.value;
    } else {
        format = transcoder_texture_format.cTFRGBA32.value;
    }

    if (!ktx2File.startTranscoding()) {
        throw new Error('Transcoding Failed: Invalid KTX2 data');
    }

    const size = ktx2File.getImageTranscodedSizeInBytes(0, 0, 0, format);
    const output = new Uint8Array(size);

    if (!ktx2File.transcodeImage(output, 0, 0, 0, format, 0, -1, -1)) {
        throw new Error('Transcoding Failed: Corrupt KTX2 data');
    }

    ktx2File.close();
    ktx2File.delete();

    return /** @type {TranscodeResponse}*/({
        result: { output, format },
        transfer: [output.buffer],
    });
}
