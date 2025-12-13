import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF                      } from '../gltf.js';
import { MaterialNormalTextureInfo } from '../material-normal-texture-info.js';
import { Texture                   } from '../texture.js';

const FIXTURE_URL = new URL('./__fixtures__/material.gltf', import.meta.url);

describe('MaterialNormalTextureInfo', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    describe('referenceFields', () => {
        it('resolves referenceFields', () => {
            const normalInfo = gltf.materials[0].normalTexture;

            expect(normalInfo?.texture).to.be.instanceOf(Texture);
        });
    });

    it('sets default values', () => {
        const texture = gltf.textures[0];
        const normalInfo = new MaterialNormalTextureInfo({ texture });

        expect(normalInfo.scale).to.equal(1);
    });
});
