/**
 * Joints and matrices defining a skin.
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-skin
 *
 * @module
 */

import { NamedGLTFProperty } from './gltf-property.js';
import { Node              } from './node.js';
import { Accessor          } from './accessor.js';

/**
 * @import { namedGLTFPropertyData, NamedGLTFPropertyData, FromJSONGraph } from './gltf-property.js';
 * @import { skinExtensions, SkinExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 *
 * @typedef {object} skin - Skin JSON representation.
 * @property {number[]} joints - The indices of the nodes used as joints in this skin.
 * @property {number} [inverseBindMatrices] - The index of the accessor containing the floating-point 4x4 inverse-bind matrices.
 * @property {number} [skeleton] - The index of the node used as a skeleton root.
 * @property {skinExtensions} [extensions] - The extension properties.
 */

/**
 * Skin class representation.
 */
export class Skin extends NamedGLTFProperty {
    /**
     * Creates an instance of Skin.
     * @param {{
     *  joints:               Node[]
     *  inverseBindMatrices?: Accessor,
     *  skeleton?:            Node,
     *  extensions?:          SkinExtensions,
     * } & NamedGLTFPropertyData} unmarshalled - Unmarshalled skin object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { joints, inverseBindMatrices, skeleton, extensions } = unmarshalled;

        /**
         * Skeleton Nodes, used as joints in this skin.
         */
        this.joints = joints;

        /**
         * The Accessor containing the floating-point 4x4 inverse-bind matrices. The default is
         * that each matrix is a 4x4 identity matrix, which implies that inverse-bind matrices were pre-applied.
         */
        this.inverseBindMatrices = inverseBindMatrices;

        /**
         * The Node used as a skeleton root. When undefined, joints transforms resolve to scene root.
         */
        this.skeleton = skeleton;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {skin & namedGLTFPropertyData} skin - The skin JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(skin, graph) {
        return this.unmarshall(graph, skin, {
            joints:              { factory: Node,     collection: 'nodes'     },
            inverseBindMatrices: { factory: Accessor, collection: 'accessors' },
            skeleton:            { factory: Node,     collection: 'nodes'     },
        }, this);
    }
}
