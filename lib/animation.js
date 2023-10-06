import { NamedGLTFProperty } from './gltf-property.js';
import { AnimationSampler  } from './animation-sampler.js';
import { Channel           } from './channel.js';
import { quat              } from '../deps/gl-matrix.js';

/**
 * @see https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#animations
 */

const normalizers = {
    [WebGL2RenderingContext.FLOAT]          : f => f,
    [WebGL2RenderingContext.BYTE]           : c => Math.max(c / 127.0, -1.0),
    [WebGL2RenderingContext.UNSIGNED_BYTE]  : c => c / 255.0,
    [WebGL2RenderingContext.SHORT]          : c => Math.max(c / 32767.0, -1.0),
    [WebGL2RenderingContext.UNSIGNED_SHORT] : c => c / 65535.0,
};

const q1 = quat.create();
const q2 = quat.create();

const interpolators = {
    STEP: (outputArray, target, path, start, stride) => {
        start *= stride;

        for (let i = 0; i < stride; i++) {
            target[path][i] = outputArray[start + i];
        }
    },
    LINEAR: (outputArray, target, path, start, stride, end, t, normalize) => {
        start *= stride;
        end *= stride;

        if (path === 'rotation') { //slerp
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
        } else if(path !== 'weights' && stride === 1) { //scalar
            const a = normalize(outputArray[start]);
            const b = normalize(outputArray[end]);
            target[path] = a + (t * (b - a));
        } else {
            for (let i = 0; i < stride; i++) {
                const a = normalize(outputArray[start + i]);
                const b = normalize(outputArray[end + i]);
                target[path][i] = a + (t * (b - a));
            }
        }
    },
    /**
     * @see https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#appendix-c-spline-interpolation
     */
    CUBICSPLINE: (outputArray, target, path, start, stride, end, t, _normalize, inputArray) => {
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

/** @todo use a binary search algorithm */
function findNextKeyFrame(input, t) {
    let i = input.findIndex(v => v > t);
    return i > 0 ? i : input.length - 1;
}

export class Animator {
    constructor(animation, loop = true) {
        this.time  = 0;
        this.loop  = loop;
        this.animation = animation;

        this.targets = {};

        for(const channel of animation.channels) {
            let { target: { node: target, path } } = channel;

            if(path === 'pointer') {
                const { rootTarget: { collection, target } } = channel.target.extensions.KHR_animation_pointer.pointer;
                this.targets[collection] = this.targets[collection] || new Set();
                this.targets[collection].add(target);
            } else {
                this.targets.nodes = this.targets.nodes || new Set();
                this.targets.nodes.add(target);
            }
        }

        this.duration = animation.channels.reduce((duration, { sampler: { input: { max } } }) => Math.max(max[0], duration), 0);
    }

    update(delta) {
        this.time += delta / 1000;

        const { animation } = this;

        const time = this.loop && this.duration ? this.time % this.duration : this.time;

        for (const channel of animation.channels) {
            const { sampler: { input, output, interpolation } } = channel;

            const inputArray = input.getTypedArray();
            const outputArray = output.getTypedArray();

            let { target: { node: target, path } } = channel;

            if(path === 'pointer') {
                ({ target, path } = channel.target.extensions.KHR_animation_pointer.pointer);
            }

            if(!target) continue;
            target[path] = target[path] || [];

            const stride = path === 'weights' ? target.getNumberOfMorphTargets() : output.getNumberOfComponents();
            const interp = interpolators[interpolation];
            const normalize = normalizers[output.componentType];

            /**
             * Clamp keyframes to start and end if outside time range
             * @see https://github.com/KhronosGroup/glTF/issues/1179
             */
            if (time <= input.min[0]) {
                if(output.type === 'SCALAR') {
                    target[path] = normalize(outputArray[0]);
                } else {
                    for (let i = 0; i < stride; i++) {
                        target[path][i] = normalize(outputArray[i + (interpolation === 'CUBICSPLINE' ? stride : 0)]);
                    }
                }
                
            } else if (time >= input.max[0]) {
                const last = outputArray.length - stride;
                if(output.type === 'SCALAR') {
                    target[path] = normalize(outputArray[last]);
                } else {
                    for (let i = 0; i < stride; i++) {
                        target[path][i] = normalize(outputArray[last + i + (interpolation === 'CUBICSPLINE' ? stride : 0)]);
                    }
                }
            } else {
                const next = findNextKeyFrame(inputArray, time);
                const startTime = inputArray[next - 1];
                const endTime = inputArray[next];

                const t = (time - startTime) / (endTime - startTime);

                const start = (next - 1);
                const end = next;
                interp(outputArray, target, path, start, stride, end, t, normalize, inputArray);
            }
        }
    }
}

/**
 * A keyframe animation.
 * @typedef {namedGLTFProperty} animation
 * @property {channel[]} channels - An array of channels, each of which targets an animation's sampler at a
 * node's property. Different channels of the same animation can't have equal targets.
 * @property {animationSampler[]} samplers - An array of samplers that combines input and output accessors with an
 * interpolation algorithm to define a keyframe graph (but not its target).
 *
 * @see https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#animation
 */

/**
 * A class wrapper for glTF animation object.
 */
export class Animation extends NamedGLTFProperty {
    /**
     * Creates an instance of Animation.
     * @param {animation} animation - The properties of the animation.
     */
    constructor(animation) {
        super(animation);
        
        const { channels, samplers } = animation;
        
        /**
         * An array of samplers that combines input and output accessors with an interpolation algorithm to define a
         * keyframe graph (but not its target).
         * @type {animationSampler[]}
         */
        this.samplers = samplers.map(sampler => new AnimationSampler(sampler));
        
        /**
         * An array of channels, each of which targets an animation's sampler at a node's property. Different channels of
         * the same animation can't have equal targets.
         * @type {channel[]}
         */
        this.channels = channels.map(channel => new Channel(channel));
    }
    
    static referenceFields = [
        { name: 'samplers', type: 'sub' },
        { name: 'channels', type: 'sub' },
    ];

    createAnimator(loop = true) {
        return new Animator(this, loop);
    }
}

export default Animation;
