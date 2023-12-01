import { NamedGLTFProperty } from './gltf-property.js';
import { Camera            } from './camera.js';
import { Mesh              } from './mesh.js';
import { Skin              } from './skin.js';

/**
 * @typedef {{
 *  camera?:      number,
 *  children?:    number[],
 *  skin?:        number,
 *  matrix?:      mat4,
 *  mesh?:        number,
 *  rotation?:    quat,
 *  scale?:       vec3,
 *  translation?: vec3,
 *  weights?:     number[],
 *  extensions?:  Revelry.GLTF.Extensions.node,
 * } & import('./gltf-property.js').namedGLTFPropertyData} node
 */

let ids = 1;
/**
 * A node in the node hierarchy.
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-node
 */
export class Node extends NamedGLTFProperty {
    /**
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
     *  extensions?:  Revelry.GLTF.Extensions.Node,
     * } & import('./gltf-property.js').NamedGLTFPropertyData} node
     */
    constructor(node) {
        super(node);

        Object.defineProperty(this, '$id', { value: ids++ });

        const {
            camera, children = [], skin, matrix, scale, rotation, translation, mesh, weights, extensions
        } = node;

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

        this.extensions = extensions;
    }

    /**
     * @param {node} node
     * @param {import('./gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(node, options) {
        return new this(this.unmarshall(node, options, {
            camera:   { factory: Camera, collection: 'cameras' },
            skin:     { factory: Skin,   collection: 'skins'   },
            mesh:     { factory: Mesh,   collection: 'meshes'  },
            children: { factory: Node,   collection: 'nodes'   },
        }, 'Node'));
    }

    /**
     * Returns the number of morph targets in the first primitive of the node's mesh. If mesh or targets is not defined
     * 0 is returned.
     * @returns {Number}
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
        while(search.length) {
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
        while(search.length) {
            yield node = /** @type {Node} */(search.shift());
            search.push(...node.children);
        }
    }
}
