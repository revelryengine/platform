// deno-lint-ignore-file no-empty-interface

/**
 * Augments the glTF extension interfaces to include EXT_texture_webp types.
 * @module @revelryengine/gltf/extensions
 */

declare module '@revelryengine/gltf/extensions' {
    interface textureExtensions {
        /** A json object representing the EXT_texture_webp extension */
        'EXT_texture_webp'?: import('./EXT_texture_webp.js').textureEXTTextureWebP
    }
    interface TextureExtensions {
        /** An EXTTextureWebP instance */
        'EXT_texture_webp'?: import('./EXT_texture_webp.js').TextureEXTTextureWebP
    }

    interface ExtendableProperties {
        /** TextureEXTTextureWebP property */
        TextureEXTTextureWebP: true,
    }

    /** Interface for adding extTextureWebP extension json properties. */
    interface textureEXTTextureWebPExtensions {}
    /** Interface for adding EXTTextureWebP extension instance properties. */
    interface TextureEXTTextureWebPExtensions {}
}
