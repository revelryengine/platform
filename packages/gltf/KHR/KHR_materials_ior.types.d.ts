// deno-lint-ignore-file no-empty-interface

/**
 * Augments the glTF extension interfaces to include KHR_materials_ior types.
 * @module @revelryengine/gltf/extensions
 */

declare module '@revelryengine/gltf/extensions' {
    interface materialExtensions {
        /** A json object representing the KHR_materials_ior extension */
        'KHR_materials_ior'?: import('./KHR_materials_ior.js').materialKHRMaterialsIOR,
    }
    interface MaterialExtensions {
        /** A MaterialKHRMaterialsIOR instance */
        'KHR_materials_ior'?: import('./KHR_materials_ior.js').MaterialKHRMaterialsIOR,
    }

    interface ExtendableProperties {
        /** MaterialKHRMaterialsIOR property */
        MaterialKHRMaterialsIOR: true,
    }

    /** Interface for adding materialKHRMaterialsIOR extension json properties. */
    interface materialKHRMaterialsIORExtensions {}
    /** Interface for adding MaterialKHRMaterialsIOR extension instance properties. */
    interface MaterialKHRMaterialsIORExtensions {}
}

