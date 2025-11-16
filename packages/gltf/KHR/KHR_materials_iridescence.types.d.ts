// deno-lint-ignore-file no-empty-interface

/**
 * Augments the glTF extension interfaces to include KHR_materials_iridescence types.
 * @module @revelryengine/gltf/extensions
 */

declare module '@revelryengine/gltf/extensions' {
    interface materialExtensions {
        /** A json object representing the KHR_materials_iridescence extension */
        'KHR_materials_iridescence'?: import('./KHR_materials_iridescence.js').materialKHRMaterialsIridescence,
    }
    interface MaterialExtensions {
        /** A MaterialKHRMaterialsIridescence instance */
        'KHR_materials_iridescence'?: import('./KHR_materials_iridescence.js').MaterialKHRMaterialsIridescence,
    }

    interface ExtendableProperties {
        /** MaterialKHRMaterialsIridescence property */
        MaterialKHRMaterialsIridescence: true,
    }

    /** Interface for adding materialKHRMaterialsIridescence extension json properties. */
    interface materialKHRMaterialsIridescenceExtensions {}
    /** Interface for adding MaterialKHRMaterialsIridescence extension instance properties. */
    interface MaterialKHRMaterialsIridescenceExtensions {}
}

