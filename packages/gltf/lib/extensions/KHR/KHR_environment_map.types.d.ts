// deno-lint-ignore-file no-empty-interface

/**
 * Augments the glTF extension interfaces to include KHR_environment_map types.
 * @module virtual-rev-gltf-extensions
 */

declare module 'virtual-rev-gltf-extensions' {
    interface glTFExtensions {
        /** A json object representing the KHR_environment_map extension */
        'KHR_environment_map'?: import('./KHR_environment_map.js').glTFKHREnvironmentMap,
    }
    interface GLTFExtensions {
        /** A GLTFKHREnvironmentMap instance */
        'KHR_environment_map'?: import('./KHR_environment_map.js').GLTFKHREnvironmentMap,
    }

    interface sceneExtensions {
        /** A json object representing the KHR_environment_map extension */
        'KHR_environment_map'?: import('./KHR_environment_map.js').sceneKHREnvironmentMap,
    }
    interface SceneExtensions {
        /** A SceneKHREnvironmentMap instance */
        'KHR_environment_map'?: import('./KHR_environment_map.js').SceneKHREnvironmentMap,
    }

    interface ExtendableProperties {
        /** GLTFKHREnvironmentMap property */
        GLTFKHREnvironmentMap: true,

        /** GLTFKHREnvironmentMapCubemap property */
        GLTFKHREnvironmentMapCubemap: true,

        /** GLTFKHREnvironmentMapData property */
        GLTFKHREnvironmentMapData: true,

        /** SceneKHREnvironmentMap property */
        SceneKHREnvironmentMap: true,
    }

    /** Interface for adding glTFKHREnvironmentMap extension json properties. */
    interface glTFKHREnvironmentMapExtensions {}
    /** Interface for adding GLTFKHREnvironmentMap extension instance properties. */
    interface GLTFKHREnvironmentMapExtensions {}
    /** Interface for adding glTFKHREnvironmentMapCubemap extension json properties. */
    interface glTFKHREnvironmentMapCubemapExtensions {}
    /** Interface for adding GLTFKHREnvironmentMapCubemap extension instance properties. */
    interface GLTFKHREnvironmentMapCubemapExtensions {}
    /** Interface for adding glTFKHREnvironmentMapData extension json properties. */
    interface glTFKHREnvironmentMapDataExtensions {}
    /** Interface for adding GLTFKHREnvironmentMapData extension instance properties. */
    interface GLTFKHREnvironmentMapDataExtensions {}

    /** Interface for adding sceneKHREnvironmentMap extension json properties. */
    interface sceneKHREnvironmentMapExtensions {}
    /** Interface for adding SceneKHREnvironmentMap extension instance properties. */
    interface SceneKHREnvironmentMapExtensions {}
}

