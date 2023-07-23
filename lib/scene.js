import { NamedGLTFProperty } from './gltf-property.js';

/**
 * The root nodes of a scene.
 * @typedef {namedGLTFProperty} scene
 * @property {Number[]} [nodes] - The indices of each root node.
 *
 * @see https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#scene
 */

/**
 * A class wrapper around the glTF scene object.
 */
export class Scene extends NamedGLTFProperty {
    /**
     * Creates an instance of Scene.
     * @param {scene} scene - The properties of the scene.
     */
    constructor(scene) {
        super(scene);
        
        const { nodes = [] } = scene;
        
        /**
         * Each root Node.
         * @type {Number[]|Node[]}
         */
        this.nodes = nodes;
    }
    
    static referenceFields = [
        { name: 'nodes', type: 'collection', collection: 'nodes' },
    ];
    
    * traverseDepthFirst() {
        const search = [...this.nodes];

        let node;
        while(search.length) {
            yield node = search.shift();
            search.unshift(...node.children);
        }
    }

    * traverseBreadthFirst() {
        const search = [...this.nodes];

        let node;
        while(search.length) {
            yield node = search.shift();
            search.push(...node.children);
        }
    }
}

export default Scene;
