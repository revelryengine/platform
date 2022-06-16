import { GameEventTarget  } from '../events/game-event-target.js';
import { UUID             } from '../utils/uuid.js';
import { GameNodeChildSet } from './game-node-child-set.js';

/**
 * A GameNode is a node in a basic tree data structure. It has a reference to it's parent and a {@link GameNodeSet}
 * containing all it's children.
 *
 * Events will propagate up and down the tree in the same manner that DOM events propagate.
 *
 * In the Revelry Engine there are typically only 4 levels to the tree (i.e. Game->Stage->System->Model).
 *
 * @example
 * Game (GameNode)
 * |-- stages (GameNodeChildSet)
 *     |-- Stage (GameNode)
 *     |   |-- systems (GameNodeChildSet)
 *     |        |-- System (GameNode)
 *     |        |    |--models (GameNodeChildSet)
 *     |        |        |-- Model (GameNode)
 *     |        |        |-- Model
 *     |        |-- System
 *     |             |--models
 *     |                 |-- Model
 *     |                 |-- Model
 *     |-- Stage
 *         |-- systems
 *            |-- System
 *            |    |--models
 *            |        |-- Model
 *            |        |-- Model
 *            |-- System
 *                 |--models
 *                     |-- Model
 *                     |-- Model
 */
export class GameNode extends GameEventTarget {
    /**
     * @type {GameNodeChildSet<GameNode>}
     */
    children = new GameNodeChildSet(this);

    /**
     * Boolean to toggle GameNode.active manually
     * @type {Boolean}
     */
    inactive = false;

    /**
     * Creates an instance of GameNode.
     * @param {String|UUID} id of GameNode;
     */
    constructor(id) {
        super();
        
        /**
         * @type {String|UUID}
         */
        this.id = id || new UUID();
    }

    

    /**
     * Calls {@link GameEventTarget.dispatchDeferredEvents}. Calls update on all children.
     */
    update(deltaTime) {
        this.dispatchDeferredEvents();

        for (const child of this.children) {
            if (!child.inactive) child.update(deltaTime);
        }
    }

    /**
     * Calls render on all children.
     */
    render() {
        for (const child of this.children) {
            if (!child.inactive) child.render();
        }
    }

    /**
     * The init method will be called whenever this GameNode is added to the game.
     */
    connectedCallback() {

    }

    /**
     * The disconnectedCallback method will be called whenever this GameNode is removed from the game.
     */
    disconnectedCallback() {
        
    }

    /**
     * Returns the current root of the node
     */
    get root() {
        if(!this.parent) return;

        let root = this.parent;
        while (root.parent) root = root.parent;
        return root;
    }
}

export default GameNode;
