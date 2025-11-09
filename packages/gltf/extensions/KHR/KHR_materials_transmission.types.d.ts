// deno-lint-ignore-file no-empty-interface

/**
 * Augments the glTF extension interfaces to include KHR_materials_transmission types.
 * @module virtual-rev-gltf-extensions
 */

declare module 'virtual-rev-gltf-extensions' {
    interface materialExtensions {
        /** A json object representing the KHR_materials_transmission extension */
        'KHR_materials_transmission'?: import('./KHR_materials_transmission.js').materialKHRMaterialsTransmission,
    }
    interface MaterialExtensions {
        /** A MaterialKHRMaterialsTransmission instance */
        'KHR_materials_transmission'?: import('./KHR_materials_transmission.js').MaterialKHRMaterialsTransmission,
    }

    interface ExtendableProperties {
        /** MaterialKHRMaterialsTransmission property */
        MaterialKHRMaterialsTransmission: true,
    }

    /** Interface for adding materialKHRMaterialsTransmission extension json properties. */
    interface materialKHRMaterialsTransmissionExtensions {}
    /** Interface for adding MaterialKHRMaterialsTransmission extension instance properties. */
    interface MaterialKHRMaterialsTransmissionExtensions {}
}

