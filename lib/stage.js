import { EntityRegistry   } from './entity-registry.js';
import { GameNode         } from './gom/game-node.js';
import { GameNodeChildSet } from './gom/game-node-child-set.js';

/**
 * The StageSystemSet is an {@link GameNodeChildSet} with added functionality to register systems with the {@link EntityRegistry} when they are added.
 */
class StageSystemSet extends GameNodeChildSet {
    get stage() {
        return this.parent;
    }

    add(system) {
        this.stage.entityRegistry.registerSystem(system);
        return super.add(system);
    }

    delete(system) {
        this.stage.entityRegistry.unregisterSystem(system);
        return super.delete(system);
    }
}

/**
 * A stage is a collection of systems and components.
 */
export class Stage extends GameNode {
    /** @type {EntityRegistry} */
    entityRegistry = new EntityRegistry(this);

    /** @type {StageSystemSet} */
    children = new StageSystemSet(this);

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
        super.update(deltaTime);

        for (const entity of this.entities) {
            if (!entity.inactive) entity.update(deltaTime);
        }
    }

    /**
     * Calls super {@link GameNode.render} and then calls render on all active entities as well.
     */
    render() {
        super.render();

        for (const entity of this.entities) {
            if (!entity.inactive) entity.render();
        }
    }

    createEntity(...args) {
        return this.entityRegistry.createEntity(...args);
    }
}

export default Stage;
