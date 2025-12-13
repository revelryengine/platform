import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF                                } from '../gltf.js';
import { Material                            } from '../material.js';
import { MaterialPBRMetallicRoughness        } from '../material-pbr-metallic-roughness.js';
import { MaterialNormalTextureInfo           } from '../material-normal-texture-info.js';
import { MaterialOcclusionTextureInfo        } from '../material-occlusion-texture-info.js';
import { TextureInfo                         } from '../texture-info.js';

const FIXTURE_URL = new URL('./__fixtures__/material.gltf', import.meta.url);

describe('Material', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    it('resolves referenceFields', () => {
        const material = gltf.materials[0];

        expect(material.pbrMetallicRoughness).to.be.instanceOf(MaterialPBRMetallicRoughness);
        expect(material.normalTexture).to.be.instanceOf(MaterialNormalTextureInfo);
        expect(material.occlusionTexture).to.be.instanceOf(MaterialOcclusionTextureInfo);
        expect(material.emissiveTexture).to.be.instanceOf(TextureInfo);
        expect(material.emissiveTexture?.texture.sRGB).to.be.true;
    });

    it('sets default values', () => {
        const material = new Material({});

        expect(material.emissiveFactor).to.deep.equal([0, 0, 0]);
        expect(material.alphaMode).to.equal('OPAQUE');
        expect(material.alphaCutoff).to.equal(0.5);
        expect(material.doubleSided).to.be.false;
        expect(material.pbrMetallicRoughness).to.be.undefined;
    });
});
