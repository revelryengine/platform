import { NamedGLTFProperty } from './gltf-property.js';
import { Node              } from './node.js';

/**
 * @typedef {{
 *  nodes:       number[],
 *  extensions?: Revelry.GLTF.Extensions.scene,
 * } & import('./gltf-property.js').namedGLTFPropertyData} scene
 */

/**
 * The root nodes of a scene.
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-scene
 */
export class Scene extends NamedGLTFProperty {
    /**
     * @param {{
     *  nodes:       Node[],
     *  extensions?: Revelry.GLTF.Extensions.Scene,
     * } & import('./gltf-property.js').NamedGLTFPropertyData} scene
     */
    constructor(scene) {
        super(scene);

        const { nodes = [], extensions } = scene;

        /**
         * Each root Node.
         */
        this.nodes = nodes;

        this.extensions = extensions;
    }

    /**
     * @param {scene} scene
     * @param {import('./gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(scene, options) {
        return new this(this.unmarshall(scene, options, {
            nodes: { factory: Node, collection: 'nodes' },
        }, 'Scene'));
    }

    * traverseDepthFirst() {
        const search = [...this.nodes];

        let node;
        while(search.length) {
            yield node = /** @type {Node} */(search.shift());
            search.unshift(...node.children);
        }
    }

    * traverseBreadthFirst() {
        const search = [...this.nodes];

        let node;
        while(search.length) {
            yield node = /** @type {Node} */(search.shift());
            search.push(...node.children);
        }
    }
}
