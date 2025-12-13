import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF       } from '../gltf.js';
import { Buffer     } from '../buffer.js';
import { BufferView } from '../buffer-view.js';

const FIXTURE_URL = new URL('./__fixtures__/mesh.gltf', import.meta.url);

describe('BufferView', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    it('resolves referenceFields', () => {
        const view = gltf.bufferViews[0];

        expect(view.buffer).to.be.instanceOf(Buffer);
    });

    it('sets defaults values', () => {
        const buffer = new Buffer({ byteLength: 16 });
        const view = new BufferView({ buffer, byteLength: 16 });

        expect(view.byteOffset).to.equal(0);
        expect(view.byteLength).to.equal(16);
    });
});
