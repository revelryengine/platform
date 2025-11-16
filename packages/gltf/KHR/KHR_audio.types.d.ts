// deno-lint-ignore-file no-empty-interface

/**
 * Augments the glTF extension interfaces to include KHR_audio types.
 * @module @revelryengine/gltf/extensions
 */

declare module '@revelryengine/gltf/extensions' {
    interface glTFExtensions {
        /** A json object representing the KHR_audio extension */
        'KHR_audio'?: import('./KHR_audio.js').khrAudio,
    }
    interface GLTFExtensions {
        /** A KHRAudio instance */
        'KHR_audio'?: import('./KHR_audio.js').KHRAudio,
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
        /** KHRAudio property */
        KHRAudio: true,

        /** KHRAudioAudio property */
        KHRAudioAudio: true,

        /** KHRAudioSource property */
        KHRAudioSource: true,

        /** KHRAudioEmitter property */
        KHRAudioEmitter: true,

        /** KHRAudioEmitterPositional property */
        KHRAudioEmitterPositional: true,

        /** NodeKHRAudio property */
        NodeKHRAudio: true,

        /** SceneKHRAudio property */
        SceneKHRAudio: true,
    }

    /** Interface for adding khrAudio extension json properties. */
    interface khrAudioExtensions {}
    /** Interface for adding KHRAudio extension instance properties. */
    interface KHRAudioExtensions {}
    /** Interface for adding khrAudioAudio extension json properties. */
    interface khrAudioAudioExtensions {}
    /** Interface for adding KHRAudioAudio extension instance properties. */
    interface KHRAudioAudioExtensions {}
    /** Interface for adding khrAudioSource extension json properties. */
    interface khrAudioSourceExtensions {}
    /** Interface for adding KHRAudioSource extension instance properties. */
    interface KHRAudioSourceExtensions {}
    /** Interface for adding khrAudioEmitter extension json properties. */
    interface khrAudioEmitterExtensions {}
    /** Interface for adding KHRAudioEmitter extension instance properties. */
    interface KHRAudioEmitterExtensions {}
    /** Interface for adding khrAudioEmitterPositional extension json properties. */
    interface khrAudioEmitterPositionalExtensions {}
    /** Interface for adding KHRAudioEmitterPositional extension instance properties. */
    interface KHRAudioEmitterPositionalExtensions {}

    /** Interface for adding nodeKHRAudio extension json properties. */
    interface nodeKHRAudioExtensions {}
    /** Interface for adding NodeKHRAudio extension instance properties. */
    interface NodeKHRAudioExtensions {}

    /** Interface for adding sceneKHRAudio extension json properties. */
    interface sceneKHRAudioExtensions {}
    /** Interface for adding SceneKHRAudio extension instance properties. */
    interface SceneKHRAudioExtensions {}
}

