import { GameEventTarget  } from '../events/game-event-target.js';
import { UUID             } from '../utils/uuid.js';
import { GameNodeChildSet } from './game-node-child-set.js';

/**
 * A GameNode is a node in a basic tree data structure. It has a reference to it's parent and a {@link GameNodeChildSet}
 * containing all it's children.
 *
 * Events will propagate up and down the tree in the same manner that DOM events propagate.
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
 * @template {GameNode<any, any>} P
 * @template {GameNode<any, any>} C 
 */
export class GameNode extends GameEventTarget {
    /**
     * @type {P|undefined}
     * @desc The parent GameNode
     */
    parent = undefined;

    children = /** @type {GameNodeChildSet<C>}*/ (new GameNodeChildSet(this));    

    /**
     * @type {String}
     */
    id;

    /**
     * Creates an instance of GameNode.
     * @param {String} [id] of GameNode;
     */
    constructor(id) {
        super();
        this.id = id || UUID();
    }

    /**
     * Calls {@link GameEventTarget.dispatchDeferredEvents}. Calls update on all children.
     * 
     * @param {Number} deltaTime
     */
    update(deltaTime) {
        this.dispatchDeferredEvents();

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
     * @returns {Promise<any>}
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
