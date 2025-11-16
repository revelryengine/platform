// deno-lint-ignore-file no-empty-interface

/**
 * Augments the glTF extension interfaces to include KHR_materials_emissive_strength types.
 * @module @revelryengine/gltf/extensions
 */

declare module '@revelryengine/gltf/extensions' {
    interface materialExtensions {
        /** A json object representing the KHR_materials_emissive_strength extension */
        'KHR_materials_emissive_strength'?: import('./KHR_materials_emissive_strength.js').materialKHRMaterialsEmissiveStrength,
    }
    interface MaterialExtensions {
        /** A MaterialKHRMaterialsEmissiveStrength instance */
        'KHR_materials_emissive_strength'?: import('./KHR_materials_emissive_strength.js').MaterialKHRMaterialsEmissiveStrength,
    }

    interface ExtendableProperties {
        /** MaterialKHRMaterialsEmissiveStrength property */
        MaterialKHRMaterialsEmissiveStrength: true,
    }

    /** Interface for adding materialKHRMaterialsEmissiveStrength extension json properties. */
    interface materialKHRMaterialsEmissiveStrengthExtensions {}
    /** Interface for adding MaterialKHRMaterialsEmissiveStrength extension instance properties. */
    interface MaterialKHRMaterialsEmissiveStrengthExtensions {}
}

