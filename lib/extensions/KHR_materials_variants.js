import { GLTFProperty, NamedGLTFProperty } from '../gltf-property.js';
import { Material                        } from '../material.js';
import { extensions                      } from '../extensions.js';

/**
 * @typedef {{
 *  name:        string,
 *  extensions?: Revelry.GLTF.Extensions.khrMaterialsVariantsVariant,
 * } & import('../gltf-property.js').glTFPropertyData} khrMaterialsVariantsVariant
 */

/**
 * For a glTF asset, a material variant represents a combination of materials that can be applied in unison to a set of primitives based on mappings.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_variants#variants
 */
export class KHRMaterialsVariantsVariant extends GLTFProperty {
    /**
     * @param {{
     *  name:        string,
     *  extensions?: Revelry.GLTF.Extensions.KHRMaterialsVariantsVariant,
     * } & import('../gltf-property.js').GLTFPropertyData} khrMaterialsVariantsVariant
     */
    constructor(khrMaterialsVariantsVariant) {
        super(khrMaterialsVariantsVariant);

        const { name, extensions } = khrMaterialsVariantsVariant;

        /**
         * The name of the material variant.
         */
        this.name = name;

        this.extensions = extensions;
    }

    /**
     * @param {khrMaterialsVariantsVariant} khrMaterialsVariantsVariant
     * @param {import('../gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(khrMaterialsVariantsVariant, options) {
        return new this(this.unmarshall(khrMaterialsVariantsVariant, options, {
        }, 'KHRMaterialsVariantsVariant'));
    }
}

/**
 * @typedef {{
 *  variants:    khrMaterialsVariantsVariant[],
 *  extensions?: Revelry.GLTF.Extensions.khrMaterialsVariantsGLTF,
 * } & import('../gltf-property.js').glTFPropertyData} khrMaterialsVariantsGLTF
 */

/**
 * This extension allows for a compact glTF representation of multiple material variants of an asset, structured to allow low-latency switching at runtime.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_variants
 */
export class KHRMaterialsVariantsGLTF extends GLTFProperty {
    /**
     * @param {{
     *  variants:    KHRMaterialsVariantsVariant[],
     *  extensions?: Revelry.GLTF.Extensions.KHRMaterialsVariantsGLTF,
     * } & import('../gltf-property.js').GLTFPropertyData} khrMaterialsVariantsGLTF
     */
    constructor(khrMaterialsVariantsGLTF) {
        super(khrMaterialsVariantsGLTF);

        const { variants, extensions } = khrMaterialsVariantsGLTF;

        /**
         * An array of objects defining a valid material variant.
         */
        this.variants = variants;

        this.extensions = extensions;
    }

    /**
     * @param {khrMaterialsVariantsGLTF} khrMaterialsVariantsGLTF
     * @param {import('../gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(khrMaterialsVariantsGLTF, options) {
        return new this(this.unmarshall(khrMaterialsVariantsGLTF, options, {
            variants: { factory: KHRMaterialsVariantsVariant }
        }, 'KHRMaterialsVariantsGLTF'));
    }
}

/**
 * @typedef {{
 *  variants:    number[],
 *  material:    number,
 *  extensions?: Revelry.GLTF.Extensions.khrMaterialsVariantsMeshPrimitiveMapping,
 * } & import('../gltf-property.js').namedGLTFPropertyData} khrMaterialsVariantsMeshPrimitiveMapping
 */

/**
 * For a given primitive, each mapping item represents a material that should be applied to the primitive when one of its variants is active.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_variants#mappings
 */
export class KHRMaterialsVariantsMeshPrimitiveMapping extends NamedGLTFProperty {
    /**
     * @param {{
     *  variants:    KHRMaterialsVariantsVariant[],
     *  material:    Material,
     *  extensions?: Revelry.GLTF.Extensions.KHRMaterialsVariantsMeshPrimitiveMapping,
     * } & import('../gltf-property.js').NamedGLTFPropertyData} khrMaterialsVariantsPrimitiveMapping
     */
    constructor(khrMaterialsVariantsPrimitiveMapping) {
        super(khrMaterialsVariantsPrimitiveMapping);

        const { variants, material, extensions } = khrMaterialsVariantsPrimitiveMapping;

        /**
         * An array of variants.
         */
        this.variants = variants;

        /**
         * The Material associated with the given array of variants.
         */
        this.material = material;

        this.extensions = extensions;
    }

    /**
     * @param {khrMaterialsVariantsMeshPrimitiveMapping} khrMaterialsVariantsPrimitiveMapping
     * @param {import('../gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(khrMaterialsVariantsPrimitiveMapping, options) {
        return new this(this.unmarshall(khrMaterialsVariantsPrimitiveMapping, options, {
            variants: { factory: KHRMaterialsVariantsVariant, collection: ['extensions', 'KHR_materials_variants', 'variants'] },
            material: { factory: Material,                    collection: 'materials'                                          },
        }, 'KHRMaterialsVariantsMeshPrimitiveMapping'));
    }
}

/**
 * @typedef {{
 *  mappings:    khrMaterialsVariantsMeshPrimitiveMapping[],
 *  extensions?: Revelry.GLTF.Extensions.khrMaterialsVariantsMeshPrimitive,
 * } & import('../gltf-property.js').glTFPropertyData} khrMaterialsVariantsMeshPrimitive
 */

/**
 * For a given primitive, each mapping item represents a material that should be applied to the primitive when one of its variants is active.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_variants#mappings
 */
export class KHRMaterialsVariantsMeshPrimitive extends GLTFProperty {
    /**
     * @param {{
     *  mappings:    KHRMaterialsVariantsMeshPrimitiveMapping[],
     *  extensions?: Revelry.GLTF.Extensions.KHRMaterialsVariantsMeshPrimitive,
     * } & import('../gltf-property.js').GLTFPropertyData} khrMaterialsVariantsPrimitive
     */
    constructor(khrMaterialsVariantsPrimitive) {
        super(khrMaterialsVariantsPrimitive);

        const { mappings, extensions } = khrMaterialsVariantsPrimitive;

        /**
         * A list of material to variant mappings
         */
        this.mappings = mappings;

        this.extensions = extensions;
    }

    /**
     * @param {khrMaterialsVariantsMeshPrimitive} khrMaterialsVariantsPrimitive
     * @param {import('../gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(khrMaterialsVariantsPrimitive, options) {
        return new this(this.unmarshall(khrMaterialsVariantsPrimitive, options, {
            mappings: { factory: KHRMaterialsVariantsMeshPrimitiveMapping },
        }, 'KHRMaterialsVariantsMeshPrimitive'));
    }
}

extensions.add('KHR_materials_variants', {
    schema: {
        GLTF:      KHRMaterialsVariantsGLTF,
        MeshPrimitive: KHRMaterialsVariantsMeshPrimitive,
    },
});
