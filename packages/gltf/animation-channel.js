/**
 * An animation channel combines an animation sampler with a target property being animated.
 *
 * [Reference Spec - Animation Channel](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-animation-channel)
 *
 * @module
 */

import { GLTFProperty           } from './gltf-property.js';
import { AnimationChannelTarget } from './animation-channel-target.js';
import { AnimationSampler       } from './animation-sampler.js';

/**
 * @import { GLTFPropertyData, ReferenceField } from './gltf-property.types.d.ts';
 * @import { animationChannelExtensions, AnimationChannelExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @import { animationChannelTarget } from './animation-channel-target.js';
 */

/**
 * @typedef {object} animationChannel - Animation channel JSON representation.
 * @property {number} sampler - The index of the sampler in this animation used to compute the value for the target.
 * @property {animationChannelTarget} target - The target to animate.
 * @property {animationChannelExtensions} [extensions] - Extension-specific data.
 */

/**
 * AnimationChannel class representation.
 */
export class AnimationChannel extends GLTFProperty {
    /**
     * Creates an instance of AnimationChannel.
     * @param {{
     *  sampler:     AnimationSampler,
     *  target:      AnimationChannelTarget,
     *  extensions?: AnimationChannelExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled animation channel object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { sampler, target, extensions } = unmarshalled;

        /**
         * The Sampler in this animation used to compute the value for the target.
         */
        this.sampler = sampler;

        /**
         * The Node and TRS property to target.
         */
        this.target = target;

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
        sampler: { factory: () => AnimationSampler, collection: 'samplers', location: 'parent' },
        target:  { factory: () => AnimationChannelTarget },
    };
}
