import { describe, it, expect, beforeEach, browserOnly } from 'bdd';
import { findItem } from '../__helpers__/find-item.js';

import { GLTF                  } from '../../gltf.js';
import { Image                 } from '../../image.js';
import { TextureEXTTextureWebP } from '../../EXT/EXT_texture_webp.js';

/**
 * @import { Texture } from '../../texture.js';
 */

const FIXTURE_URL = new URL('../__fixtures__/ext-texture-webp.gltf', import.meta.url);

browserOnly('EXT_texture_webp', () => {
    /** @type {GLTF} */
    let gltf;

    /** @type {Texture} */
    let texture;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
        texture = findItem(gltf.textures, 'TextureWithWebPExtension');
    });

    describe('TextureEXTTextureWebP', () => {
        it('resolves on Texture extensions', () => {
            const extension = texture.extensions?.EXT_texture_webp;

            expect(extension).to.be.instanceOf(TextureEXTTextureWebP);
        });

        it('resolves referenceFields', () => {
            const extension = texture.extensions?.EXT_texture_webp;

            expect(extension?.source).to.be.instanceOf(Image);
            expect(extension?.source?.name).to.equal('BaseColorWebP');
        });

        describe('texture.getSource', () => {
            it('returns the extension image source', () => {
                expect(texture.getSource()).to.equal(texture.extensions?.EXT_texture_webp?.source);
            });
        });
    });
});
