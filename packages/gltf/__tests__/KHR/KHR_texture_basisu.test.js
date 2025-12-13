import { describe, it, expect, beforeEach, after, before } from 'bdd';
import { findItem } from '../__helpers__/find-item.js';

import { GLTF                    } from '../../gltf.js';
import { Image                   } from '../../image.js';
import { TextureKHRTextureBasisu } from '../../KHR/KHR_texture_basisu.js';
import { transcode               } from '../../KHR/KHR_texture_basisu.worker.js';

import { read as readKTX, KTX2Container } from 'revelryengine/deps/ktx-parse.js';

const FIXTURE_URL = new URL('../__fixtures__/khr-texture-basisu.gltf', import.meta.url);

describe('KHR_texture_basisu', () => {
    /** @type {GLTF} */
    let gltf;

    /**
     * @type {TextureKHRTextureBasisu}
     */
    let uastcExtension;

    /**
     * @type {TextureKHRTextureBasisu}
     */
    let etc1sExtension;

    before(() => {
        globalThis.REV ??= {}
        globalThis.REV.KHR_texture_basisu = { workerCount: 1 }
    });

    after(async () => {
        TextureKHRTextureBasisu.workerPool.disconnect();
    });

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);

        const uastc = findItem(gltf.textures, 'UastcTexture');
        const etc1s = findItem(gltf.textures, 'Etc1sTexture');

        uastcExtension = /** @type {TextureKHRTextureBasisu} */(uastc.extensions?.KHR_texture_basisu);
        etc1sExtension = /** @type {TextureKHRTextureBasisu} */(etc1s.extensions?.KHR_texture_basisu);
    });

    it('resolves on Texture extensions', () => {
        expect(uastcExtension).to.be.instanceOf(TextureKHRTextureBasisu);
        expect(etc1sExtension).to.be.instanceOf(TextureKHRTextureBasisu);
    });

    it('resolves referenceFields', () => {
        expect(uastcExtension.source).to.be.instanceOf(Image);
        expect(etc1sExtension.source).to.be.instanceOf(Image);
    });

    describe('load', () => {
        it('automatically connects the worker pool', async () => {
            expect(TextureKHRTextureBasisu.workerPool?.status).to.equal('connected');
        });

        it('loads KTX image data from the source image', async () => {
            expect(uastcExtension.getImageDataKTX()).to.be.instanceOf(KTX2Container);
            expect(etc1sExtension.getImageDataKTX()).to.be.instanceOf(KTX2Container);
        });
    });

    describe('getImageDataKTX', () => {
        it('throws when image data has not been loaded yet', () => {
            const image = new TextureKHRTextureBasisu({ source: findItem(gltf.images, 'UastcKTX2') });
            expect(() => image.getImageDataKTX()).to.throw('Invalid State');
        });
    });

    describe('globalThis.REV.KHR_texture_basisu.workerCount', () => {
        it('sets the worker count on load', async () => {
            expect(TextureKHRTextureBasisu.workerPool?.workers.length).to.equal(1);
        });

        it('defaults to 4 workers if not specified', async () => {
            TextureKHRTextureBasisu.workerPool.disconnect();
            delete globalThis.REV?.KHR_texture_basisu?.workerCount;
            await uastcExtension.load();
            expect(TextureKHRTextureBasisu.workerPool?.workers.length).to.equal(4);
        });
    });

    describe('transcode', () => {
        it('transcodes to astc format', async () => {
            await expect(uastcExtension.transcode({ astc: true, bc7: false, etc2: false })).to.eventually.be.fulfilled;
            await expect(etc1sExtension.transcode({ astc: true, bc7: false, etc2: false })).to.eventually.be.fulfilled;
        });

        it('transcodes to bc7 format', async () => {
            await expect(uastcExtension.transcode({ astc: false, bc7: true, etc2: false })).to.eventually.be.fulfilled;
            await expect(etc1sExtension.transcode({ astc: false, bc7: true, etc2: false })).to.eventually.be.fulfilled;
        });

        it('transcodes to etc2 format', async () => {
            await expect(uastcExtension.transcode({ astc: false, bc7: false, etc2: true })).to.eventually.be.fulfilled;
            await expect(etc1sExtension.transcode({ astc: false, bc7: false, etc2: true })).to.eventually.be.fulfilled;
        });

        it('transcodes to uncompressed format', async () => {
            await expect(uastcExtension.transcode({ astc: false, bc7: false, etc2: false })).to.eventually.be.fulfilled;
            await expect(etc1sExtension.transcode({ astc: false, bc7: false, etc2: false })).to.eventually.be.fulfilled;
        });
    });

    describe('worker', () => {
        /**
         * @type {Uint8Array}
         */
        let uastcInput;
        /**
         * @type {Uint8Array}
         */
        let etc1sInput;
        beforeEach(() => {
            uastcInput = /** @type {Uint8Array<ArrayBuffer>}*/(uastcExtension.source.getImageData());
            etc1sInput = /** @type {Uint8Array<ArrayBuffer>}*/(etc1sExtension.source.getImageData());
        });
        it('transcodes to astc format', async () => {
            await expect(transcode({ input: uastcInput, supportedCompression: { astc: true, bc7: false, etc2: false } })).to.eventually.be.fulfilled;
            await expect(transcode({ input: etc1sInput, supportedCompression: { astc: true, bc7: false, etc2: false } })).to.eventually.be.fulfilled;
        });

        it('transcodes to bc7 format', async () => {
            await expect(transcode({ input: uastcInput, supportedCompression: { astc: false, bc7: true, etc2: false } })).to.eventually.be.fulfilled;
            await expect(transcode({ input: etc1sInput, supportedCompression: { astc: false, bc7: true, etc2: false } })).to.eventually.be.fulfilled;
        });
        it('transcodes to etc2 format', async () => {
            await expect(transcode({ input: uastcInput, supportedCompression: { astc: false, bc7: false, etc2: true } })).to.eventually.be.fulfilled;
            await expect(transcode({ input: etc1sInput, supportedCompression: { astc: false, bc7: false, etc2: true } })).to.eventually.be.fulfilled;
        });

        it('transcodes to uncompressed format', async () => {
            await expect(transcode({ input: uastcInput, supportedCompression: { astc: false, bc7: false, etc2: false } })).to.eventually.be.fulfilled;
            await expect(transcode({ input: etc1sInput, supportedCompression: { astc: false, bc7: false, etc2: false } })).to.eventually.be.fulfilled;
        });

        it('throws error on invalid data', async () => {
            const invalidInput = new Uint8Array(8);
            await expect(transcode({ input: invalidInput, supportedCompression: { astc: false, bc7: false, etc2: false } })).to.eventually.be.rejectedWith(Error, 'Transcoding Failed: Invalid KTX2 data');
        });

        it('throws error on corrupt data', async () => {
            const etc1sBuffer = await fetch(new URL('../__fixtures__/textures/2d_etc1s.ktx2', import.meta.url)).then(res => res.arrayBuffer());
            const corruptedInput = corruptKTX2LevelPayload(etc1sBuffer);
            await expect(transcode({ input: corruptedInput, supportedCompression: { astc: false, bc7: false, etc2: false } })).to.eventually.be.rejectedWith(Error, 'Transcoding Failed: Corrupt KTX2 data');
        });
    });
});

