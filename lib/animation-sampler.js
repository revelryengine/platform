import { GLTFProperty } from './gltf-property.js';
import { Accessor     } from './accessor.js';

/**
 * @typedef {{
 *  input:         number,
 *  output:        number,
 *  interpolation: 'LINEAR' | 'STEP' | 'CUBICSPLINE',
 *  extensions?:   Revelry.GLTF.Extensions.animationSampler,
 * } & import('./gltf-property.js').glTFPropertyData} animationSampler
 */

/**
 * An animation sampler combines timestamps with a sequence of output values and defines an interpolation algorithm.
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-animation-sampler
 */
export class AnimationSampler extends GLTFProperty {
    /**
     * @param {{
     *  input:         Accessor,
     *  output:        Accessor,
     *  interpolation: animationSampler['interpolation'],
     *  extensions?:   Revelry.GLTF.Extensions.AnimationSampler,
     * } & import('./gltf-property.js').GLTFPropertyData} animationSampler - The properties of the animationSampler.
     */
    constructor(animationSampler) {
        super(animationSampler);

        const { input, interpolation = 'LINEAR', output, extensions } = animationSampler;

        /**
         * The Accessor containing keyframe input values, e.g., time.
         */
        this.input = input;

        /**
         * Interpolation algorithm.
         * Allowed values:
         * * "LINEAR"
         * * "STEP"
         * * "CUBICSPLINE"
         */
        this.interpolation = interpolation;

        /**
         * The Accessor containing keyframe output values.
         */
        this.output = output;

        this.extensions = extensions;
    }

    /**
     * @param {animationSampler} animationSampler
     * @param {import('./gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(animationSampler, options) {
        return new this(this.unmarshall(animationSampler, options, {
            input:  { factory: Accessor, collection: 'accessors' },
            output: { factory: Accessor, collection: 'accessors' },
        }, 'AnimationSampler'));
    }
}
