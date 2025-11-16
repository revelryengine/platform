// deno-lint-ignore-file no-empty-interface

/**
 * Augments the glTF extension interfaces to include KHR_materials_pbrSpecularGlossiness types.
 * @module @revelryengine/gltf/extensions
 */

declare module '@revelryengine/gltf/extensions' {
    interface materialExtensions {
        /** A json object representing the KHR_materials_pbrSpecularGlossiness extension */
        'KHR_materials_pbrSpecularGlossiness'?: import('./KHR_materials_pbrSpecularGlossiness.js').materialKHRMaterialsPBRSpecularGlossiness
    }
    interface MaterialExtensions {
        /** A MaterialKHRMaterialsPBRSpecularGlossiness instance */
        'KHR_materials_pbrSpecularGlossiness'?: import('./KHR_materials_pbrSpecularGlossiness.js').MaterialKHRMaterialsPBRSpecularGlossiness
    }

    interface ExtendableProperties {
        /** MaterialKHRMaterialsPBRSpecularGlossiness property */
        MaterialKHRMaterialsPBRSpecularGlossiness: true,
    }

    /** Interface for adding materialKHRMaterialsPBRSpecularGlossiness extension json properties. */
    interface materialKHRMaterialsPBRSpecularGlossinessExtensions {}
    /** Interface for adding MaterialKHRMaterialsPBRSpecularGlossiness extension instance properties. */
    interface MaterialKHRMaterialsPBRSpecularGlossinessExtensions {}
}

