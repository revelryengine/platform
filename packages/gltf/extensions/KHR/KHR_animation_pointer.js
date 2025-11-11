/// <reference path="./KHR_animation_pointer.types.d.ts" />

/**
 * This extension is based on the animation features of glTF 2.0. The structure of the schemas stay the same.
 *
 * The only major addition is, that the output values are mapped using a JSON Pointer.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_animation_pointer/README.md
 *
 * @module
 */

import { GLTFProperty } from '../../gltf-property.js';
import { registry     } from '../registry.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, FromJSONGraph } from '../../gltf-property.js';
 * @import { animationChannelTargetKHRAnimationPointerExtensions, AnimationChannelTargetKHRAnimationPointerExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @import { JSONPointerResolveResult } from '../../gltf-property.js';
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
     *  resolve: () => JSONPointerResolveResult,
     *  extensions?: AnimationChannelTargetKHRAnimationPointerExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_animation_pointer object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { resolve, extensions } = unmarshalled;

        /**
         * Resolves the target and path
         */
        this.resolve = resolve;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {animationChannelTargetKHRAnimationPointer & glTFPropertyData} khrAnimationPointerTarget - The KHR_animation_pointer JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(khrAnimationPointerTarget, graph) {
        return this.unmarshall(graph, khrAnimationPointerTarget, {
            pointer: { pointer: 'resolve' }
        }, this);
    }
}

registry.add('KHR_animation_pointer', {
    schema: {
        AnimationChannelTarget: AnimationChannelTargetKHRAnimationPointer,
    },
});
