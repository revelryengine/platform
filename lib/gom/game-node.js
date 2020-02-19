import { GameNodeChildSet } from './game-node-child-set.js';
import { GameEvent        } from '../events/game-event.js';
import { GameEventTarget  } from '../events/game-event-target.js';

/**
 * A GameNode is a node in a basic tree data structure. It has a reference to it's parent and a {@link GameNodeSet}
 * containing all it's children.
 *
 * Events will propagate up and down the tree in the same manner that DOM events propagate. A stage deviates from
 * a simple parent/child relationship in that it has two distinct sets of children (systems and entities).
 *
 * For convenience an EntityModel contains a reference to the corresponding Entity in the stage, but it should not
 * be considered a child of the EntityModel node. Likewise, an Entity contains a list of all corresponing
 * EntityModels but they should not be considered children of the Entity.
 *
 * In the Revelry Engine there are typically only 4 levels to the tree.
 *
 * @example
 * Game (GameNode)
 * └── stages (GameNodeChildSet)
 *     ├── Stage (GameNode)
 *     │   ├── systems (GameNodeChildSet)
 *     |   |    ├── System (GameNode)
 *     |   |    |    └──models (GameNodeChildSet)
 *     |   |    |        ├── EntityModel (GameNode)
 *     |   |    |        └── EntityModel
 *     |   |    └── System
 *     |   |         └──models
 *     |   |             ├── EntityModel
 *     |   |             └── EntityModel
 *     │   └── entities (GameNodeChildSet)
 *     |        ├── Entity (GameNode)
 *     |        └── Entity
 *     └── Stage
 *         ├── systems
 *         |    ├── System
 *         |    |    └──models
 *         |    |        ├── EntityModel
 *         |    |        └── EntityModel
 *         |    └── System
 *         |         └──models
 *         |             ├── EntityModel
 *         |             └── EntityModel
 *         └── entities
 *              ├── Entity
 *              └── Entity
 */
export class GameNode extends GameEventTarget {
    /**
     * Creates an instance of GameNode.
     * @param {String|UUID} id of GameNode;
     */
    constructor(id) {
        super();
        /**
         * @type {String|UUID}
         */
        this.id = id;

        /**
         * @type {GameNodeChildSet<GameNode>}
         */
        this.children = new GameNodeChildSet(this);

        /**
         * Boolean indicating whether GameNode has been added to a GameNodeChildSet and GameNode.init has been executed.
         * @type {Boolean}
         */
        this.initialized = false;

        /**
         * Boolean indicating whether GameNode has been removed from a GameNodeChildSet and GameNode.dispose has been executed.
         * @type {Boolean}
         */
        this.disposed = false;

        /**
         * Boolean to toggle GameNode.active manually
         * @type {Boolean}
         */
        this.disabled = false;
    }

    /**
     * Returns true if GameNode has been initialized and has not been disabled or disposed.
     *
     * @readonly
     */
    get active() {
        return this.initialized && !(this.disabled || this.disposed);
    }

    /**
     * Calls {@link GameEventTarget.dispatchDeferredEvents}. Calls update on all children.
     */
    update(deltaTime) {
        this.dispatchDeferredEvents();

        for (const child of this.children) {
            if (child.active) child.update(deltaTime);
        }
    }

    /**
     * Calls render on all children.
     */
    render() {
        for (const child of this.children) {
            if (child.active) child.render();
        }
    }

    /**
     * The init method will be called whenever this GameNode is added to a GameNodeChildSet.
     */
    async init() {
        // By default do nothing. Method should be overriden.
    }

    /**
     * The dispose method will be called whenever this GameNode is removed from a GameNodeChildSet.
     * Calls {@link GameEventTarget.clearDeferredEvents}. Calls dispose on all children.
     */
    async dispose() {
        this.clearDeferredEvents();

        for (const child of this.children) {
            await child.dispose();
        }
    }

    /**
     * Composes GameEvent.path before calling super method. {@link GameEventTarget.dispatchEvent}
     *
     * @param {GameEvent} event The GameEvent to be dispatched.
     */
    dispatchEvent(event) {
        if (event.eventPhase === GameEvent.NONE && event.bubbles) {
            let node = this;
            while (node.parent) {
                event.path.push(node.parent);
                node = node.parent;
            }
        }
        return super.dispatchEvent(event);
    }
}

export default GameNode;
