// deno-lint-ignore-file no-empty-interface

/**
 * Augments the glTF extension interfaces to include KHR_materials_volume types.
 * @module @revelryengine/gltf/extensions
 */

declare module '@revelryengine/gltf/extensions' {
    interface materialExtensions {
        /** A json object representing the KHR_materials_volume extension */
        'KHR_materials_volume'?: import('./KHR_materials_volume.js').materialKHRMaterialsVolume,
    }
    interface MaterialExtensions {
        /** A MaterialKHRMaterialsVolume instance */
        'KHR_materials_volume'?: import('./KHR_materials_volume.js').MaterialKHRMaterialsVolume,
    }

    interface ExtendableProperties {
        /** MaterialKHRMaterialsVolume property */
        MaterialKHRMaterialsVolume: true,
    }

    /** Interface for adding materialKHRMaterialsVolume extension json properties. */
    interface materialKHRMaterialsVolumeExtensions {}
    /** Interface for adding MaterialKHRMaterialsVolume extension instance properties. */
    interface MaterialKHRMaterialsVolumeExtensions {}
}

