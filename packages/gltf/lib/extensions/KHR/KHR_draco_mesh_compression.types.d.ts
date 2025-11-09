// deno-lint-ignore-file no-empty-interface

/**
 * Augments the glTF extension interfaces to include KHR_draco_mesh_compression types.
 * @module virtual-rev-gltf-extensions
 */

declare module 'virtual-rev-gltf-extensions' {
    interface meshPrimitiveExtensions {
        /** A json object representing the KHR_draco_mesh_compression extension */
        'KHR_draco_mesh_compression'?: import('./KHR_draco_mesh_compression.js').meshPrimitiveKHRDracoMeshCompression,
    }
    interface MeshPrimitiveExtensions {
        /** A MaterialKHRMaterialsIOR instance */
        'KHR_draco_mesh_compression'?: import('./KHR_draco_mesh_compression.js').MeshPrimitiveKHRDracoMeshCompression,
    }

    interface ExtendableProperties {
        /** MeshPrimitiveKHRDracoMeshCompression property */
        MeshPrimitiveKHRDracoMeshCompression: true,
    }

    /** Interface for adding meshPrimitiveKHRDracoMeshCompression extension json properties. */
    interface meshPrimitiveKHRDracoMeshCompressionExtensions {}
    /** Interface for adding MeshPrimitiveKHRDracoMeshCompression extension instance properties. */
    interface MeshPrimitiveKHRDracoMeshCompressionExtensions {}
}

