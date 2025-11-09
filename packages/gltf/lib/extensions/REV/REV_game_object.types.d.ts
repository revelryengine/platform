// deno-lint-ignore-file no-empty-interface

/**
 * Augments the glTF extension interfaces to include REV_game_object types.
 * @module virtual-rev-gltf-extensions
 */

declare module 'virtual-rev-gltf-extensions' {
    interface nodeExtensions {
        /** A json object representing the REV_game_object extension */
        'REV_game_object'?: import('./REV_game_object.js').nodeREVGameObject,
    }
    interface NodeExtensions {
        /** A REVGameObjectNode instance */
        'REV_game_object'?: import('./REV_game_object.js').NodeREVGameObject,
    }

    interface ExtendableProperties {
        /** NodeREVGameObject property */
        NodeREVGameObject: true,
    }

    /** Interface for adding nodeREVGameObject extension json properties. */
    interface nodeREVGameObjectExtensions {}
    /** Interface for adding NodeREVGameObject extension instance properties. */
    interface NodeREVGameObjectExtensions {}
}

