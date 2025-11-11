/**
 * A keyframe animation.
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-animation
 *
 * @module
 */

import { NamedGLTFProperty } from './gltf-property.js';
import { AnimationSampler  } from './animation-sampler.js';
import { AnimationChannel  } from './animation-channel.js';
import { Node              } from './node.js';
import { GL                } from './constants.js';
import { quat              } from "revelryengine/deps/gl-matrix.js";

/**
 * @import { namedGLTFPropertyData, NamedGLTFPropertyData, FromJSONGraph } from './gltf-property.js';
 * @import { animationExtensions, AnimationExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @import { animationChannel } from './animation-channel.js';
 * @import { animationSampler } from './animation-sampler.js';
 * @import { TypedArray } from 'revelryengine/utils/buffers.js';
 */

/**
 * @typedef {object} animation - Animation JSON representation.
 * @property {animationChannel[]} channels - An array of channels, each of which targets an animation's sampler at a node's property. Different channels of the same animation can't have equal targets.
 * @property {animationSampler[]} samplers - An array of samplers that combines input and output accessors with an interpolation algorithm to define a keyframe graph (but not its target).
 * @property {animationExtensions} [extensions] - Extension-specific data.
 */

/**
 * Animation class representation.
 */
export class Animation extends NamedGLTFProperty {
    /**
     * Creates an instance of Animation.
     * @param {{
     *  channels: AnimationChannel[],
     *  samplers: AnimationSampler[],
     *  extensions?: AnimationExtensions,
     * } & NamedGLTFPropertyData} unmarshalled - Unmarshalled animation object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { channels, samplers, extensions } = unmarshalled;

        /**
         * An array of samplers that combines input and output accessors with an interpolation algorithm to define a
         * keyframe graph (but not its target).
         */
        this.samplers = samplers;

        /**
         * An array of channels, each of which targets an animation's sampler at a node's property. Different channels of
         * the same animation can't have equal targets.
         */
        this.channels = channels;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {animation & namedGLTFPropertyData} animation - The animation JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(animation, graph) {
        return this.unmarshall(graph, animation, {
            samplers: { factory: AnimationSampler },
            channels: { factory: AnimationChannel },
        }, this);
    }

    /**
     * Create an animator for the animation.
     * @param {boolean} loop - Whether the animation should loop.
     */
    createAnimator(loop = true) {
        return new Animator(this, loop);
    }
}

/**
 * @typedef {(
 *  typeof GL.FLOAT | typeof GL.BYTE | typeof GL.UNSIGNED_BYTE | typeof GL.SHORT | typeof GL.UNSIGNED_SHORT
 * )} NormalizerType - The type of normalizer.
 *
 * @callback Normalizer - A function that normalizes a value.
 * @param {number} v - The value to normalize
 * @return {number}
 */

const normalizers = /** @type {const} */({
    [GL.FLOAT]          : /** @type {Normalizer} */v => v,
    [GL.BYTE]           : /** @type {Normalizer} */v => Math.max(v / 127.0, -1.0),
    [GL.UNSIGNED_BYTE]  : /** @type {Normalizer} */v => v / 255.0,
    [GL.SHORT]          : /** @type {Normalizer} */v => Math.max(v / 32767.0, -1.0),
    [GL.UNSIGNED_SHORT] : /** @type {Normalizer} */v => v / 65535.0,
});

const q1 = quat.create();
const q2 = quat.create();

const interpolators = {
    /**
     * Interpolates between keyframe values.
     * The animated values remain constant to the output of the first keyframe, until the next keyframe.
     * @param {TypedArray} outputArray
     * @param {any} target
     * @param {string} path
     * @param {number} start
     * @param {number} stride
     */
    STEP: (outputArray, target, path, start, stride) => {
        start *= stride;

        for (let i = 0; i < stride; i++) {
            target[path][i] = outputArray[start + i];
        }
    },
    /**
     * Interpolates between keyframe values.
     * The animated values are linearly interpolated between keyframes.
     * @param {TypedArray} outputArray
     * @param {any} target
     * @param {string} path
     * @param {number} start
     * @param {number} stride
     * @param {number} end
     * @param {number} t
     * @param {Normalizer} normalizer
     */
    LINEAR: (outputArray, target, path, start, stride, end, t, normalizer) => {
        start *= stride;
        end *= stride;

        if(path !== 'weights' && stride === 1) { //scalar
            const a = normalizer(outputArray[start]);
            const b = normalizer(outputArray[end]);
            target[path] = a + (t * (b - a));
        } else if (path === 'rotation') { //slerp
            quat.set(q1,
                outputArray[start],
                outputArray[start + 1],
                outputArray[start + 2],
                outputArray[start + 3],
            );

            quat.set(q2,
                outputArray[end],
                outputArray[end + 1],
                outputArray[end + 2],
                outputArray[end + 3],
            );

            quat.slerp(target[path], q1, q2, t);
            quat.normalize(target[path], target[path]);
        } else {
            for (let i = 0; i < stride; i++) {
                const a = normalizer(outputArray[start + i]);
                const b = normalizer(outputArray[end + i]);
                target[path][i] = a + (t * (b - a));
            }
        }
    },
    /**
     * Interpolates between keyframe values.
     * The animation’s interpolation is computed using a cubic spline with specified tangents.
     * @see https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#appendix-c-spline-interpolation
     *
     * @param {TypedArray} outputArray
     * @param {any} target
     * @param {string} path
     * @param {number} start
     * @param {number} stride
     * @param {number} end
     * @param {number} t
     * @param {Normalizer} _normalizer
     * @param {TypedArray} inputArray
     */
    CUBICSPLINE: (outputArray, target, path, start, stride, end, t, _normalizer, inputArray) => {
        const tDelta = inputArray[end] - inputArray[start];

        start *= stride * 3;
        end *= stride * 3;

        const A = 0;
        const V = 1 * stride;
        const B = 2 * stride;

        const tSq = t ** 2;
        const tCub = t ** 3;

        for (let i = 0; i < stride; ++i) {
            const p0 = outputArray[start + V + i];
            const m0 = tDelta * outputArray[start + B + i];
            const p1 = outputArray[end + V + i];
            const m1 = tDelta * outputArray[start + A + i];
            target[path][i] = ((2 * tCub - 3 * tSq + 1) * p0) + ((tCub - 2 * tSq + t) * m0) + ((-2 * tCub + 3 * tSq) * p1) + ((tCub - tSq) * m1);
        }

        if (path === 'rotation') {
            quat.normalize(target[path], target[path]);
        }
    },
};

