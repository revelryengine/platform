import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF                            } from '../../gltf.js';
import { TextureInfo                     } from '../../texture-info.js';
import { MaterialKHRMaterialsIridescence } from '../../KHR/KHR_materials_iridescence.js';

const FIXTURE_URL = new URL('../__fixtures__/khr-materials.gltf', import.meta.url);

describe('KHR_materials_iridescence', () => {
    /** @type {GLTF} */
    let gltf;

    /**
     * @param {string} name
     */
    const getMaterial = (name) => gltf.materials.find(material => material.name === name);

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    describe('MaterialKHRMaterialsIridescence', () => {
        it('resolves on Material extensions', () => {
            const material = getMaterial('IridescenceMaterial');
            const extension = material?.extensions?.KHR_materials_iridescence;

            expect(extension).to.be.instanceOf(MaterialKHRMaterialsIridescence);
        });

        it('resolves referenceFields', () => {
            const material = getMaterial('IridescenceMaterial');
            const extension = material?.extensions?.KHR_materials_iridescence;

            expect(extension?.iridescenceTexture).to.be.instanceOf(TextureInfo);
            expect(extension?.iridescenceThicknessTexture).to.be.instanceOf(TextureInfo);
        });

        it('sets default values', () => {
            const extension = new MaterialKHRMaterialsIridescence({});

            expect(extension.iridescenceFactor).to.equal(1);
            expect(extension.iridescenceIor).to.equal(1.3);
            expect(extension.iridescenceThicknessMinimum).to.equal(0);
            expect(extension.iridescenceThicknessMaximum).to.equal(400);
        });
    });
});