/**
 * Takes a valid ETC1S encoded KTX2 file and corrupts the first mip level payload while
 * leaving the container header and supercompression global data untouched. This simulates
 * the secondary validation failures inside the transcoder library without tripping
 * the upfront startTranscoding() checks.
 *
 * See [transcode_image_level](https://github.com/BinomialLLC/basis_universal/blob/5c511882f1fdacfac798e83b5102f2f782d1de2f/transcoder/basisu_transcoder.cpp#L19397)
 * See [transcode_slice](https://github.com/BinomialLLC/basis_universal/blob/5c511882f1fdacfac798e83b5102f2f782d1de2f/transcoder/basisu_transcoder.cpp#L8488)
 *
 * @param {ArrayBuffer} buffer - The pristine KTX2 contents.
 * @returns {Uint8Array} A cloned buffer with part of the first level payload zeroed.
 */
function corruptKTX2LevelPayload(buffer) {
    const source    = new Uint8Array(buffer);
    const clone     = new Uint8Array(source); // Copies so the original fixture remains usable elsewhere.
    const container = readKTX(clone);
    const level     = container.levels[0];

    if (!level) throw new Error('Expected the fixture KTX2 to provide at least one mip level');

    const payload = level.levelData;
    const bytesToCorrupt = Math.min(payload.length, 64);
    if (bytesToCorrupt === 0) throw new Error('Fixture payload is unexpectedly empty');

    for (let i = 0; i < bytesToCorrupt; i++) {
        payload[i] = 0;
    }

    return clone;
}
