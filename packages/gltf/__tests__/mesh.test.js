import { describe, it, expect, beforeEach, sinon } from 'bdd';

import { GLTF          } from '../gltf.js';
import { Mesh          } from '../mesh.js';
import { MeshPrimitive } from '../mesh-primitive.js';

const FIXTURE_URL = new URL('./__fixtures__/mesh.gltf', import.meta.url);

describe('Mesh', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    it('resolves referenceFields', () => {
        const mesh = gltf.meshes[0];

        expect(mesh.primitives[0]).to.be.instanceOf(MeshPrimitive);
    });

    describe('load', () => {
        it('loads all primitives sequentially', async () => {
            const primitiveA = new MeshPrimitive({ attributes: {} });
            const primitiveB = new MeshPrimitive({ attributes: {} });

            const spyA = sinon.spy(primitiveA, 'load');
            const spyB = sinon.spy(primitiveB, 'load');

            const mesh = new Mesh({ primitives: [primitiveA, primitiveB] });

            await mesh.load();

            expect(spyA.calledOnce).to.be.true;
            expect(spyB.calledOnce).to.be.true;
        });
    });
});
