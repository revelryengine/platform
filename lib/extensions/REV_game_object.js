import { extensions   } from '../extensions.js';
import { GLTFProperty } from '../gltf-property.js';

/**
 * This extension is used to group and identify glTF scene nodes as belonging to a single game object
 */

/**
 * REV_game_object node extension
 * @typedef {glTFProperty} revGameObjectNode
 * @property {String} id - The id of the game object
 * @property {Boolean} [hidden] = Inidcates that the object should be hidden from rendering
 * @property {Number[]} [outline] - The color to outline the game object with
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

        const { id, hidden, outline } = revGameObjectNode;

        /**
         * @type {String} The id of the game object
         */
        this.id = id;

        /**
         * @type {Boolean} Inidcates that the object should be hidden from rendering
         */
        this.hidden = hidden;

        /**
         * @type {Number[]} The color to outline the game object with
         */
        this.outline = outline;
    }
}

extensions.set('REV_game_object', {
    schema: {
        Node: RevGameObjectNode,
    },
});
