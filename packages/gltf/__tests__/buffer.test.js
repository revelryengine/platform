import { describe, it, expect, beforeEach } from 'bdd';
import { findItem } from './__helpers__/find-item.js';
import { expectBufferToMatch } from './__helpers__/buffer-match.js';

import { GLTF   } from '../gltf.js';
import { Buffer } from '../buffer.js';

const GLTF_FIXTURE_URL   = new URL('./__fixtures__/accessor.gltf', import.meta.url);
const BINARY_FIXTURE_URL = new URL('./__fixtures__/buffers/accessor.bin', import.meta.url);

describe('Buffer', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(GLTF_FIXTURE_URL);
    });

   it('resolves referenceFields', () => {
        const buffer = gltf.buffers[0];

        expect(buffer).to.be.instanceOf(Buffer);
        expect(buffer.uri).to.be.instanceOf(URL);
    });

    describe('load', () => {
        it('fetches external resources and copies them into the backing buffer', async () => {
            const buffer = findItem(gltf.buffers, 'BinaryData');

            await expectBufferToMatch(new Uint8Array(buffer.getArrayBuffer()), BINARY_FIXTURE_URL);
        });

        it('loads embedded base64 buffer data URIs', async () => {
            const buffer = findItem(gltf.buffers, 'EmbeddedData');

            await expectBufferToMatch(new Uint8Array(buffer.getArrayBuffer()), BINARY_FIXTURE_URL);
        });
    });

    describe('getArrayBuffer', () => {
        it('returns an array buffer that matches the declared byteLength', () => {
            const buffer = new Buffer({ byteLength: 32 });
            const arrayBuffer = buffer.getArrayBuffer();

            expect(arrayBuffer).to.be.instanceOf(ArrayBuffer);
            expect(arrayBuffer.byteLength).to.equal(32);
        });
    });
});
