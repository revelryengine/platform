import { Registry         } from './registry.js';
import { GameNode         } from './gom/game-node.js';
import { GameNodeChildSet } from './gom/game-node-child-set.js';
import { UUID             } from './utils/uuid.js';
import { IdSet            } from './utils/id-set.js';

/**
 * The StageSystemSet is an {@link GameNodeChildSet} with added functionality to register systems with the {@link Registry} when they are added.
 *
 * @example
 *
 * const stage = new Stage('foobar');
 *
 * stage.systems.add({ ... });
 */
class StageSystemSet extends GameNodeChildSet {
    get stage() {
        return this.parent;
    }

    add(system) {
        this.stage.registry.registerSystem(system);
        return super.add(system);
    }

    delete(system) {
        this.stage.registry.unregisterSystem(system);
        return super.delete(system);
    }
}


/**
 * The StageComponentSet is an {@link IdSet} with added functionality to register components with the {@link Registry} when they are added.
 *
 * @example
 *
 * const stage = new Stage('foobar');
 *
 * stage.components.add({ ... });
 */
 class StageComponentSet extends IdSet {
    /**
     * Creates an instance of StageComponentSet.
     * @param {Registry} registry
     */
    constructor(stage) {
        super();
        /** @type {Stage} */
        this.stage = stage;
    }

    /**
     * Calls {@link Registry.registerComponent} and adds the component to the set.
     *
     * @param {Object} component
     * @returns {ComponentSet}
     */
    add(component) {
        this.stage.registry.registerComponent(component);
        return super.add(component);
    }

    /**
     * Calls {@link Registry.unregisterComponent} and removes the component from the set.
     *
     * @param {Object} component
     * @returns {Boolean} Returns true if the components was present and successfully removed.
     */
    delete(component) {
        this.stage.registry.unregisterComponent(component);
        return super.delete(component);
    }    
}

/**
 * A stage is a collection of systems and components.
 */
export class Stage extends GameNode {
    /** @type {StageSystemSet<System>} */
    children = new StageSystemSet(this);

    /** @type {StageComponentSet<Object>} */
    components = new StageComponentSet(this);

    /** @type {Registry} */
    registry = new Registry(this);

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
     * A reference to the Registry.entities.
     *
     * @type {EntitySet<Entity>}
     * @readonly
     */
    get entities() {
        return this.registry.entities;
    }

    createEntity(components = {}, id = new UUID()) {
        for(const [type, value] of Object.entries(components)) {
            this.components.add({ type, entity: id, id: new UUID(), value });   
        }
        return id;
    }

    /**
     * Spawns the Model by creating all the required components and adding them to the stage.
     *
     * @param {Function} modelClass
     * @param {Object} [components={}]
     */
    spawn(modelClass, components = {}) {
        const entity = components.entity || new UUID();

        for(const [key, { type }] of Object.entries(modelClass.components)) {
            const value = components[key];

            if(value === undefined) throw new Error('Missing component');

            this.components.add({ type, entity, id: new UUID(), value });   
        }

        return this.registry.entities.getById(entity).models.getByClass(modelClass);
    }
}

export default Stage;
