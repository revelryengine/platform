import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF                          } from '../gltf.js';
import { MaterialPBRMetallicRoughness  } from '../material-pbr-metallic-roughness.js';
import { TextureInfo                   } from '../texture-info.js';

const FIXTURE_URL = new URL('./__fixtures__/material.gltf', import.meta.url);

describe('MaterialPBRMetallicRoughness', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    it('resolves referenceFields', () => {
        const pbr = gltf.materials[0].pbrMetallicRoughness;

        expect(pbr?.baseColorTexture).to.be.instanceOf(TextureInfo);
        expect(pbr?.baseColorTexture?.texture.sRGB).to.be.true;
        expect(pbr?.metallicRoughnessTexture).to.be.instanceOf(TextureInfo);
    });

    it('sets default values', () => {
        const pbr = new MaterialPBRMetallicRoughness();

        expect(pbr.baseColorFactor).to.deep.equal([1, 1, 1, 1]);
        expect(pbr.metallicFactor).to.equal(1);
        expect(pbr.roughnessFactor).to.equal(1);
    });
});
