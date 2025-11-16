// deno-lint-ignore-file no-empty-interface

/**
 * Augments the glTF extension interfaces to include KHR_texture_transform types.
 * @module @revelryengine/gltf/extensions
 */

declare module '@revelryengine/gltf/extensions' {
    interface textureInfoExtensions {
        /** A json object representing the KHR_texture_transform extension */
        'KHR_texture_transform'?: import('./KHR_texture_transform.js').textureInfoKHRTextureTransform,
    }
    interface TextureInfoExtensions {
        /** A TextureInfoKHRTextureTransform instance */
        'KHR_texture_transform'?: import('./KHR_texture_transform.js').TextureInfoKHRTextureTransform,
    }

    interface materialNormalTextureInfoExtensions {
        /** A json object representing the KHR_texture_transform extension */
        'KHR_texture_transform'?: import('./KHR_texture_transform.js').textureInfoKHRTextureTransform,
    }
    interface MaterialNormalTextureInfoExtensions {
        /** A TextureInfoKHRTextureTransform instance */
        'KHR_texture_transform'?: import('./KHR_texture_transform.js').TextureInfoKHRTextureTransform,
    }

    interface materialOcclusionTextureInfoExtensions {
        /** A json object representing the KHR_texture_transform extension */
        'KHR_texture_transform'?: import('./KHR_texture_transform.js').textureInfoKHRTextureTransform,
    }
    interface MaterialOcclusionTextureInfoExtensions {
        /** A TextureInfoKHRTextureTransform instance */
        'KHR_texture_transform'?: import('./KHR_texture_transform.js').TextureInfoKHRTextureTransform,
    }

    interface ExtendableProperties {
        /** TextureInfoKHRTextureTransform property */
        TextureInfoKHRTextureTransform: true,
    }

    /** Interface for adding textureInfoKHRTextureTransform extension json properties. */
    interface textureInfoKHRTextureTransformExtensions {}
    /** Interface for adding TextureInfoKHRTextureTransform extension instance properties. */
    interface TextureInfoKHRTextureTransformExtensions {}
}

