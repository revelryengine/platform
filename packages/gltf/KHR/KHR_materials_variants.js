/// <reference path="./KHR_materials_variants.types.d.ts" />

/**
 * For a glTF asset, a material variant represents a combination of materials that can be applied in unison to a set of primitives based on mappings.
 *
 * [Reference Spec - KHR_materials_variants#variants](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_variants#variants)
 *
 * @module
 */

import { GLTFProperty, NamedGLTFProperty } from '../gltf-property.js';
import { Material                        } from '../material.js';

/**
 * @import { GLTFPropertyData, NamedGLTFPropertyData, ReferenceField } from '../gltf-property.types.d.ts';
 * @import {
 *  khrMaterialsVariantsExtensions, KHRMaterialsVariantsExtensions,
 *  khrMaterialsVariantsVariantExtensions, KHRMaterialsVariantsVariantExtensions,
 *  meshPrimitiveKHRMaterialsVariantsExtensions, MeshPrimitiveKHRMaterialsVariantsExtensions,
 *  meshPrimitiveKHRMaterialsVariantsMappingExtensions, MeshPrimitiveKHRMaterialsVariantsMappingExtensions,
 * } from '@revelryengine/gltf/extensions';
 */

/**
 * @typedef {object} khrMaterialsVariantsVariant - KHR_materials_variants variant JSON representation.
 * @property {string} name - The name of the material variant.
 * @property {khrMaterialsVariantsVariantExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_materials_variants variant class representation.
 */
export class KHRMaterialsVariantsVariant extends GLTFProperty {
    /**
     * Creates a new instance of KHRMaterialsVariantsVariant.
     * @param {{
     *  name:        string,
     *  extensions?: KHRMaterialsVariantsVariantExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_materials_variants variant object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { name, extensions } = unmarshalled;

        /**
         * The name of the material variant.
         */
        this.name = name;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }
}

/**
 * @typedef {object} khrMaterialsVariants - KHR_materials_variants JSON representation.
 * @property {khrMaterialsVariantsVariant[]} variants - An array of objects defining a valid material variant.
 * @property {khrMaterialsVariantsExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_materials_variants class representation for glTF root.
 */
export class KHRMaterialsVariants extends GLTFProperty {
    /**
     * Creates a new instance of KHRMaterialsVariants.
     * @param {{
     *  variants:    KHRMaterialsVariantsVariant[],
     *  extensions?: KHRMaterialsVariantsExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_materials_variants object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { variants, extensions } = unmarshalled;

        /**
         * An array of objects defining a valid material variant.
         */
        this.variants = variants;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Reference fields for this class.
     * @type {Record<string, ReferenceField>}
     * @override
     */
    static referenceFields = {
        variants: { factory: () => KHRMaterialsVariantsVariant },
    };
}

/**
 * @typedef {object} meshPrimitiveKHRMaterialsVariantsMapping - KHR_materials_variants mesh primitive mapping JSON representation.
 * @property {number[]} variants - An array of variant indices.
 * @property {number} material - The index of the material to apply.
 * @property {meshPrimitiveKHRMaterialsVariantsMappingExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_materials_variants mesh primitive mapping class representation.
 */
export class MeshPrimitiveKHRMaterialsVariantsMapping extends NamedGLTFProperty {
    /**
     * Creates a new instance of MeshPrimitiveKHRMaterialsVariantsMapping.
     * @param {{
     *  variants:    KHRMaterialsVariantsVariant[],
     *  material:    Material,
     *  extensions?: MeshPrimitiveKHRMaterialsVariantsMappingExtensions,
     * } & NamedGLTFPropertyData} unmarshalled - Unmarshalled KHR_materials_variants mesh primitive mapping object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { variants, material, extensions } = unmarshalled;

        /**
         * An array of variants.
         */
        this.variants = variants;

        /**
         * The Material associated with the given array of variants.
         */
        this.material = material;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Reference fields for this class.
     * @type {Record<string, ReferenceField>}
     * @override
     */
    static referenceFields = {
        variants: { factory: () => KHRMaterialsVariantsVariant, collection: ['extensions', 'KHR_materials_variants', 'variants'] },
        material: { factory: () => Material,                    collection: 'materials'                                          },
    };
}

/**
 * @typedef {object} meshPrimitiveKHRMaterialsVariants - KHR_materials_variants mesh primitive JSON representation.
 * @property {number[]} variants - An array of variant indices.
 * @property {number} material - The index of the material to apply.
 * @property {meshPrimitiveKHRMaterialsVariantsExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_materials_variants class representation for mesh primitives.
 */
export class MeshPrimitiveKHRMaterialsVariants extends GLTFProperty {
    /**
     * Creates a new instance of MeshPrimitiveKHRMaterialsVariants.
     * @param {{
     *  mappings:    MeshPrimitiveKHRMaterialsVariantsMapping[],
     *  extensions?: MeshPrimitiveKHRMaterialsVariantsExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_materials_variants mesh primitive object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { mappings, extensions } = unmarshalled;

        /**
         * A list of material to variant mappings
         */
        this.mappings = mappings;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Reference fields for this class.
     * @type {Record<string, ReferenceField>}
     * @override
     */
    static referenceFields = {
        mappings: { factory: () => MeshPrimitiveKHRMaterialsVariantsMapping },
    };
}

GLTFProperty.extensions.add('KHR_materials_variants', {
    schema: {
        GLTF:          KHRMaterialsVariants,
        MeshPrimitive: MeshPrimitiveKHRMaterialsVariants,
    },
});
