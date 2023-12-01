import { GLTFProperty           } from './gltf-property.js';
import { AnimationChannelTarget } from './animation-channel-target.js';
import { AnimationSampler       } from './animation-sampler.js';

/**
 * @typedef  {{
 *  sampler:     number,
 *  target:      import('./animation-channel-target.js').animationChannelTarget,
 *  extensions?: Revelry.GLTF.Extensions.animationChannel,
 * } & import('./gltf-property.js').glTFPropertyData} animationChannel
 */

/**
 * An animation channel combines an animation sampler with a target property being animated.
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-animation-channel
 */
export class AnimationChannel extends GLTFProperty {
    /**
     * @param {{
     *  sampler:     AnimationSampler,
     *  target:      AnimationChannelTarget,
     *  extensions?: Revelry.GLTF.Extensions.AnimationChannel,
     * } & import('./gltf-property.js').GLTFPropertyData} animationChannel - The properties of the channel.
     */
    constructor(animationChannel) {
        super(animationChannel);

        const { sampler, target, extensions } = animationChannel;

        /**
         * The Sampler in this animation used to compute the value for the target.
         */
        this.sampler = sampler;

        /**
         * The Node and TRS property to target.
         */
        this.target = target;

        this.extensions = extensions;
    }

    /**
     * @param {animationChannel} animationChannel
     * @param {import('./gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(animationChannel, options) {
        return new this(this.unmarshall(animationChannel, options, {
            sampler: { factory: AnimationSampler, collection: 'samplers', location: 'parent' },
            target:  { factory: AnimationChannelTarget }
        }, 'AnimationChannel'));
    }
}
