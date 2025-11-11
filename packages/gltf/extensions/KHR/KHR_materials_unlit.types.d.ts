// deno-lint-ignore-file no-empty-interface

/**
 * Augments the glTF extension interfaces to include KHR_materials_unlit types.
 * @module @revelryengine/gltf/extensions
 */

declare module '@revelryengine/gltf/extensions' {
    interface materialExtensions {
        /** A json object representing the KHR_materials_unlit extension */
        'KHR_materials_unlit'?: import('./KHR_materials_unlit.js').materialKHRMaterialsUnlit,
    }
    interface MaterialExtensions {
        /** A MaterialKHRMaterialsUnlit instance */
        'KHR_materials_unlit'?: import('./KHR_materials_unlit.js').MaterialKHRMaterialsUnlit,
    }

    interface ExtendableProperties {
        /** MaterialKHRMaterialsUnlit property */
        MaterialKHRMaterialsUnlit: true,
    }

    /** Interface for adding materialKHRMaterialsUnlit extension json properties. */
    interface materialKHRMaterialsUnlitExtensions {}
    /** Interface for adding MaterialKHRMaterialsUnlit extension instance properties. */
    interface MaterialKHRMaterialsUnlitExtensions {}
}

