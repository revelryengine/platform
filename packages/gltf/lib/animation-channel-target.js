import { GLTFProperty } from './gltf-property.js';
import { Node         } from './node.js';

/**
 * @typedef {{
 *  path: 'weights'|'translation'|'rotation'|'scale'|'pointer',
 *  node?: number,
 *  extensions?: Revelry.GLTF.Extensions.animationChannelTarget
 * } & import('./gltf-property.js').glTFPropertyData} animationChannelTarget
 */

/**
 * The descriptor of the animated property.
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-animation-channel-target
 */
export class AnimationChannelTarget extends GLTFProperty {
    /**
     * @param {{
     *  path: 'weights'|'translation'|'rotation'|'scale'|'pointer',
     *  node?: Node
     *  extensions?: Revelry.GLTF.Extensions.AnimationChannelTarget
     * } & import('./gltf-property.js').GLTFPropertyData} animationChannelTarget
     */
    constructor(animationChannelTarget) {
        super(animationChannelTarget);

        const { node, path, extensions } = animationChannelTarget;

        /**
         * The Node to target.
         */
        this.node = node;

        /**
         * The name of the node's TRS property to modify, or the "weights" of the Morph Targets it instantiates. For the
         * "translation" property, the values that are provided by the sampler are the translation along the x, y, and z
         * axes. For the "rotation" property, the values are a quaternion in the order (x, y, z, w), where w is the scalar.
         * For the "scale" property, the values are the scaling factors along the x, y, and z axes.
         */
        this.path = path;

        this.extensions = extensions;
    }

    /**
     * Create an animation channel target from a JSON representation.
     * @param {animationChannelTarget} animationChannelTarget
     * @param {import('./gltf-property.js').FromJSONOptions} options
     * @override
     */
    static fromJSON(animationChannelTarget, options) {
        return new this(this.unmarshall(animationChannelTarget, options, {
            node: { factory: Node, collection: 'nodes' },
        }, 'AnimationChannelTarget'));
    }
}
