// deno-lint-ignore-file no-empty-interface

/**
 * Augments the glTF extension interfaces to include KHR_audio types.
 * @module virtual-rev-gltf-extensions
 */

declare module 'virtual-rev-gltf-extensions' {
    interface glTFExtensions {
        /** A json object representing the KHR_audio extension */
        'KHR_audio'?: import('./KHR_audio.js').glTFKHRAudio,
    }
    interface GLTFExtensions {
        /** A GLTFKHRAudio instance */
        'KHR_audio'?: import('./KHR_audio.js').GLTFKHRAudio,
    }

    interface nodeExtensions {
        /** A json object representing the KHR_audio extension */
        'KHR_audio'?: import('./KHR_audio.js').nodeKHRAudio,
    }
    interface NodeExtensions {
        /** A NodeKHRAudio instance */
        'KHR_audio'?: import('./KHR_audio.js').NodeKHRAudio,
    }

    interface sceneExtensions {
        /** A json object representing the KHR_audio extension */
        'KHR_audio'?: import('./KHR_audio.js').sceneKHRAudio,
    }
    interface SceneExtensions {
        /** A SceneKHRAudio instance */
        'KHR_audio'?: import('./KHR_audio.js').SceneKHRAudio,
    }

    interface ExtendableProperties {
        /** GLTFKHRAudio property */
        GLTFKHRAudio: true,

        /** GLTFKHRAudioAudio property */
        GLTFKHRAudioAudio: true,

        /** GLTFKHRAudioSource property */
        GLTFKHRAudioSource: true,

        /** GLTFKHRAudioEmitter property */
        GLTFKHRAudioEmitter: true,

        /** GLTFKHRAudioEmitterPositional property */
        GLTFKHRAudioEmitterPositional: true,

        /** NodeKHRAudio property */
        NodeKHRAudio: true,

        /** SceneKHRAudio property */
        SceneKHRAudio: true,
    }

    /** Interface for adding glTFKHRAudio extension json properties. */
    interface glTFKHRAudioExtensions {}
    /** Interface for adding GLTFKHRAudio extension instance properties. */
    interface GLTFKHRAudioExtensions {}
    /** Interface for adding glTFKHRAudioAudio extension json properties. */
    interface glTFKHRAudioAudioExtensions {}
    /** Interface for adding GLTFKHRAudioAudio extension instance properties. */
    interface GLTFKHRAudioAudioExtensions {}
    /** Interface for adding glTFKHRAudioSource extension json properties. */
    interface glTFKHRAudioSourceExtensions {}
    /** Interface for adding GLTFKHRAudioSource extension instance properties. */
    interface GLTFKHRAudioSourceExtensions {}
    /** Interface for adding glTFKHRAudioEmitter extension json properties. */
    interface glTFKHRAudioEmitterExtensions {}
    /** Interface for adding GLTFKHRAudioEmitter extension instance properties. */
    interface GLTFKHRAudioEmitterExtensions {}
    /** Interface for adding glTFKHRAudioEmitterPositional extension json properties. */
    interface glTFKHRAudioEmitterPositionalExtensions {}
    /** Interface for adding GLTFKHRAudioEmitterPositional extension instance properties. */
    interface GLTFKHRAudioEmitterPositionalExtensions {}

    /** Interface for adding nodeKHRAudio extension json properties. */
    interface nodeKHRAudioExtensions {}
    /** Interface for adding NodeKHRAudio extension instance properties. */
    interface NodeKHRAudioExtensions {}

    /** Interface for adding sceneKHRAudio extension json properties. */
    interface sceneKHRAudioExtensions {}
    /** Interface for adding SceneKHRAudio extension instance properties. */
    interface SceneKHRAudioExtensions {}
}

