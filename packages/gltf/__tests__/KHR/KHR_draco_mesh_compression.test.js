import { describe, it, expect, beforeEach, before, after } from 'bdd';

import { GLTF                                 } from '../../gltf.js';
import { BufferView                           } from '../../buffer-view.js';
import { Accessor                             } from '../../accessor.js';
import { MeshPrimitiveKHRDracoMeshCompression } from '../../KHR/KHR_draco_mesh_compression.js';
import { decode                               } from '../../KHR/KHR_draco_mesh_compression.worker.js';

/**
 * @import { AttributeName } from '../../mesh-primitive.js';
 */

const FIXTURE_URL = new URL('../__fixtures__/khr-draco-mesh.gltf', import.meta.url);

describe('KHR_draco_mesh_compression', () => {
    /** @type {GLTF} */
    let gltf;

    /** @type {MeshPrimitiveKHRDracoMeshCompression} */
    let dracoExtension;

    before(() => {
        globalThis.REV ??= {}
        globalThis.REV.KHR_draco_mesh_compression = { workerCount: 1 }
    });

    after(async () => {
        MeshPrimitiveKHRDracoMeshCompression.workerPool.disconnect();
    });

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
        dracoExtension = /** @type {MeshPrimitiveKHRDracoMeshCompression} */(gltf.meshes[0].primitives[0].extensions?.KHR_draco_mesh_compression);
    });

    it('resolves on MeshPrimitive extensions', () => {
        expect(dracoExtension).to.be.instanceOf(MeshPrimitiveKHRDracoMeshCompression);
    });

    it('resolves referenceFields', () => {
        expect(dracoExtension.bufferView).to.be.instanceOf(BufferView);
        expect(dracoExtension.primitive.indices).to.be.instanceOf(Accessor);
        expect(dracoExtension.primitive.attributes.POSITION).to.be.instanceOf(Accessor);
        expect(dracoExtension.primitive.attributes.NORMAL).to.be.instanceOf(Accessor);
    });

    describe('globalThis.REV.KHR_draco_mesh_compression.workerCount', () => {
        it('sets the worker count on load', async () => {
            expect(MeshPrimitiveKHRDracoMeshCompression.workerPool?.workers.length).to.equal(1);
        });

        it('defaults to 4 workers if not specified', async () => {
            MeshPrimitiveKHRDracoMeshCompression.workerPool.disconnect();
            delete globalThis.REV?.KHR_draco_mesh_compression?.workerCount;
            await dracoExtension.load();
            expect(MeshPrimitiveKHRDracoMeshCompression.workerPool?.workers.length).to.equal(4);
        });
    });

    it('decodes compressed meshes with the worker', async () => {
        const indicesAccessor  = dracoExtension.primitive.indices;
        const positionAccessor = dracoExtension.primitive.attributes.POSITION;
        const normalAccessor   = dracoExtension.primitive.attributes.NORMAL;

        const indices   = Array.from(indicesAccessor?.getTypedArray() ?? []);
        const positions = Array.from(positionAccessor?.getTypedArray() ?? []);
        const normals   = Array.from(normalAccessor?.getTypedArray() ?? []);

        expect(indices).to.deep.equal([0, 1, 2]);
        expect(positions).to.deep.equal([
            0, 0, 0,
            1, 0, 0,
            0, 1, 0,
        ]);
        expect(normals).to.deep.equal([
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
        ]);
    });

    describe('worker', () => {
        /**
         * @type {BufferView}
         */
        let input;

        beforeEach(() => {
            input = dracoExtension.bufferView;
        });

        it('decodes compressed data', async () => {
            const indicesAccessor  = dracoExtension.primitive.indices;
            const positionAccessor = dracoExtension.primitive.attributes.POSITION;
            const normalAccessor   = dracoExtension.primitive.attributes.NORMAL;

            const indices   = Array.from(indicesAccessor?.getTypedArray() ?? []);
            const positions = Array.from(positionAccessor?.getTypedArray() ?? []);
            const normals   = Array.from(normalAccessor?.getTypedArray() ?? []);


            await decode({
                arrayBuffer:input.buffer.getArrayBuffer(),
                byteOffset: input.byteOffset ?? 0,
                byteLength: input.byteLength,
                attributes:  Object.fromEntries(Object.entries(dracoExtension.attributes).map(([name, id]) => {
                    const accessor = dracoExtension.primitive.attributes[/** @type {AttributeName} */(name)];
                    const typedArray =  /** @type {Accessor} */(accessor).getTypedArray();
                    return [name, { typedArray, id }];
                })),
                indices: /** @type {Uint32Array} */(dracoExtension.primitive.indices.getTypedArray()),
            });

            expect(indices).to.deep.equal([0, 1, 2]);
            expect(positions).to.deep.equal([
                0, 0, 0,
                1, 0, 0,
                0, 1, 0,
            ]);
            expect(normals).to.deep.equal([
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
            ]);
        });
    });
});
