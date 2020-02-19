import { EntityRegistry } from './entity-registry.js';
import { GameNode       } from './gom/game-node.js';

/**
 * A stage is a collection of systems and components.
 *
 */
export class Stage extends GameNode {
    /**
     * Creates an instance of Stage.
     */
    constructor(id) {
        super(id);

        /** @type {EntityRegistry} */
        this.entityRegistry = new EntityRegistry(this);
    }

    /**
     * Reference to the game which is the stage's parent
     *
     * @readonly
     */
    get game() {
        return this.parent;
    }

    /**
     * Reference to stage's systems which are the stage's children.
     *
     * @type {GameNodeChildSet<System>}
     * @readonly
     */
    get systems() {
        return this.children;
    }

    /**
     * A reference to the EntityRegistry.entities. Acts as a second distinct list of children for the stage.
     *
     * @type {GamNodeChildSet<Entity>}
     * @readonly
     */
    get entities() {
        return this.entityRegistry.entities;
    }

    /**
     * A reference to the EntityRegistry.components. Components added should be POJOs.
     *
     * @type {ComponentSet<Object>}
     * @readonly
     */
    get components() {
        return this.entityRegistry.components;
    }

    /**
     * Calls super {@link GameNode.update} and then calls update on all active entities as well.
     *
     * @param {Number} deltaTime
     */
    update(deltaTime) {
        super.update();

        for (const entity of this.entities) {
            if (entity.active) entity.update(deltaTime);
        }
    }

    /**
     * Calls super {@link GameNode.render} and then calls render on all active entities as well.
     */
    render() {
        super.render();

        for (const entity of this.entities) {
            if (entity.active) entity.render();
        }
    }
}

export default Stage;
