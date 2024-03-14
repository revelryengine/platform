import { BasisUFactory } from '../../deps/basis_universal.js';

const basis = await BasisUFactory();

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

/**
 * @param {{ arrayBuffer: ArrayBuffer, supportedCompression: { astc: boolean, bc7: boolean, etc2: boolean, dxt: boolean, pvrtc: boolean } }} options
 */
export async function transcode({ arrayBuffer, supportedCompression: { astc, bc7, etc2, dxt, pvrtc } }) {
    const { KTX2File } = basis;
    const ktx2File = new KTX2File(new Uint8Array(arrayBuffer));

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

    ktx2File?.close();
    ktx2File?.delete();

    return { result: { data, format }, transfer: [data.buffer] };
}
