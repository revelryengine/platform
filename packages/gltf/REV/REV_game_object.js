/// <reference path="./REV_game_object.types.d.ts" />

/**
 * This extension is used to group and identify glTF scene nodes as belonging to a single game object
 * @module
 */

import { GLTFProperty } from '../gltf-property.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, FromJSONGraph } from '../gltf-property.js';
 * @import { nodeREVGameObjectExtensions, NodeREVGameObjectExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @typedef {object} nodeREVGameObject - REV_game_object JSON representation.
 * @property {string} id - The unique identifier for the game object.
 * @property {boolean} [hidden] - Indicates that the object should be hidden from rendering.
 * @property {[number, number, number, number]} [outline] - The color to outline the game object with.
 * @property {nodeREVGameObjectExtensions} [extensions] - Extension-specific data.
 */

/**
 * REV_game_object class representation.
 */
export class NodeREVGameObject extends GLTFProperty {
    /**
     * Creates a new instance of NodeREVGameObject.
     * @param {{
     *  id:          string,
     *  hidden?:     boolean,
     *  outline?:    [number, number, number, number],
     *  extensions?: NodeREVGameObjectExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled REV_game_object object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { id, hidden, outline, extensions } = unmarshalled;

        /**
         * The unique identifier for the game object
         */
        this.id = id;

        /**
         * Indicates that the object should be hidden from rendering
         */
        this.hidden = hidden;

        /**
         * The color to outline the game object with
         */
        this.outline = outline;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {nodeREVGameObject & glTFPropertyData} nodeREVGameObject - The REV_game_object JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(nodeREVGameObject, graph) {
        return this.unmarshall(graph, nodeREVGameObject, {
            // No reference fields
        }, this);
    }
}

GLTFProperty.extensions.add('REV_game_object', {
    schema: {
        Node: NodeREVGameObject,
    },
});
