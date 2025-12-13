import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF                             } from '../../gltf.js';
import { TextureInfo                      } from '../../texture-info.js';
import { MaterialKHRMaterialsTransmission } from '../../KHR/KHR_materials_transmission.js';

const FIXTURE_URL = new URL('../__fixtures__/khr-materials.gltf', import.meta.url);

describe('KHR_materials_transmission', () => {
    /** @type {GLTF} */
    let gltf;

    /**
     * @param {string} name
     */
    const getMaterial = (name) => gltf.materials.find(material => material.name === name);

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    describe('MaterialKHRMaterialsTransmission', () => {
        it('resolves on Material extensions', () => {
            const material = getMaterial('TransmissionMaterial');
            const extension = material?.extensions?.KHR_materials_transmission;

            expect(extension).to.be.instanceOf(MaterialKHRMaterialsTransmission);
        });

        it('resolves referenceFields', () => {
            const material = getMaterial('TransmissionMaterial');
            const extension = material?.extensions?.KHR_materials_transmission;

            expect(extension?.transmissionTexture).to.be.instanceOf(TextureInfo);
        });

        it('sets default values', () => {
            const extension = new MaterialKHRMaterialsTransmission({});

            expect(extension.transmissionFactor).to.equal(0);
        });
    });
});
