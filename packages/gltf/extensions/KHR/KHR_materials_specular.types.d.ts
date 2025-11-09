// deno-lint-ignore-file no-empty-interface

/**
 * Augments the glTF extension interfaces to include KHR_materials_specular types.
 * @module virtual-rev-gltf-extensions
 */

declare module 'virtual-rev-gltf-extensions' {
    interface materialExtensions {
        /** A json object representing the KHR_materials_specular extension */
        'KHR_materials_specular'?: import('./KHR_materials_specular.js').materialKHRMaterialsSpecular,
    }
    interface MaterialExtensions {
        /** A MaterialKHRMaterialsSpecular instance */
        'KHR_materials_specular'?: import('./KHR_materials_specular.js').MaterialKHRMaterialsSpecular,
    }

    interface ExtendableProperties {
        /** MaterialKHRMaterialsSpecular property */
        MaterialKHRMaterialsSpecular: true,
    }

    /** Interface for adding materialKHRMaterialsSpecular extension json properties. */
    interface materialKHRMaterialsSpecularExtensions {}
    /** Interface for adding MaterialKHRMaterialsSpecular extension instance properties. */
    interface MaterialKHRMaterialsSpecularExtensions {}
}

