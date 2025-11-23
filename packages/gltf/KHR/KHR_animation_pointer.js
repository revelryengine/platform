/// <reference path="./KHR_animation_pointer.types.d.ts" />

/**
 * This extension is based on the animation features of glTF 2.0. The structure of the schemas stay the same.
 *
 * The only major addition is, that the output values are mapped using a JSON Pointer.
 *
 * [Reference Spec - KHR_animation_pointer](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_animation_pointer)
 *
 * @module
 */

import { GLTFProperty, JSONPointer } from '../gltf-property.js';

/**
 * @import { GLTFPropertyData, ReferenceField } from '../gltf-property.types.d.ts';
 * @import { animationChannelTargetKHRAnimationPointerExtensions, AnimationChannelTargetKHRAnimationPointerExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @typedef {object} animationChannelTargetKHRAnimationPointer - KHR_animation_pointer JSON representation.
 * @property {string} pointer - A JSON Pointer string.
 * @property {animationChannelTargetKHRAnimationPointerExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_animation_pointer class representation.
 */
export class AnimationChannelTargetKHRAnimationPointer extends GLTFProperty {

    /**
     * Creates a new instance of AnimationChannelTargetKHRAnimationPointer.
     * @param {{
     *  pointer: JSONPointer,
     *  extensions?: AnimationChannelTargetKHRAnimationPointerExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_animation_pointer object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { pointer, extensions } = unmarshalled;

        /**
         * A pointer that resolves the target and path
         */
        this.pointer = pointer;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Reference fields for this class.
     * @type {Record<string, ReferenceField>}
     * @override
     */
    static referenceFields = {
        pointer: { factory: () => JSONPointer },
    };
}

GLTFProperty.extensions.add('KHR_animation_pointer', {
    schema: {
        AnimationChannelTarget: AnimationChannelTargetKHRAnimationPointer,
    },
});
