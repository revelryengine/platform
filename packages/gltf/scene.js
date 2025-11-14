/**
 * The root nodes of a scene.
 *
 * [Reference Spec - Scene](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-scene)
 *
 * @module
 */

import { NamedGLTFProperty } from './gltf-property.js';
import { Node              } from './node.js';

/**
 * @import { namedGLTFPropertyData, NamedGLTFPropertyData, FromJSONGraph } from './gltf-property.js';
 * @import { sceneExtensions, SceneExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @typedef {object} scene - Scene JSON representation.
 * @property {number[]} nodes - The indices of each root node of the scene.
 * @property {sceneExtensions} [extensions] - Extension-specific data.
 */

/**
 * Scene class representation.
 */
export class Scene extends NamedGLTFProperty {
    /**
     * Creates an instance of Scene.
     * @param {{
     *  nodes:       Node[],
     *  extensions?: SceneExtensions,
     * } & NamedGLTFPropertyData} unmarshalled - Unmarshalled scene object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { nodes = [], extensions } = unmarshalled;

        /**
         * Each root Node.
         */
        this.nodes = nodes;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {scene & namedGLTFPropertyData} scene - The scene JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(scene, graph) {
        return this.unmarshall(graph, scene, {
            nodes: { factory: Node, collection: 'nodes' },
        }, this);
    }

    /**
     * Traverses the scene's node hierarchy depth-first
     */
    * traverseDepthFirst() {
        const search = [...this.nodes];

        let node;
        while (search.length) {
            yield node = /** @type {Node} */(search.shift());
            search.unshift(...node.children);
        }
    }

    /**
     * Traverses the scene's node hierarchy breadth-first
     */
    * traverseBreadthFirst() {
        const search = [...this.nodes];

        let node;
        while (search.length) {
            yield node = /** @type {Node} */(search.shift());
            search.push(...node.children);
        }
    }
}
