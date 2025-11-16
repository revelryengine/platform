// deno-lint-ignore-file no-empty-interface

/**
 * Augments the glTF extension interfaces to include KHR_lights_punctual types.
 * @module @revelryengine/gltf/extensions
 */

declare module '@revelryengine/gltf/extensions' {
    interface glTFExtensions {
        /** A json object representing the KHR_lights_punctual extension */
        'KHR_lights_punctual'?: import('./KHR_lights_punctual.js').khrLightsPunctual,
    }
    interface GLTFExtensions {
        /** A KHRLightsPunctual instance */
        'KHR_lights_punctual'?: import('./KHR_lights_punctual.js').KHRLightsPunctual,
    }

    interface nodeExtensions {
        /** A json object representing the KHR_lights_punctual extension */
        'KHR_lights_punctual'?: import('./KHR_lights_punctual.js').nodeKHRLightsPunctual,
    }
    interface NodeExtensions {
        /** A NodeKHRLightsPunctual instance */
        'KHR_lights_punctual'?: import('./KHR_lights_punctual.js').NodeKHRLightsPunctual,
    }

    interface ExtendableProperties {
        /** KHRLightsPunctual property */
        KHRLightsPunctual: true,

        /** KHRLightsPunctualLight property */
        KHRLightsPunctualLight: true,

        /** KHRLightsPunctualLightSpot property */
        KHRLightsPunctualLightSpot: true,

        /** NodeKHRLightsPunctual property */
        NodeKHRLightsPunctual: true,
    }

    /** Interface for adding khrLightsPunctual extension json properties. */
    interface khrLightsPunctualExtensions {}
    /** Interface for adding KHRLightsPunctual extension instance properties. */
    interface KHRLightsPunctualExtensions {}
    /** Interface for adding khrLightsPunctualLight extension json properties. */
    interface khrLightsPunctualLightExtensions {}
    /** Interface for adding KHRLightsPunctualLight extension instance properties. */
    interface KHRLightsPunctualLightExtensions {}
    /** Interface for adding khrLightsPunctualLightSpot extension json properties. */
    interface khrLightsPunctualLightSpotExtensions {}
    /** Interface for adding KHRLightsPunctualLightSpot extension instance properties. */
    interface KHRLightsPunctualLightSpotExtensions {}

    /** Interface for adding nodeKHRLightsPunctual extension json properties. */
    interface nodeKHRLightsPunctualExtensions {}
    /** Interface for adding NodeKHRLightsPunctual extension instance properties. */
    interface NodeKHRLightsPunctualExtensions {}
}

