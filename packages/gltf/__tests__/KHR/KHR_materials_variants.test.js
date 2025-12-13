import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF     } from '../../gltf.js';
import { Material } from '../../material.js';

import {
    KHRMaterialsVariants,
    KHRMaterialsVariantsVariant,
    MeshPrimitiveKHRMaterialsVariants,
    MeshPrimitiveKHRMaterialsVariantsMapping,
} from '../../KHR/KHR_materials_variants.js';

const FIXTURE_URL = new URL('../__fixtures__/khr-materials.gltf', import.meta.url);

describe('KHR_materials_variants', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    describe('KHRMaterialsVariants', () => {
        it('resolves on GLTF extensions', () => {
            const extension = gltf.extensions?.KHR_materials_variants;

            expect(extension).to.be.instanceOf(KHRMaterialsVariants);
        });

        it('resolves referenceFields', () => {
            const extension = gltf.extensions?.KHR_materials_variants;

            expect(extension?.variants[0]).to.be.instanceOf(KHRMaterialsVariantsVariant);
            expect(extension?.variants[0]?.name).to.equal('VariantRed');
        });
    });

    describe('MeshPrimitiveKHRMaterialsVariants', () => {
        it('resolves on MeshPrimitive extensions', () => {
            const primitive = gltf.meshes[0]?.primitives[0];
            const extension = primitive?.extensions?.KHR_materials_variants;

            expect(extension).to.be.instanceOf(MeshPrimitiveKHRMaterialsVariants);
        });

        it('resolves referenceFields', () => {
            const primitive = gltf.meshes[0]?.primitives[0];
            const extension = primitive?.extensions?.KHR_materials_variants;

            expect(extension?.mappings[0]).to.be.instanceOf(MeshPrimitiveKHRMaterialsVariantsMapping);
            expect(extension?.mappings[0]?.variants[0]).to.be.instanceOf(KHRMaterialsVariantsVariant);
            expect(extension?.mappings[0]?.material).to.be.instanceOf(Material);
        });
    });
});
