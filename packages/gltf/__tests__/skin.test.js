import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF     } from '../gltf.js';
import { Node     } from '../node.js';
import { Accessor } from '../accessor.js';

const FIXTURE_URL = new URL('./__fixtures__/mesh.gltf', import.meta.url);

describe('Skin', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    it('resolves referenceFields', () => {
        const skin = gltf.skins[0];

        expect(skin.joints[0]).to.be.instanceOf(Node);
        expect(skin.inverseBindMatrices).to.be.instanceOf(Accessor);
        expect(skin.skeleton).to.be.instanceOf(Node);
    });
});
