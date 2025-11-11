/**
 * An animation sampler combines timestamps with a sequence of output values and defines an interpolation algorithm.
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-animation-sampler
 *
 * @module
 */

import { GLTFProperty } from './gltf-property.js';
import { Accessor     } from './accessor.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, FromJSONGraph } from './gltf-property.js';
 * @import { animationSamplerExtensions, AnimationSamplerExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @typedef {object} animationSampler - Animation sampler JSON representation.
 * @property {number} input - The input accessor.
 * @property {number} output - The output accessor.
 * @property {'LINEAR' | 'STEP' | 'CUBICSPLINE'} interpolation - The interpolation algorithm.
 * @property {animationSamplerExtensions} [extensions] - Extension-specific data.
 */

/**
 * AnimationSampler class representation.
 */
export class AnimationSampler extends GLTFProperty {
    /**
     * Creates a new instance of AnimationSampler.
     * @param {{
     *  input:         Accessor,
     *  output:        Accessor,
     *  interpolation: animationSampler['interpolation'],
     *  extensions?:   AnimationSamplerExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled animation sampler object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { input, interpolation = 'LINEAR', output, extensions } = unmarshalled;

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

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {animationSampler & glTFPropertyData} animationSampler - The animation sampler JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(animationSampler, graph) {
        return this.unmarshall(graph, animationSampler, {
            input:  { factory: Accessor, collection: 'accessors' },
            output: { factory: Accessor, collection: 'accessors' },
        }, this);
    }
}
