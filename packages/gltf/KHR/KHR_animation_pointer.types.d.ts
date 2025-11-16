// deno-lint-ignore-file no-empty-interface

/**
 * Augments the glTF extension interfaces to include KHR_animation_pointer types.
 * @module @revelryengine/gltf/extensions
 */

declare module '@revelryengine/gltf/extensions' {
    interface animationChannelTargetExtensions {
        /** A json object representing the KHR_animation_pointer extension */
        'KHR_animation_pointer'?: import('./KHR_animation_pointer.js').animationChannelTargetKHRAnimationPointer
    }
    interface AnimationChannelTargetExtensions {
        /** A AnimationChannelTargetKHRAnimationPointer instance */
        'KHR_animation_pointer'?: import('./KHR_animation_pointer.js').AnimationChannelTargetKHRAnimationPointer
    }

    interface ExtendableProperties {
        /** AnimationChannelTargetKHRAnimationPointer property */
        AnimationChannelTargetKHRAnimationPointer: true,
    }

    /** Interface for adding animationChannelTargetKHRAnimationPointer extension json properties. */
    interface animationChannelTargetKHRAnimationPointerExtensions {}
    /** Interface for adding AnimationChannelTargetKHRAnimationPointer extension instance properties. */
    interface AnimationChannelTargetKHRAnimationPointerExtensions {}
}

