import { describe, it, expect, beforeEach } from 'bdd';
import { findItemProp } from './__helpers__/find-item.js';

import { GLTF                  } from '../gltf.js';
import { AccessorSparseIndices } from '../accessor-sparse-indices.js';
import { BufferView            } from '../buffer-view.js';

const FIXTURE_URL = new URL('./__fixtures__/accessor.gltf', import.meta.url);

describe('AccessorSparseIndices', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    it('resolves referenceFields', () => {
        const sparse = findItemProp(gltf.accessors, 'SparseAccessor', 'sparse');
        expect(sparse.indices.bufferView).to.be.instanceOf(BufferView);
    });

    it('sets default values', () => {
        const sparse = findItemProp(gltf.accessors, 'SparseAccessor', 'sparse');
        expect(sparse.indices.byteOffset).to.equal(0);
    });

    describe('load', () => {
        it('loads index data into memory', () => {
            const sparse = findItemProp(gltf.accessors, 'SparseAccessor', 'sparse');

            const typed = new Uint16Array(
                sparse.indices.getArrayBuffer(),
                sparse.indices.bufferView.byteOffset + sparse.indices.byteOffset,
                sparse.count,
            );

            expect(Array.from(typed)).to.deep.equal([1, 2]);
        });
    });

    describe('getArrayBuffer', () => {
        it('throws when buffers have not been loaded yet', () => {
            const indices = new AccessorSparseIndices({
                bufferView: /** @type {BufferView} */({}),
                componentType: 5123,
            });

            expect(() => indices.getArrayBuffer()).to.throw('Invalid State');
        });
    });
});
