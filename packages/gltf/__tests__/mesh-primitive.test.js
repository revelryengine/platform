import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF          } from '../gltf.js';
import { MeshPrimitive } from '../mesh-primitive.js';
import { Accessor      } from '../accessor.js';
import { Material      } from '../material.js';

const FIXTURE_URL = new URL('./__fixtures__/mesh.gltf', import.meta.url);

describe('MeshPrimitive', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    it('resolves referenceFields', () => {
        const primitive = gltf.meshes[0].primitives[0];
        const attributes = /** @type {Record<string, Accessor | undefined>} */ (primitive.attributes);
        const attributeNames = [
            'POSITION', 'NORMAL', 'TANGENT',
            'TEXCOORD_0', 'TEXCOORD_1', 'TEXCOORD_2', 'TEXCOORD_3',
            'COLOR_0', 'COLOR_1',
            'WEIGHTS_0', 'WEIGHTS_1',
            'JOINTS_0', 'JOINTS_1',
        ];

        attributeNames.forEach((name) => {
            expect(attributes[name]).to.be.instanceOf(Accessor);
        });
        expect(primitive.indices).to.be.instanceOf(Accessor);
        expect(primitive.material).to.be.instanceOf(Material);
    });

    it('sets default values', () => {
        const primitive = new MeshPrimitive({ attributes: {} });
        expect(primitive.mode).to.equal(4);
    });

    describe('$id', () => {
        it('generates an incremented id for each mesh primitive', () => {
            const primitiveA = new MeshPrimitive({ attributes: {} });
            const primitiveB = new MeshPrimitive({ attributes: {} });
            expect(primitiveB.$id).to.equal(primitiveA.$id + 1);
        });
    });
});
