// deno-lint-ignore-file no-empty-interface

/**
 * Augments the glTF extension interfaces to include KHR_materials_variants types.
 * @module virtual-rev-gltf-extensions
 */

declare module 'virtual-rev-gltf-extensions' {
    interface glTFExtensions {
        /** A json object representing the KHR_materials_variants extension */
        'KHR_materials_variants'?: import('./KHR_materials_variants.js').glTFKHRMaterialsVariants,
    }
    interface GLTFExtensions {
        /** A GLTFKHRMaterialsVariants instance */
        'KHR_materials_variants'?: import('./KHR_materials_variants.js').GLTFKHRMaterialsVariants,
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
        /** GLTFKHRMaterialsVariants property */
        GLTFKHRMaterialsVariants: true,
        /** GLTFKHRMaterialsVariantsVariant property */
        GLTFKHRMaterialsVariantsVariant: true,

        /** MeshPrimitiveKHRMaterialsVariants property */
        MeshPrimitiveKHRMaterialsVariants: true,
        /** MeshPrimitiveKHRMaterialsVariantsMapping property */
        MeshPrimitiveKHRMaterialsVariantsMapping: true,
    }

    /** Interface for adding glTFKHRMaterialsVariants extension json properties. */
    interface glTFKHRMaterialsVariantsExtensions {}
    /** Interface for adding GLTFKHRMaterialsVariants extension instance properties. */
    interface GLTFKHRMaterialsVariantsExtensions {}
    /** Interface for adding glTFKHRMaterialsVariantsVariant extension json properties. */
    interface glTFKHRMaterialsVariantsVariantExtensions {}
    /** Interface for adding GLTFKHRMaterialsVariantsVariant extension instance properties. */
    interface GLTFKHRMaterialsVariantsVariantExtensions {}

    /** Interface for adding meshPrimitiveKHRMaterialsVariants extension json properties. */
    interface meshPrimitiveKHRMaterialsVariantsExtensions {}
    /** Interface for adding MeshPrimitiveKHRMaterialsVariants extension instance properties. */
    interface MeshPrimitiveKHRMaterialsVariantsExtensions {}
    /** Interface for adding meshPrimitiveKHRMaterialsVariantsMapping extension json properties. */
    interface meshPrimitiveKHRMaterialsVariantsMappingExtensions {}
    /** Interface for adding MeshPrimitiveKHRMaterialsVariantsMapping extension instance properties. */
    interface MeshPrimitiveKHRMaterialsVariantsMappingExtensions {}
}

