/// <reference lib="dom" />

import { UUID             } from '../utils/uuid.js';
import { Watchable        } from '../utils/watchable.js';
import { GameNodeChildSet } from './game-node-child-set.js';

/**
 * A GameNode is a node in a basic tree data structure. It has a reference to it's parent and a {@link GameNodeChildSet}
 * containing all it's children.
 *
 * In the Revelry Engine there are typically only 3 levels to the tree (i.e. Game->Stage->System).
 *
 * @example
 * Game
 *  |-- Stage
 *  |    |-- System
 *  |    |-- System
 *  |-- Stage
 *       |-- System
 *       |-- System
 *
 * @template {GameNode<any, any>|void} P
 * @template {GameNode<any, any>} [C=GameNode<any, any>]
 * @template {import('../utils/watchable.js').WatchableEventMap}[E=any]
 *
 * @extends {Watchable<{ 'node:add': C, 'node:delete': C } & E>}
 */
export class GameNode extends Watchable {
    /**
     * @type {P | undefined}
     * @desc The parent GameNode
     */
    parent = undefined;

    children =  /** @type {GameNodeChildSet<C>}*/ (new GameNodeChildSet(this));

    /**
     * Creates an instance of GameNode.
     * @param {{ id?: string, element?: HTMLElement }} [options]
     */
    constructor({ id = UUID(), element } = {}) {
        super();
        this.id = id;
        this.element = element;
    }

    /**
     * Calls update on all children.
     *
     * @param {number} deltaTime
     */
    update(deltaTime) {
        for (const child of this.children) {
            child.update(deltaTime);
        }
    }

    /**
     * Calls render on all children.
     */
    render() {
        for (const child of this.children) {
            child.render();
        }
    }

    /** Calls preload on all children in parellel
     * @returns {Promise<unknown>}
     */
    async preload() {
        return Promise.all([...this.children].map(child => child.preload()));
    }

    /**
     * The init method will be called whenever this GameNode is added to the game.
     * @virtual
     */
    connectedCallback() {

    }

    /**
     * The disconnectedCallback method will be called whenever this GameNode is removed from the game.
     * @virtual
     */
    disconnectedCallback() {

    }

    /**
     * Returns the current root of the node
     */
    get root() {
        let root = this.parent;
        while (root?.parent) root = root.parent;
        return root;
    }

    /**
     * Returns false for all instances except Game
     */
    get isGame() { return false }
}

export default GameNode;
