import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF                      } from '../../gltf.js';
import { TextureInfo               } from '../../texture-info.js';
import { MaterialKHRMaterialsSheen } from '../../KHR/KHR_materials_sheen.js';

const FIXTURE_URL = new URL('../__fixtures__/khr-materials.gltf', import.meta.url);

describe('KHR_materials_sheen', () => {
    /** @type {GLTF} */
    let gltf;

    /**
     * @param {string} name
     */
    const getMaterial = (name) => gltf.materials.find(material => material.name === name);

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    describe('MaterialKHRMaterialsSheen', () => {
        it('resolves on Material extensions', () => {
            const material = getMaterial('SheenMaterial');
            const extension = material?.extensions?.KHR_materials_sheen;
            expect(extension).to.be.instanceOf(MaterialKHRMaterialsSheen);
        });

        it('resolves referenceFields', () => {
            const material = getMaterial('SheenMaterial');
            const extension = material?.extensions?.KHR_materials_sheen;

            expect(extension?.sheenColorTexture).to.be.instanceOf(TextureInfo);
            expect(extension?.sheenColorTexture?.texture.sRGB).to.be.true;
            expect(extension?.sheenRoughnessTexture).to.be.instanceOf(TextureInfo);
        });

        it('sets default values', () => {
            const extension = new MaterialKHRMaterialsSheen({});

            expect(extension.sheenColorFactor).to.deep.equal([0, 0, 0]);
            expect(extension.sheenRoughnessFactor).to.equal(0);
        });
    });
});
