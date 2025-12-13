import { describe, it, expect, beforeEach } from 'bdd';
import { findItem } from './__helpers__/find-item.js';

import { GLTF    } from '../gltf.js';
import { Image   } from '../image.js';
import { Sampler } from '../sampler.js';

const FIXTURE_URL = new URL('./__fixtures__/texture.gltf', import.meta.url);

describe('Texture', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    it('resolves referenceFields', () => {
        const texture = gltf.textures[0];

        expect(texture.sampler).to.be.instanceOf(Sampler);
        expect(texture.source).to.be.instanceOf(Image);
    });

    describe('getSource', () => {
        it('returns the image source', () => {
            const texture = findItem(gltf.textures, 'TextureWithSampler');

            expect(texture.getSource()).to.equal(texture.source);
        });
    });
});
