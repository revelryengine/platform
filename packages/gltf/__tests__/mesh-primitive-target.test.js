import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF     } from '../gltf.js';
import { Accessor } from '../accessor.js';

const FIXTURE_URL = new URL('./__fixtures__/mesh.gltf', import.meta.url);

describe('MeshPrimitiveTarget', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    it('resolves referenceFields', () => {
        const target = gltf.meshes[0].primitives[0].targets?.[0];
        const accessors = /** @type {Record<string, Accessor | undefined>} */ (target ?? {});
        const targetAttributes = ['POSITION', 'NORMAL', 'TANGENT', 'TEXCOORD_0', 'TEXCOORD_1'];

        targetAttributes.forEach((name) => {
            expect(accessors[name]).to.be.instanceOf(Accessor);
        });
    });
});
