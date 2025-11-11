// deno-lint-ignore-file no-empty-interface

/**
 * Augments the glTF extension interfaces to include KHR_environment_map types.
 * @module @revelryengine/gltf/extensions
 */

declare module '@revelryengine/gltf/extensions' {
    interface glTFExtensions {
        /** A json object representing the KHR_environment_map extension */
        'KHR_environment_map'?: import('./KHR_environment_map.js').khrEnvironmentMap,
    }
    interface GLTFExtensions {
        /** A KHREnvironmentMap instance */
        'KHR_environment_map'?: import('./KHR_environment_map.js').KHREnvironmentMap,
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
        /** KHREnvironmentMap property */
        KHREnvironmentMap: true,

        /** KHREnvironmentMapCubemap property */
        KHREnvironmentMapCubemap: true,

        /** KHREnvironmentMapData property */
        KHREnvironmentMapData: true,

        /** SceneKHREnvironmentMap property */
        SceneKHREnvironmentMap: true,
    }

    /** Interface for adding khrEnvironmentMap extension json properties. */
    interface khrEnvironmentMapExtensions {}
    /** Interface for adding KHREnvironmentMap extension instance properties. */
    interface KHREnvironmentMapExtensions {}
    /** Interface for adding khrEnvironmentMapCubemap extension json properties. */
    interface khrEnvironmentMapCubemapExtensions {}
    /** Interface for adding KHREnvironmentMapCubemap extension instance properties. */
    interface KHREnvironmentMapCubemapExtensions {}
    /** Interface for adding khrEnvironmentMapData extension json properties. */
    interface khrEnvironmentMapDataExtensions {}
    /** Interface for adding KHREnvironmentMapData extension instance properties. */
    interface KHREnvironmentMapDataExtensions {}

    /** Interface for adding sceneKHREnvironmentMap extension json properties. */
    interface sceneKHREnvironmentMapExtensions {}
    /** Interface for adding SceneKHREnvironmentMap extension instance properties. */
    interface SceneKHREnvironmentMapExtensions {}
}

