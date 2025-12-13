import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF                                      } from '../../../gltf.js';
import { TextureInfo                               } from '../../../texture-info.js';
import { MaterialKHRMaterialsPBRSpecularGlossiness } from '../../../KHR/archived/KHR_materials_pbrSpecularGlossiness.js';

const FIXTURE_URL = new URL('../../__fixtures__/khr-materials.gltf', import.meta.url);

describe('KHR_materials_pbrSpecularGlossiness', () => {
    /** @type {GLTF} */
    let gltf;

    /**
     * @param {string} name
     */
    const getMaterial = (name) => gltf.materials.find(material => material.name === name);

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    describe('MaterialKHRMaterialsPBRSpecularGlossiness', () => {
        it('resolves on Material extensions', () => {
            const material = getMaterial('SpecGlossMaterial');
            const extension = material?.extensions?.KHR_materials_pbrSpecularGlossiness;

            expect(extension).to.be.instanceOf(MaterialKHRMaterialsPBRSpecularGlossiness);
        });

        it('resolves referenceFields', () => {
            const material = getMaterial('SpecGlossMaterial');
            const extension = material?.extensions?.KHR_materials_pbrSpecularGlossiness;

            expect(extension?.diffuseTexture).to.be.instanceOf(TextureInfo);
            expect(extension?.specularGlossinessTexture).to.be.instanceOf(TextureInfo);
            expect(extension?.diffuseTexture?.texture.sRGB).to.be.true;
            expect(extension?.specularGlossinessTexture?.texture.sRGB).to.be.true;
        });

        it('sets default values', () => {
            const extension = new MaterialKHRMaterialsPBRSpecularGlossiness({});

            expect(extension.diffuseFactor).to.deep.equal([1, 1, 1, 1]);
            expect(extension.specularFactor).to.deep.equal([1, 1, 1]);
            expect(extension.glossinessFactor).to.equal(1);
        });
    });
});
