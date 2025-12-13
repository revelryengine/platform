import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF                   } from '../gltf.js';
import { AnimationSampler       } from '../animation-sampler.js';
import { AnimationChannelTarget } from '../animation-channel-target.js';

const FIXTURE_URL = new URL('./__fixtures__/animation.gltf', import.meta.url);

describe('AnimationChannel', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    it('resolves referenceFields', () => {
        const channel = gltf.animations[0]?.channels[0];

        expect(channel?.sampler).to.be.instanceOf(AnimationSampler);
        expect(channel?.target).to.be.instanceOf(AnimationChannelTarget);
    });
});