/**
 * Finds the next key frame based on time t.
 * @todo use a binary search algorithm
 * @param {TypedArray} input - The input keyframe times.
 * @param {number} t - The time to find the next keyframe for.
 */
function findNextKeyFrame(input, t) {
    const i = input.findIndex(v => v > t);
    return i > 0 ? i : input.length - 1;
}

/**
 * Animates a glTF Animation.
 */
export class Animator {
    /**
     * Creates an instance of Animator.
     * @param {Animation} animation - The animation to animate.
     * @param {boolean} loop - Whether the animation should loop.
     */
    constructor(animation, loop = true) {
        /**
         * Current time of the animation in seconds.
         */
        this.time  = 0;
        /**
         * Whether the animation should loop.
         */
        this.loop  = loop;
        /**
         * The current animation being animated.
         */
        this.animation = animation;

        /**
         * Targets affected by this animation.
         * @type {Record<string, Set<unknown>>}
         */
        this.targets = {};

        for(const channel of animation.channels) {
            const { target: { node, path }, sampler: { output: { type }} } = channel;

            if(path === 'pointer') {
                if(!channel.target.extensions?.KHR_animation_pointer) throw new Error('Invalid State');
                const { root, target, path } = channel.target.extensions.KHR_animation_pointer.resolve();
                this.targets[root.collection] ??= new Set();
                this.targets[root.collection].add(root.target);

                target[path] ??= type !== 'SCALAR' || path === 'weights' ? [] : 0;
            } else {
                if(!node) throw new Error('Invalid State');
                this.targets['/nodes'] ??= new Set();
                this.targets['/nodes'].add(node);

                node[path] ??= [];
            }
        }

        /**
         * Duration of the animation in seconds.
         */
        this.duration = animation.channels.reduce((duration, { sampler: { input: { max = [0] } } }) => Math.max(max[0], duration), 0);
    }

    /**
     * Updates the animation state.
     * @param {number} deltaTime - Time elapsed since last update in milliseconds.
     * @param {boolean} [loop] - Whether the animation should loop. If undefined, the animator's loop property is used.
     */
    update(deltaTime, loop) {
        this.time += deltaTime / 1000;

        const { animation } = this;

        const time = (loop ?? this.loop) && this.duration ? this.time % this.duration : this.time;

        for (const channel of animation.channels) {
            const { sampler: { input, output, interpolation } } = channel;

            if(!input.min || !input.max) continue;

            const inputArray  = input.getTypedArray();
            const outputArray = output.getTypedArray();

            let target, path;
            if(channel.target.path === 'pointer'){
                if(!channel.target.extensions?.KHR_animation_pointer) continue;
                const resolved = channel.target.extensions.KHR_animation_pointer.resolve();
                target = resolved.target;
                path   = resolved.path;
            } else {
                if(!channel.target.node) continue;
                target = channel.target.node;
                path   = channel.target.path;
            }

            const interp     = interpolators[interpolation];
            const normalizer = normalizers[/** @type {NormalizerType}*/ (output.componentType)];
            const stride     = path === 'weights' && target instanceof Node ? target.getNumberOfMorphTargets() : output.getNumberOfComponents();

            /**
             * Clamp keyframes to start and end if outside time range
             * @see https://github.com/KhronosGroup/glTF/issues/1179
             */
            if (time <= input.min[0]) {
                const t = 0;
                this.#clamp(outputArray, target, path, stride, t, normalizer, interpolation);

            } else if (time >= input.max[0]) {
                const t = outputArray.length - stride;
                this.#clamp(outputArray, target, path, stride, t, normalizer, interpolation);
            } else {
                const next = findNextKeyFrame(inputArray, time);
                const startTime = inputArray[next - 1];
                const endTime = inputArray[next];

                const t = (time - startTime) / (endTime - startTime);

                const start = (next - 1);
                const end = next;
                interp(outputArray, target, path, start, stride, end, t, normalizer, inputArray);
            }
        }
    }


    /**
     * @param {TypedArray} outputArray
     * @param {any} target
     * @param {string} path
     * @param {number} stride
     * @param {number} t
     * @param {Normalizer} normalizer
     * @param {AnimationSampler['interpolation']} interpolation
     */
    #clamp(outputArray, target, path, stride, t, normalizer, interpolation) {
        if(target[path] instanceof Array) {
            for (let i = 0; i < stride; i++) {
                target[path][i] = normalizer(outputArray[t + i + (interpolation === 'CUBICSPLINE' ? stride : 0)]);
            }
        } else {
            target[path] = normalizer(outputArray[t]);
        }
    }
}
