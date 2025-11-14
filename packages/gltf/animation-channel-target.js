/**
 * The descriptor of the animated property.
 *
 * [Reference Spec - Animation Channel Target](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-animation-channel-target)
 *
 * @module
 */

import { GLTFProperty } from './gltf-property.js';
import { Node         } from './node.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, FromJSONGraph } from './gltf-property.js';
 * @import { animationChannelTargetExtensions, AnimationChannelTargetExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @typedef {object} animationChannelTarget - Animation channel target JSON representation.
 * @property {('weights'|'translation'|'rotation'|'scale'|'pointer')} path - The name of the node's TRS property to modify.
 * @property {number} [node] - The index of the node to target.
 * @property {animationChannelTargetExtensions} [extensions] - Extension-specific data.
 */

/**
 * AnimationChannelTarget class representation.
 */
export class AnimationChannelTarget extends GLTFProperty {
    /**
     * Creates an instance of AnimationChannelTarget.
     * @param {{
     *  path: 'weights'|'translation'|'rotation'|'scale'|'pointer',
     *  node?: Node
     *  extensions?: AnimationChannelTargetExtensions
     * } & GLTFPropertyData} unmarshalled - Unmarshalled animation channel target object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { node, path, extensions } = unmarshalled;

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

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {animationChannelTarget & glTFPropertyData} animationChannelTarget - The animation channel target JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(animationChannelTarget, graph) {
        return this.unmarshall(graph, animationChannelTarget, {
            node: { factory: Node, collection: 'nodes' },
        }, this);
    }
}
