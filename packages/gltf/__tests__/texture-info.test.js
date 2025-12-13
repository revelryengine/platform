import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF        } from '../gltf.js';
import { TextureInfo } from '../texture-info.js';
import { Texture     } from '../texture.js';

const FIXTURE_URL = new URL('./__fixtures__/texture-info.gltf', import.meta.url);

describe('TextureInfo', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    it('resolves referenceFields', () => {
        const material = gltf.materials[0];
        const info = material?.pbrMetallicRoughness?.baseColorTexture;

        expect(material).to.exist;
        expect(info).to.be.instanceOf(TextureInfo);
        expect(info?.texture).to.be.instanceOf(Texture);
        expect(info?.texture).to.equal(gltf.textures[0]);
        expect(info?.texCoord).to.equal(1);
    });

    it('sets default values', () => {
        const info = new TextureInfo({
            texture: gltf.textures[0],
        });

        expect(info.texCoord).to.equal(0);
    });

    it('proxies the sRGB flag to the underlying texture', () => {
        const baseTexture = gltf.textures[0];
        const info = new TextureInfo({ texture: baseTexture });

        baseTexture.sRGB = false;
        info.sRGB = true;

        expect(baseTexture.sRGB).to.be.true;
    });
});
