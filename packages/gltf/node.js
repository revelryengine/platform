/**
 * A node in the node hierarchy.
 *
 * [Reference Spec - Node](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-node)
 *
 * @module
 */

import { NamedGLTFProperty } from './gltf-property.js';
import { Camera            } from './camera.js';
import { Mesh              } from './mesh.js';
import { Skin              } from './skin.js';

/**
 * @import { namedGLTFPropertyData, NamedGLTFPropertyData, FromJSONGraph } from './gltf-property.js';
 * @import { nodeExtensions, NodeExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @typedef {object} node - Node JSON representation.
 * @property {number} [camera] - The index of the camera referenced by this node.
 * @property {number[]} [children] - The indices of this node's children.
 * @property {number} [skin] - The index of the skin referenced by this node.
 * @property {number[]} [matrix] - A floating-point 4x4 transformation matrix stored in column-major order.
 * @property {number} [mesh] - The index of the mesh in this node.
 * @property {number[]} [rotation] - The node's unit quaternion rotation in the order (x, y, z, w), where w is the scalar.
 * @property {number[]} [scale] - The node's non-uniform scale, given as the scaling factors along the x, y, and z axes.
 * @property {number[]} [translation] - The node's translation along the x, y, and z axes.
 * @property {number[]} [weights] - The weights of the instantiated Morph Target. Number of elements must match number of Morph Targets of used mesh.
 * @property {nodeExtensions} [extensions] - Extension-specific data.
 */

let ids = 1;
/**
 * Node class representation.
 */
export class Node extends NamedGLTFProperty {
    /**
     * Creates an instance of Node.
     * @param {{
     *  camera?:      Camera,
     *  children?:    Node[],
     *  skin?:        Skin,
     *  matrix?:      node['matrix'],
     *  mesh?:        Mesh,
     *  rotation?:    node['rotation'],
     *  scale?:       node['scale'],
     *  translation?: node['translation'],
     *  weights?:     number[],
     *  extensions?:  NodeExtensions,
     * } & NamedGLTFPropertyData} unmarshalled - Unmarshalled node object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        Object.defineProperty(this, '$id', { value: ids++ });

        const {
            camera, children = [], skin, matrix, scale, rotation, translation, mesh, weights, extensions
        } = unmarshalled;

        /**
         * The Camera referenced by this node.
         */
        this.camera = camera;

        /**
         * The node's children.
         */
        this.children = children;

        /**
         * The Skin referenced by this node.
         */
        this.skin = skin;

        /**
         * A floating-point 4x4 transformation matrix stored in column-major order.
         */
        this.matrix = matrix;

        /**
         * The Mesh in this node.
         */
        this.mesh = mesh;

        /**
         * The node's unit quaternion rotation in the order (x, y, z, w), where w is the scalar.
         */
        this.rotation = rotation;

        /**
         * The node's non-uniform scale, given as the scaling factors along the x, y, and z axes.
         */
        this.scale = scale;

        /**
         * The node's translation along the x, y, and z axes.
         */
        this.translation = translation;

        /**
         * The weights of the instantiated Morph Target. Number of elements must match number of Morph Targets of used mesh.
         */
        this.weights = weights;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {node & namedGLTFPropertyData} node - The node JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(node, graph) {
        return this.unmarshall(graph, node, {
            camera:   { factory: Camera, collection: 'cameras' },
            skin:     { factory: Skin,   collection: 'skins'   },
            mesh:     { factory: Mesh,   collection: 'meshes'  },
            children: { factory: Node,   collection: 'nodes'   },
        }, this);
    }

    /**
     * Returns the number of morph targets in the first primitive of the node's mesh. If mesh or targets is not defined
     * 0 is returned.
     */
    getNumberOfMorphTargets() {
        return this.mesh && this.mesh.primitives[0].targets ? this.mesh.primitives[0].targets.length : 0;
    }

    /**
     * Depth first traverse through nodes and their children
     */
    * traverseDepthFirst() {
        /** @type {Node[]} */
        const search = [this];

        let node;
        while (search.length) {
            yield node = /** @type {Node} */(search.shift());
            search.unshift(...node.children);
        }
    }

    /**
     * Breadth first traverse through nodes and their children
     */
    * traverseBreadthFirst() {
        /** @type {Node[]} */
        const search = [this];

        let node;
        while (search.length) {
            yield node = /** @type {Node} */(search.shift());
            search.push(...node.children);
        }
    }
}
