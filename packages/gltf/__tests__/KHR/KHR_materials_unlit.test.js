import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF                      } from '../../gltf.js';
import { MaterialKHRMaterialsUnlit } from '../../KHR/KHR_materials_unlit.js';

const FIXTURE_URL = new URL('../__fixtures__/khr-materials.gltf', import.meta.url);

describe('KHR_materials_unlit', () => {
    /** @type {GLTF} */
    let gltf;

    /**
     * @param {string} name
     */
    const getMaterial = (name) => gltf.materials.find(material => material.name === name);

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    describe('MaterialKHRMaterialsUnlit', () => {
        it('resolves on Material extensions', () => {
            const material = getMaterial('UnlitMaterial');
            const extension = material?.extensions?.KHR_materials_unlit;

            expect(extension).to.be.instanceOf(MaterialKHRMaterialsUnlit);
        });
    });
});
