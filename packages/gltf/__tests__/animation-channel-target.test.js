import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF } from '../gltf.js';
import { Node } from '../node.js';

const FIXTURE_URL = new URL('./__fixtures__/animation.gltf', import.meta.url);

describe('AnimationChannelTarget', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    it('resolves referenceFields', () => {
        const channel = gltf.animations[0]?.channels[0];

        expect(channel?.target?.node).to.be.instanceOf(Node);
    });
});
