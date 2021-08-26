import { GameNode } from './gom/game-node.js';
import { IdSet    } from './utils/id-set.js';

/**
 * The ComponentSet is an {@link IdSet} with added functionality to register components with the {@link EntityRegistry} when they are added.
 * Typically components should be added from the stage.components reference.
 *
 * @example
 *
 * const stage = new Stage('foobar');
 *
 * stage.components.add({ ... });
 */
 export class ComponentSet extends IdSet {
    /**
     * Creates an instance of ComponentSet.
     * @param {EntityRegistry} registry
     */
    constructor(registry) {
        super();
        /** @type {EntityRegistry} */
        this.registry = registry;
    }

    /**
     * Calls {@link EntityRegistry.addComponent} and adds the component to the set.
     *
     * @param {Object} component
     * @param {Boolean} [register] - Boolean to indicate that the component should be registered with the entityRegistry
     * @returns {ComponentSet}
     */
    add(component, register = true) {
        if(register) this.registry.registerComponent(component);
        return super.add(component);
    }

    /**
     * Calls {@link EntityRegistry.deleteComponent} and removes the component from the set.
     *
     * @param {Object} component
     * @param {Boolean} [unregister] - Boolean to indicate that the component should be unregistered with the entityRegistry
     * @returns {Boolean} Returns true if the components was present and successfully removed.
     */
    delete(component, unregister = true) {
        if(unregister) this.registry.unregisterComponent(component);
        return super.delete(component);
    }
}

/**
 * The EntityComponentSet is a {@link ComponentSet} with added functionality to set the component entity automatically.
 *
 */
 export class EntityComponentSet extends ComponentSet {
    /**
     * Creates an instance of ComponentSet.
     * @param {EntityRegistry} registry
     */
    constructor(registry, entity) {
        super(registry);
        /** @type {Entity} */
        this.entity = entity;
    }

    /**
     * Calls {@link EntityRegistry.addComponent} and adds the component to the set.
     *
     * @param {Object} component
     * @param {Boolean} [register] - Boolean to indicate that the component should be registered with the entityRegistry
     * @returns {ComponentSet}
     */
    add(component, register = true) {
        component.entity = this.entity.id;
        return super.add(component, register);
    }

    /**
     * Calls {@link EntityRegistry.deleteComponent} and removes the component from the set.
     *
     * @param {Object} component
     * @param {Boolean} [unregister] - Boolean to indicate that the component should be unregistered with the entityRegistry
     * @returns {Boolean} Returns true if the components was present and successfully removed.
     */
    delete(component, unregister = true) {
        return super.delete(component, unregister);
    }
}

export class Entity extends GameNode {
    /**
     * Creates an instance of Entity.
     * @param {String|UUID} id
     * @param {EntityRegistry} registry - The registry that entity exists for
     */
    constructor(id, registry) {
        super(id);

        /**
         * @type {EntityComponentSet<Object>}
         */
        this.components = new EntityComponentSet(registry, this);

        /**
         * A Set of all the {@link EntityModels} for this entity.
         * @type {IdSet<EntityModel>}
         */
        this.models = new IdSet();
    }

    /**
     * A reference to the parent of an Entity which is the {@link Stage}.
     *
     * @type {Stage}
     * @readonly
     */
    get stage() {
        return this.parent;
    }

    /**
     * A reference to the parent of a Entity's parent which is the {@link Game}.
     *
     * @type {Game}
     * @readonly
     */
    get game() {
        return this.parent?.parent;
    }
}

export default Entity;
