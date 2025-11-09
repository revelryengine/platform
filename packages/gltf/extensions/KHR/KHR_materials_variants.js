/// <reference path="./KHR_materials_variants.types.d.ts" />

/**
 * For a glTF asset, a material variant represents a combination of materials that can be applied in unison to a set of primitives based on mappings.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_variants#variants
 *
 * @module
 */

import { GLTFProperty, NamedGLTFProperty } from '../../gltf-property.js';
import { Material                        } from '../../material.js';
import { registry                        } from '../registry.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, namedGLTFPropertyData, NamedGLTFPropertyData, FromJSONGraph } from '../../gltf-property.js';
 * @import {
 *  glTFKHRMaterialsVariantsExtensions, GLTFKHRMaterialsVariantsExtensions,
 *  glTFKHRMaterialsVariantsVariantExtensions, GLTFKHRMaterialsVariantsVariantExtensions,
 *  meshPrimitiveKHRMaterialsVariantsExtensions, MeshPrimitiveKHRMaterialsVariantsExtensions,
 *  meshPrimitiveKHRMaterialsVariantsMappingExtensions, MeshPrimitiveKHRMaterialsVariantsMappingExtensions,
 * } from 'virtual-rev-gltf-extensions';
 */

/**
 * @typedef {object} khrMaterialsVariantsVariant - KHR_materials_variants variant JSON representation.
 * @property {string} name - The name of the material variant.
 * @property {glTFKHRMaterialsVariantsVariantExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_materials_variants variant class representation.
 */
export class GLTFKHRMaterialsVariantsVariant extends GLTFProperty {
    /**
     * Creates a new instance of KHRMaterialsVariantsVariant.
     * @param {{
     *  name:        string,
     *  extensions?: GLTFKHRMaterialsVariantsVariantExtensions,
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

    /**
     * Creates a KHRMaterialsVariantsVariant instance from its JSON representation.
     * @param {khrMaterialsVariantsVariant & glTFPropertyData} glTFKHRMaterialsVariantsVariant - The KHR_materials_variants variant JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(glTFKHRMaterialsVariantsVariant, graph) {
        return this.unmarshall(graph, glTFKHRMaterialsVariantsVariant, {
            // No reference fields
        }, this);
    }
}

/**
 * @typedef {object} glTFKHRMaterialsVariants - KHR_materials_variants JSON representation.
 * @property {khrMaterialsVariantsVariant[]} variants - An array of objects defining a valid material variant.
 * @property {glTFKHRMaterialsVariantsExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_materials_variants class representation for glTF root.
 */
export class GLTFKHRMaterialsVariants extends GLTFProperty {
    /**
     * Creates a new instance of GLTFKHRMaterialsVariants.
     * @param {{
     *  variants:    GLTFKHRMaterialsVariantsVariant[],
     *  extensions?: GLTFKHRMaterialsVariantsExtensions,
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
     * Creates a GLTFKHRMaterialsVariants instance from its JSON representation.
     * @param {glTFKHRMaterialsVariants & glTFPropertyData} glTFKHRMaterialsVariants - The KHR_materials_variants JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(glTFKHRMaterialsVariants, graph) {
        return this.unmarshall(graph, glTFKHRMaterialsVariants, {
            variants: { factory: GLTFKHRMaterialsVariantsVariant }
        }, this);
    }
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
     *  variants:    GLTFKHRMaterialsVariantsVariant[],
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
     * Creates a MeshPrimitiveKHRMaterialsVariantsMapping instance from its JSON representation.
     * @param {meshPrimitiveKHRMaterialsVariantsMapping & namedGLTFPropertyData} meshPrimitiveKHRMaterialsVariantsMapping - The KHR_materials_variants mesh primitive mapping JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(meshPrimitiveKHRMaterialsVariantsMapping, graph) {
        return this.unmarshall(graph, meshPrimitiveKHRMaterialsVariantsMapping, {
            variants: { factory: GLTFKHRMaterialsVariantsVariant, collection: ['extensions', 'KHR_materials_variants', 'variants'] },
            material: { factory: Material,                        collection: 'materials'                                          },
        }, this);
    }
}

/**
 * @typedef {object} meshPrimitiveKHRMaterialsVariants - KHR_materials_variants mesh primitive JSON representation.
 * @property {number[]} variants - An array of variant indices.
 * @property {number} material - The index of the material to apply.
 * @property {meshPrimitiveKHRMaterialsVariantsExtensions} [extensions] - Extension-specific data.
 */

/**
 * For a given primitive, each mapping item represents a material that should be applied to the primitive when one of its variants is active.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_variants#mappings
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
     * Creates an instance from JSON data.
     * @param {meshPrimitiveKHRMaterialsVariants} meshPrimitiveKHRMaterialsVariants - The KHR_materials_variants mesh primitive JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(meshPrimitiveKHRMaterialsVariants, graph) {
        return this.unmarshall(graph, meshPrimitiveKHRMaterialsVariants, {
            mappings: { factory: MeshPrimitiveKHRMaterialsVariantsMapping },
        }, this);
    }
}

registry.add('KHR_materials_variants', {
    schema: {
        GLTF:          GLTFKHRMaterialsVariants,
        MeshPrimitive: MeshPrimitiveKHRMaterialsVariants,
    },
});
