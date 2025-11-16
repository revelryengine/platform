// deno-lint-ignore-file no-empty-interface

/**
 * Augments the glTF extension interfaces to include KHR_materials_sheen types.
 * @module @revelryengine/gltf/extensions
 */

declare module '@revelryengine/gltf/extensions' {
    interface materialExtensions {
        /** A json object representing the KHR_materials_sheen extension */
        'KHR_materials_sheen'?: import('./KHR_materials_sheen.js').materialKHRMaterialsSheen,
    }
    interface MaterialExtensions {
        /** A MaterialKHRMaterialsSheen instance */
        'KHR_materials_sheen'?: import('./KHR_materials_sheen.js').MaterialKHRMaterialsSheen,
    }

    interface ExtendableProperties {
        /** MaterialKHRMaterialsSheen property */
        MaterialKHRMaterialsSheen: true,
    }

    /** Interface for adding materialKHRMaterialsSheen extension json properties. */
    interface materialKHRMaterialsSheenExtensions {}
    /** Interface for adding MaterialKHRMaterialsSheen extension instance properties. */
    interface MaterialKHRMaterialsSheenExtensions {}
}

