import { IdSet } from '../utils/id-set.js';
import { NodeAddEvent, NodeDeleteEvent } from '../events/events.js';

/** @typedef {import('./game-node.js').GameNode<any, any>} GameNode */

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
 * 
 * @template {GameNode} G
 * @extends {IdSet<G,G>}
 */
export class GameNodeChildSet extends IdSet {
    /**
     * Creates an instance of GameNodeChildSet.
     * @param {GameNode} parent Parent GameNode to add to each child as it is added to the set.
     * @param {Iterable<G>} [iterable] If an iterable object is passed, all of its elements will be added to the new GameNodeChildSet. If you don't specify this parameter, or its value is null, the new GameNodeChildSet is empty.
     */
    constructor(parent, iterable) {
        super();

        this.parent = parent;

        if (iterable) {
            for (const item of iterable) {
                this.add(item);
            }
        }
    }

    /**
     * Adds node to set and adds a parent reference the node.
     * It will call {@link GameNode.connectedCallback} if root is instanceof Game
     *
     * @param {G} node GameNode to be added to the set.
     * 
     * @return {this}
     */
    add(node) {
        node.parent = this.parent;
        super.add(node);

        if(node.root?.isGame) {
            node.connectedCallback();

            let child;
            const children = [...node.children];
            while((child = children.pop())) {
                children.push(...child.children);
                child.connectedCallback();
            }
        }

        this.parent.dispatchEvent(new NodeAddEvent({ node }));
        return /** @type {this} */this;
    }

    /**
     * Removes node from set and deletes the parent reference from the node.
     * It will call {@link GameNode.disconnectedCallback} if root was instanceof Game.
     *
     * @param {G} node Node to be removed
     * @returns {Boolean} Returns true if node was removed from parent. False if the node did not belong to set.
     */
    delete(node) {
        if (!this.has(node)) return false;
        const inGame = (node.root?.isGame);

        node.parent = undefined;
        super.delete(node);

        if(inGame) {
            node.disconnectedCallback();

            let child;
            const children = [...node.children];
            while((child = children.pop())) {
                children.push(...child.children);
                child.disconnectedCallback();
            }
        }

        this.parent.dispatchEvent(new NodeDeleteEvent({ node }));
        return true;
    }
}

export default GameNodeChildSet;