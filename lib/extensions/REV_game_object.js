import { extensions   } from '../extensions.js';
import { GLTFProperty } from '../gltf-property.js';

/**
 * This extension is used to group and identify glTF scene nodes as belonging to a single game object
 */

/**
 * REV_game_object node extension
 * @typedef {glTFProperty} revGameObjectNode
 * @property {String} id - The id of the game object
 * @property {Number[]} [highlight] - The color to highlight the game object with
 */

/**
 * A class wrapper for the material revGameObjectNode object.
 */
export class RevGameObjectNode extends GLTFProperty {
    /**
     * Creates an instance of RevGameObjectNode.
     * @param {revGameObjectNode} revGameObjectNode - The properties of the REV_game_object node extension.
     */
    constructor(revGameObjectNode) {
        super(revGameObjectNode);

        const { id, highlight } = revGameObjectNode;

        /**
         * @type {String} The id of the game object
         */
        this.id = id;

        /**
         * @type {Number[]} The color to highlight the game object with
         */
        this.highlight = highlight;
    }
}

extensions.set('REV_game_object', {
    schema: {
        Node: RevGameObjectNode,
    },
});
