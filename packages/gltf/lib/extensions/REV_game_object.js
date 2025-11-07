import { GLTFProperty } from '../gltf-property.js';
import { extensions   } from './extensions.js';

/**
 * @typedef {{
 *  id:          string,
 *  hidden?:     boolean,
 *  outline?:    [number, number, number, number],
 *  extensions?: Revelry.GLTF.Extensions.revGameObjectNode,
 * } & import('../gltf-property.js').glTFPropertyData} revGameObjectNode
 */

/**
 * This extension is used to group and identify glTF scene nodes as belonging to a single game object
 */
export class REVGameObjectNode extends GLTFProperty {
    /**
     * @param {{
     *  id:          string,
     *  hidden?:     boolean,
     *  outline?:    [number, number, number, number],
     *  extensions?: Revelry.GLTF.Extensions.REVGameObjectNode,
     * } & import('../gltf-property.js').GLTFPropertyData} revGameObjectNode
     */
    constructor(revGameObjectNode) {
        super(revGameObjectNode);

        const { id, hidden, outline, extensions } = revGameObjectNode;

        /**
         * The id of the game object
         */
        this.id = id;

        /**
         * Inidcates that the object should be hidden from rendering
         */
        this.hidden = hidden;

        /**
         * The color to outline the game object with
         */
        this.outline = outline;

        this.extensions = extensions;
    }

    /**
     * Creates a REVGameObjectNode instance from its JSON representation.
     * @param {revGameObjectNode} revGameObjectNode
     * @param {import('../gltf-property.js').FromJSONOptions} options
     * @override
     */
    static fromJSON(revGameObjectNode, options) {
        return new this(this.unmarshall(revGameObjectNode, options, {
        }, 'REVGameObjectNode'));
    }

}

extensions.add('REV_game_object', {
    schema: {
        Node: REVGameObjectNode,
    },
});
