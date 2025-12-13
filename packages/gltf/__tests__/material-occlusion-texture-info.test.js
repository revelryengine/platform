import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF                           } from '../gltf.js';
import { MaterialOcclusionTextureInfo   } from '../material-occlusion-texture-info.js';
import { Texture                        } from '../texture.js';

const FIXTURE_URL = new URL('./__fixtures__/material.gltf', import.meta.url);

describe('MaterialOcclusionTextureInfo', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

     it('resolves referenceFields', () => {
        const occlusion = gltf.materials[0].occlusionTexture;

        expect(occlusion?.texture).to.be.instanceOf(Texture);
    });

    it('sets default values', () => {
        const texture = gltf.textures[0];
        const occlusion = new MaterialOcclusionTextureInfo({ texture });

        expect(occlusion.strength).to.equal(1);
    });
});
