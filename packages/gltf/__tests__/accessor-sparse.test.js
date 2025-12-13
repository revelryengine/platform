import { describe, it, expect, beforeEach } from 'bdd';
import { findItemProp } from './__helpers__/find-item.js';

import { GLTF                  } from '../gltf.js';
import { AccessorSparseIndices } from '../accessor-sparse-indices.js';
import { AccessorSparseValues  } from '../accessor-sparse-values.js';

const FIXTURE_URL = new URL('./__fixtures__/accessor.gltf', import.meta.url);

describe('AccessorSparse', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    it('resolves referenceFields', () => {
        const sparse = findItemProp(gltf.accessors, 'SparseAccessor', 'sparse');

        expect(sparse.indices).to.be.instanceOf(AccessorSparseIndices);
        expect(sparse.values).to.be.instanceOf(AccessorSparseValues);
    });

    describe('load', () => {
        it('loads indices and values', () => {
            const sparse = findItemProp(gltf.accessors, 'SparseAccessor', 'sparse');

            expect(sparse.indices.getArrayBuffer()).to.be.instanceOf(ArrayBuffer);
            expect(sparse.values.getArrayBuffer()).to.be.instanceOf(ArrayBuffer);
        });
    });
});
