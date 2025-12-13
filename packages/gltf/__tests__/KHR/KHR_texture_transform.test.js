import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF                           } from '../../gltf.js';
import { TextureInfoKHRTextureTransform } from '../../KHR/KHR_texture_transform.js';

/**
 * @import { Material                     } from '../../material.js';
 * @import { TextureInfo                  } from '../../texture-info.js';
 * @import { MaterialNormalTextureInfo    } from '../../material-normal-texture-info.js';
 * @import { MaterialOcclusionTextureInfo } from '../../material-occlusion-texture-info.js';
 */

const FIXTURE_URL = new URL('../__fixtures__/material.gltf', import.meta.url);

describe('KHR_texture_transform', () => {
    /** @type {GLTF} */
    let gltf;
    /** @type {Material} */
    let material;

    /**
     * @param {(TextureInfo | MaterialNormalTextureInfo | MaterialOcclusionTextureInfo)} [textureInfo]
     */
    const getTransform = (textureInfo) => textureInfo?.extensions?.KHR_texture_transform;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
        material = gltf.materials[0];
    });

    it('resolves on TextureInfo-based extensions', () => {
        const baseColorTexture = material.pbrMetallicRoughness?.baseColorTexture;
        const normalTexture    = material.normalTexture;
        const occlusionTexture = material.occlusionTexture;

        expect(getTransform(baseColorTexture)).to.be.instanceOf(TextureInfoKHRTextureTransform);
        expect(getTransform(normalTexture)).to.be.instanceOf(TextureInfoKHRTextureTransform);
        expect(getTransform(occlusionTexture)).to.be.instanceOf(TextureInfoKHRTextureTransform);
    });

    it('sets default values', () => {
        const extension = new TextureInfoKHRTextureTransform({});

        expect(extension.offset).to.deep.equal([0, 0]);
        expect(extension.rotation).to.equal(0);
        expect(extension.scale).to.deep.equal([1, 1]);
        expect(extension.texCoord).to.be.undefined;
    });

        it('overrides texture coordinates and exposes metadata', () => {
        const baseColorTransform = getTransform(material.pbrMetallicRoughness?.baseColorTexture);
        const occlusionTransform = getTransform(material.occlusionTexture);

        expect(baseColorTransform?.offset).to.deep.equal([0.1, 0.2]);
        expect(baseColorTransform?.texCoord).to.equal(2);
        expect(baseColorTransform?.scale).to.deep.equal([0.5, 0.75]);

        expect(occlusionTransform?.offset).to.deep.equal([0, 0.1]);
        expect(occlusionTransform?.texCoord).to.equal(3);
        expect(occlusionTransform?.scale).to.deep.equal([0.8, 0.8]);
    });

    it('builds UV transform matrices for translation, rotation, and scale', () => {
        const translationOnly = new TextureInfoKHRTextureTransform({ offset: [0.25, 0.75] });

        expect(Array.from(translationOnly.getTransform())).to.deep.equal([1, 0, 0, 0, 1, 0, 0.25, 0.75, 1]);

        const rotationOnly     = new TextureInfoKHRTextureTransform({ rotation: Math.PI / 2 });
        const rotationMatrix   = Array.from(rotationOnly.getTransform());
        const expectedRotation = [0, -1, 0, 1, 0, 0, 0, 0, 1];

        rotationMatrix.forEach((value, index) => {
            expect(value).to.be.closeTo(expectedRotation[index], 1e-6);
        });

        const scaleOnly = new TextureInfoKHRTextureTransform({ scale: [2, 3] });

        expect(Array.from(scaleOnly.getTransform())).to.deep.equal([2, 0, 0, 0, 3, 0, 0, 0, 1]);
    });
});
