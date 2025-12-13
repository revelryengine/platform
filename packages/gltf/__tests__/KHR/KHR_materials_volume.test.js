import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF                       } from '../../gltf.js';
import { TextureInfo                } from '../../texture-info.js';
import { MaterialKHRMaterialsVolume } from '../../KHR/KHR_materials_volume.js';

const FIXTURE_URL = new URL('../__fixtures__/khr-materials.gltf', import.meta.url);

describe('KHR_materials_volume', () => {
    /** @type {GLTF} */
    let gltf;

    /**
     * @param {string} name
     */
    const getMaterial = (name) => gltf.materials.find(material => material.name === name);

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    describe('MaterialKHRMaterialsVolume', () => {
        it('resolves on Material extensions', () => {
            const material = getMaterial('VolumeMaterial');
            const extension = material?.extensions?.KHR_materials_volume;

            expect(extension).to.be.instanceOf(MaterialKHRMaterialsVolume);
        });

        it('resolves referenceFields', () => {
            const material = getMaterial('VolumeMaterial');
            const extension = material?.extensions?.KHR_materials_volume;

            expect(extension?.thicknessTexture).to.be.instanceOf(TextureInfo);
        });

        it('sets default values', () => {
            const extension = new MaterialKHRMaterialsVolume({});

            expect(extension.thicknessFactor).to.equal(0);
            expect(extension.attenuationDistance).to.equal(0);
            expect(extension.attenuationColor).to.deep.equal([1, 1, 1]);
        });
    });
});
