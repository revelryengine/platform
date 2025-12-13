import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF                                 } from '../../gltf.js';
import { MaterialKHRMaterialsEmissiveStrength } from '../../KHR/KHR_materials_emissive_strength.js';

const FIXTURE_URL = new URL('../__fixtures__/khr-materials.gltf', import.meta.url);

describe('KHR_materials_emissive_strength', () => {
    /** @type {GLTF} */
    let gltf;

    /**
     * @param {string} name
     */
    const getMaterial = (name) => gltf.materials.find(material => material.name === name);

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    describe('MaterialKHRMaterialsEmissiveStrength', () => {
        it('resolves on Material extensions', () => {
            const material = getMaterial('EmissiveStrengthMaterial');
            const extension = material?.extensions?.KHR_materials_emissive_strength;

            expect(extension).to.be.instanceOf(MaterialKHRMaterialsEmissiveStrength);
        });

        it('sets default values', () => {
            const extension = new MaterialKHRMaterialsEmissiveStrength({});

            expect(extension.emissiveStrength).to.equal(1);
        });
    });
});
