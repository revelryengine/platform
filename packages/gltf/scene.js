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
 * @import { NamedGLTFPropertyData, ReferenceField } from './gltf-property.types.d.ts';
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
     * Reference fields for this class.
     * @type {Record<string, ReferenceField>}
     * @override
     */
    static referenceFields = {
        nodes: { factory: () => Node, collection: 'nodes' },
    };

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
