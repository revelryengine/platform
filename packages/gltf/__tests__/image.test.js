import { describe, it, expect, beforeEach } from 'bdd';
import { findItem } from './__helpers__/find-item.js';

import { GLTF       } from '../gltf.js';
import { Image      } from '../image.js';
import { BufferView } from '../buffer-view.js';

const FIXTURE_URL = new URL('./__fixtures__/image.gltf', import.meta.url);

describe('Image', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    it('resolves referenceFields', () => {
        const uriImage    = findItem(gltf.images, 'UriPng');
        const bufferImage = findItem(gltf.images, 'BufferPng');

        expect(uriImage).to.be.instanceOf(Image);
        expect(uriImage.uri).to.be.instanceOf(URL);
        expect(bufferImage.bufferView).to.be.instanceOf(BufferView);
    });

    describe('load', () => {
        it('correctly detects mime types when mimeType is undefined', async () => {
            const png = findItem(gltf.images, 'UndefinedPng');
            const jpg = findItem(gltf.images, 'UndefinedJpeg');

            expect(png.getImageData()).to.be.instanceOf(ImageBitmap);
            expect(jpg.getImageData()).to.be.instanceOf(ImageBitmap);
        });

        it('generates image bitmaps for known mime types', async () => {
            const png = findItem(gltf.images, 'UriPng');
            const jpg = findItem(gltf.images, 'UriJpeg');

            expect(png.getImageData()).to.be.instanceOf(ImageBitmap);
            expect(jpg.getImageData()).to.be.instanceOf(ImageBitmap);
        });

        it('loads images from buffer data', async () => {
            const png = findItem(gltf.images, 'BufferPng');
            const jpg = findItem(gltf.images, 'BufferJpeg');

            expect(png.getImageData()).to.be.instanceOf(ImageBitmap);
            expect(jpg.getImageData()).to.be.instanceOf(ImageBitmap);
        });

        it('loads raw image data and parses metadata for unknown mime types', async () => {
            const image = findItem(gltf.images, 'KtxImage');

            expect(image.getImageData()).to.be.instanceOf(Uint8Array);
        });


        it('loads embedded data URIs', async () => {
            const png = findItem(gltf.images, 'EmbeddedPng');
            const jpg = findItem(gltf.images, 'EmbeddedJpeg');

            expect(png.getImageData()).to.be.instanceOf(ImageBitmap);
            expect(jpg.getImageData()).to.be.instanceOf(ImageBitmap);
        });

        it('throws when image data both uri and bufferView are undefined', async () => {
            const invalidImage = new Image({ name: 'Invalid', mimeType: 'image/png' });
            await expect(invalidImage.load()).to.be.rejectedWith('Invalid Data');
        });
    });

    describe('getImageData', () => {
        it('throws when image data has not been loaded yet', () => {
            const image = new Image({ name: 'Empty', mimeType: 'image/png' });

            expect(() => image.getImageData()).to.throw('Invalid State');
        });
    });

    describe('setImageData', () => {
        it('accepts injected image bitmaps for tooling overrides', () => {
            const image  = findItem(gltf.images, 'UndefinedPng');
            const bitmap = { width: 2, height: 2, close: async () => {} };

            image.setImageData(bitmap);

            expect(image?.getImageData()).to.equal(bitmap);
        });
    });
});
