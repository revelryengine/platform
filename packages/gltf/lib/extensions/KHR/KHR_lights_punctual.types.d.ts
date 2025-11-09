// deno-lint-ignore-file no-empty-interface

/**
 * Augments the glTF extension interfaces to include KHR_lights_punctual types.
 * @module virtual-rev-gltf-extensions
 */

declare module 'virtual-rev-gltf-extensions' {
    interface glTFExtensions {
        /** A json object representing the KHR_lights_punctual extension */
        'KHR_lights_punctual'?: import('./KHR_lights_punctual.js').glTFKHRLightsPunctual,
    }
    interface GLTFExtensions {
        /** A GLTFKHRLightsPunctual instance */
        'KHR_lights_punctual'?: import('./KHR_lights_punctual.js').GLTFKHRLightsPunctual,
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
        /** GLTFKHRLightsPunctual property */
        GLTFKHRLightsPunctual: true,

        /** GLTFKHRLightsPunctualLight property */
        GLTFKHRLightsPunctualLight: true,

        /** GLTFKHRLightsPunctualLightSpot property */
        GLTFKHRLightsPunctualLightSpot: true,

        /** NodeKHRLightsPunctual property */
        NodeKHRLightsPunctual: true,
    }

    /** Interface for adding glTFKHRLightsPunctual extension json properties. */
    interface glTFKHRLightsPunctualExtensions {}
    /** Interface for adding GLTFKHRLightsPunctual extension instance properties. */
    interface GLTFKHRLightsPunctualExtensions {}
    /** Interface for adding glTFKHRLightsPunctualLight extension json properties. */
    interface glTFKHRLightsPunctualLightExtensions {}
    /** Interface for adding GLTFKHRLightsPunctualLight extension instance properties. */
    interface GLTFKHRLightsPunctualLightExtensions {}
    /** Interface for adding glTFKHRLightsPunctualLightSpot extension json properties. */
    interface glTFKHRLightsPunctualLightSpotExtensions {}
    /** Interface for adding GLTFKHRLightsPunctualLightSpot extension instance properties. */
    interface GLTFKHRLightsPunctualLightSpotExtensions {}

    /** Interface for adding nodeKHRLightsPunctual extension json properties. */
    interface nodeKHRLightsPunctualExtensions {}
    /** Interface for adding NodeKHRLightsPunctual extension instance properties. */
    interface NodeKHRLightsPunctualExtensions {}
}

