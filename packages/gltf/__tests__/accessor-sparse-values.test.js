import { describe, it, expect, beforeEach } from 'bdd';
import { findItem, findItemProp } from './__helpers__/find-item.js';

import { GLTF                 } from '../gltf.js';
import { AccessorSparseValues } from '../accessor-sparse-values.js';
import { BufferView           } from '../buffer-view.js';

const FIXTURE_URL = new URL('./__fixtures__/accessor.gltf', import.meta.url);

describe('AccessorSparseValues', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    it('resolves referenceFields', () => {
        const sparse = findItemProp(gltf.accessors, 'SparseAccessor', 'sparse');
        expect(sparse.values.bufferView).to.be.instanceOf(BufferView);
    });

    it('sets default values', () => {
        const sparse = findItemProp(gltf.accessors, 'SparseAccessor', 'sparse');
        expect(sparse.values.byteOffset).to.equal(0);
    });

    describe('load', () => {
        it('loads sparse value data', () => {
            const accessor = findItem(gltf.accessors, 'SparseAccessor');
            const sparse = findItemProp(gltf.accessors, 'SparseAccessor', 'sparse');

            const typed = new Float32Array(
                sparse.values.getArrayBuffer(),
                sparse.values.bufferView.byteOffset + sparse.values.byteOffset,
                sparse.count * accessor.getNumberOfComponents(),
            );

            expect(Array.from(typed)).to.deep.equal([
                10, 10, 10,
                20, 20, 20,
            ]);
        });
    });

    describe('getArrayBuffer', () => {
        it('throws when buffers have not been loaded yet', () => {
            const values = new AccessorSparseValues({
                bufferView: /** @type {BufferView} */({}),
            });

            expect(() => values.getArrayBuffer()).to.throw('Invalid State');
        });
    });
});
