import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF             } from '../gltf.js';
import { AnimationSampler } from '../animation-sampler.js';
import { Accessor         } from '../accessor.js';

const FIXTURE_URL = new URL('./__fixtures__/animation.gltf', import.meta.url);

describe('AnimationSampler', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    it('resolves referenceFields', () => {
        const sampler = gltf.animations[0]?.samplers[0];

        expect(sampler?.input).to.be.instanceOf(Accessor);
        expect(sampler?.output).to.be.instanceOf(Accessor);
        expect(sampler?.input?.name).to.equal('TimeAccessor');
        expect(sampler?.output?.name).to.equal('TranslationAccessor');
    });

    it('sets defaults values', () => {
        const accessor = gltf.animations[0]?.samplers[0]?.input;
        const sampler = new AnimationSampler({ input: accessor, output: accessor });

        expect(sampler.interpolation).to.equal('LINEAR');
    });
});
