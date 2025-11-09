// deno-lint-ignore-file no-empty-interface

/**
 * Augments the glTF extension interfaces to include KHR_texture_basisu types.
 * @module virtual-rev-gltf-extensions
 */

declare module 'virtual-rev-gltf-extensions' {
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

