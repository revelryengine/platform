// deno-lint-ignore-file no-empty-interface

/**
 * Augments the glTF extension interfaces to include KHR_materials_clearcoat types.
 * @module @revelryengine/gltf/extensions
 */

declare module '@revelryengine/gltf/extensions' {
    interface materialExtensions {
        /** A json object representing the KHR_materials_clearcoat extension */
        'KHR_materials_clearcoat'?: import('./KHR_materials_clearcoat.js').materialKHRMaterialsClearcoat,
    }
    interface MaterialExtensions {
        /** A MaterialKHRMaterialsClearcoat instance */
        'KHR_materials_clearcoat'?: import('./KHR_materials_clearcoat.js').MaterialKHRMaterialsClearcoat,
    }

    interface ExtendableProperties {
        /** MaterialKHRMaterialsClearcoat property */
        MaterialKHRMaterialsClearcoat: true,
    }

    /** Interface for adding materialKHRMaterialsClearcoat extension json properties. */
    interface materialKHRMaterialsClearcoatExtensions {}
    /** Interface for adding MaterialKHRMaterialsClearcoat extension instance properties. */
    interface MaterialKHRMaterialsClearcoatExtensions {}
}

