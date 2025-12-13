import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF                    } from '../../gltf.js';
import { MaterialKHRMaterialsIOR } from '../../KHR/KHR_materials_ior.js';

const FIXTURE_URL = new URL('../__fixtures__/khr-materials.gltf', import.meta.url);

describe('KHR_materials_ior', () => {
    /** @type {GLTF} */
    let gltf;

    /**
     * @param {string} name
     */
    const getMaterial = (name) => gltf.materials.find(material => material.name === name);

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    describe('MaterialKHRMaterialsIOR', () => {
        it('resolves on Material extensions', () => {
            const material = getMaterial('IORMaterial');
            const extension = material?.extensions?.KHR_materials_ior;

            expect(extension).to.be.instanceOf(MaterialKHRMaterialsIOR);
        });

        it('sets default values', () => {
            const extension = new MaterialKHRMaterialsIOR({});

            expect(extension.ior).to.equal(1.5);
        });
    });
});
