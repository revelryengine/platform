// deno-lint-ignore-file no-empty-interface

/**
 * Augments the glTF extension interfaces to include KHR_materials_variants types.
 * @module @revelryengine/gltf/extensions
 */

declare module '@revelryengine/gltf/extensions' {
    interface glTFExtensions {
        /** A json object representing the KHR_materials_variants extension */
        'KHR_materials_variants'?: import('./KHR_materials_variants.js').khrMaterialsVariants,
    }
    interface GLTFExtensions {
        /** A KHRMaterialsVariants instance */
        'KHR_materials_variants'?: import('./KHR_materials_variants.js').KHRMaterialsVariants,
    }

    interface meshPrimitiveExtensions {
        /** A json object representing the KHR_materials_variants extension */
        'KHR_materials_variants'?: import('./KHR_materials_variants.js').meshPrimitiveKHRMaterialsVariants,
    }
    interface MeshPrimitiveExtensions {
        /** A MeshPrimitiveKHRMaterialsVariants instance */
        'KHR_materials_variants'?: import('./KHR_materials_variants.js').MeshPrimitiveKHRMaterialsVariants,
    }

    interface ExtendableProperties {
        /** KHRMaterialsVariants property */
        KHRMaterialsVariants: true,
        /** KHRMaterialsVariantsVariant property */
        KHRMaterialsVariantsVariant: true,

        /** MeshPrimitiveKHRMaterialsVariants property */
        MeshPrimitiveKHRMaterialsVariants: true,
        /** MeshPrimitiveKHRMaterialsVariantsMapping property */
        MeshPrimitiveKHRMaterialsVariantsMapping: true,
    }

    /** Interface for adding khrMaterialsVariants extension json properties. */
    interface khrMaterialsVariantsExtensions {}
    /** Interface for adding KHRMaterialsVariants extension instance properties. */
    interface KHRMaterialsVariantsExtensions {}
    /** Interface for adding khrMaterialsVariantsVariant extension json properties. */
    interface khrMaterialsVariantsVariantExtensions {}
    /** Interface for adding KHRMaterialsVariantsVariant extension instance properties. */
    interface KHRMaterialsVariantsVariantExtensions {}

    /** Interface for adding meshPrimitiveKHRMaterialsVariants extension json properties. */
    interface meshPrimitiveKHRMaterialsVariantsExtensions {}
    /** Interface for adding MeshPrimitiveKHRMaterialsVariants extension instance properties. */
    interface MeshPrimitiveKHRMaterialsVariantsExtensions {}
    /** Interface for adding meshPrimitiveKHRMaterialsVariantsMapping extension json properties. */
    interface meshPrimitiveKHRMaterialsVariantsMappingExtensions {}
    /** Interface for adding MeshPrimitiveKHRMaterialsVariantsMapping extension instance properties. */
    interface MeshPrimitiveKHRMaterialsVariantsMappingExtensions {}
}

