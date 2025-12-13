import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF                         } from '../../gltf.js';
import { TextureInfo                  } from '../../texture-info.js';
import { MaterialKHRMaterialsSpecular } from '../../KHR/KHR_materials_specular.js';

const FIXTURE_URL = new URL('../__fixtures__/khr-materials.gltf', import.meta.url);

describe('KHR_materials_specular', () => {
    /** @type {GLTF} */
    let gltf;

    /**
     * @param {string} name
     */
    const getMaterial = (name) => gltf.materials.find(material => material.name === name);

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    describe('MaterialKHRMaterialsSpecular', () => {
        it('resolves on Material extensions', () => {
            const material = getMaterial('SpecularMaterial');
            const extension = material?.extensions?.KHR_materials_specular;

            expect(extension).to.be.instanceOf(MaterialKHRMaterialsSpecular);
        });

        it('resolves referenceFields', () => {
            const material = getMaterial('SpecularMaterial');
            const extension = material?.extensions?.KHR_materials_specular;

            expect(extension?.specularTexture).to.be.instanceOf(TextureInfo);
            expect(extension?.specularColorTexture).to.be.instanceOf(TextureInfo);
            expect(extension?.specularColorTexture?.texture.sRGB).to.be.true;
        });

        it('sets default values', () => {
            const extension = new MaterialKHRMaterialsSpecular({});

            expect(extension.specularFactor).to.equal(1);
            expect(extension.specularColorFactor).to.deep.equal([1, 1, 1]);
        });
    });
});
