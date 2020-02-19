import { GameNodeInitEvent    } from '../events/game-node-init.js';
import { GameNodeDisposeEvent } from '../events/game-node-dispose.js';
import { IdSet                } from '../utils/id-set.js';

/**
 * A GameNodeChildSet will set the parent each node as it is added. It extends {@link IdSet} which will also add a reference map of the node by id.
 *
 * @example
 * const parent = {};
 * const nodes = new GameNodeChildSet(parent);
 * const child = {};
 *
 * child.add(child);
 *
 * item.parent === parent;
 */
export class GameNodeChildSet extends IdSet {
    /**
     * Creates an instance of GameNodeChildSet.
     * @param {GameNode} parent Parent GameNode to add to each child as it is added to the set.
     * @param {Iterable<GameNode>} [iterable] If an iterable object is passed, all of its elements will be added to the new GameNodeChildSet. If you don't specify this parameter, or its value is null, the new GameNodeChildSet is empty.
     */
    constructor(parent, iterable) {
        super();

        /**
         * @type {Object}
         * @desc The parent GameNode to att to each child as it is added to the set
         */
        this.parent = parent;

        if (iterable) {
            for (const item of iterable) {
                this.add(item);
            }
        }
    }

    /**
     * Adds node to set and adds a parent reference the node. It will call {@link GameNode.init} on the node and emits {@link GameNodeInitEvent}.
     *
     * @param {GameNode} node GameNode to be added to the set.
     * @emits {GameNodeInitEvent}
     * @returns {GameNodeChildSet} Returns the GameNodeChildSet
     */
    add(node) {
        node.parent = this.parent;
        node.init().then(() => {
            node.initialized = true;
            node.dispatchEvent(new GameNodeInitEvent());
        });
        return super.add(node);
    }

    /**
     * Removes node from set and deletes the parent reference from the node. Calls {@link GameNode.dispose} on the node and emits {@link GameNodeDisposeEvent}.
     *
     * @param {GameNode} node Node to be removed
     * @emits {GameNodeDisposeEvent}
     * @returns {Boolean} Returns true if node was present and set and successfully removed.
     */
    delete(node) {
        if (node.parent !== this.parent) return false;
        node.dispose().then(() => {
            node.disposed = true;
            node.dispatchEvent(new GameNodeDisposeEvent());
            delete node.parent;
        });
        return super.delete(node);
    }
}

export default GameNodeChildSet;
