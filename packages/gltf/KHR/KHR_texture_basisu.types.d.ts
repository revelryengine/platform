// deno-lint-ignore-file no-empty-interface

/**
 * Augments the glTF extension interfaces to include KHR_texture_basisu types.
 * @module @revelryengine/gltf/extensions
 */

declare module '@revelryengine/gltf/extensions' {
    interface textureExtensions {
        /** A json object representing the KHR_texture_basisu extension */
        'KHR_texture_basisu'?: import('./KHR_texture_basisu.js').textureKHRTextureBasisu,
    }
    interface TextureExtensions {
        /** A TextureKHRTextureBasisu instance */
        'KHR_texture_basisu'?: import('./KHR_texture_basisu.js').TextureKHRTextureBasisu,
    }

    interface ExtendableProperties {
        /** TextureKHRTextureBasisu property */
        TextureKHRTextureBasisu: true,
    }

    /** Interface for adding textureKHRTextureBasisu extension json properties. */
    interface textureKHRTextureBasisuExtensions {}
    /** Interface for adding TextureKHRTextureBasisu extension instance properties. */
    interface TextureKHRTextureBasisuExtensions {}
}

declare module '@revelryengine/settings' {
    interface RevelryEngineSettings {
        /** KHR_texture_basisu settings. */
        KHR_texture_basisu?: {
            /**
             * The number of web workers to use for transcoding basisu textures. Default is 4.
             */
            workerCount?: number
        },
    }
}

