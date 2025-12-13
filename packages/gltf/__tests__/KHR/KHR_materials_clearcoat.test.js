import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF                          } from '../../gltf.js';
import { TextureInfo                   } from '../../texture-info.js';
import { MaterialNormalTextureInfo     } from '../../material-normal-texture-info.js';
import { MaterialKHRMaterialsClearcoat } from '../../KHR/KHR_materials_clearcoat.js';

const FIXTURE_URL = new URL('../__fixtures__/khr-materials.gltf', import.meta.url);

describe('KHR_materials_clearcoat', () => {
    /** @type {GLTF} */
    let gltf;

    /**
     * @param {string} name
     */
    const getMaterial = (name) => gltf.materials.find(material => material.name === name);

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    describe('MaterialKHRMaterialsClearcoat', () => {
        it('resolves on Material extensions', () => {
            const material = getMaterial('ClearcoatMaterial');
            const extension = material?.extensions?.KHR_materials_clearcoat;

            expect(extension).to.be.instanceOf(MaterialKHRMaterialsClearcoat);
        });

        it('resolves referenceFields', () => {
            const material = getMaterial('ClearcoatMaterial');
            const extension = material?.extensions?.KHR_materials_clearcoat;

            expect(extension?.clearcoatTexture).to.be.instanceOf(TextureInfo);
            expect(extension?.clearcoatRoughnessTexture).to.be.instanceOf(TextureInfo);
            expect(extension?.clearcoatNormalTexture).to.be.instanceOf(MaterialNormalTextureInfo);
        });

        it('sets default values', () => {
            const extension = new MaterialKHRMaterialsClearcoat({});

            expect(extension.clearcoatFactor).to.equal(0);
            expect(extension.clearcoatRoughnessFactor).to.equal(0);
        });
    });
});
