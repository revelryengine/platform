import { GameNodeChildSet } from './gom/game-node-child-set.js';
import { UUID             } from './utils/uuid.js';
import { SetMap               } from './utils/set-map.js';
import { Entity, ComponentSet } from './entity.js';

import {
    ComponentAddEvent,
    ComponentDeleteEvent,
    ModelAddEvent,
    ModelDeleteEvent,
    SystemAddEvent,
    SystemDeleteEvent,
} from './events/events.js';

const _ = new WeakMap();

/**
 * @private
 * @ignore
 */
function addToProperty(target, key, item) {
    if (target[key] instanceof Set) {
        target[key].add(item);
    } else {
        if (target[key] !== undefined) return;
        target[key] = item;
    }
}

/**
 * @private
 * @ignore
 */
function deleteFromProperty(target, key, item) {
    if (target[key] instanceof Set) {
        target[key].delete(item);
    } else {
        if (target[key] !== item) return;
        delete target[key];
    }
}

/**
 * @private
 * @ignore
 */
function addComponentToSystem(component, system) {
    const entity = system.stage.entities.getById(component.entity);
    for (const [modelKey, ModelClass] of EntityRegistry.matchingSystemModels(system, entity)) {

        const id = `${system.id}:${modelKey}:${entity.id}`;
        let model = entity.models.getById(id);
        if (!model) {
            model = new ModelClass(id, entity);
            for (const cmpnt of entity.components) {
                for (const [, { type }] of Object.entries(ModelClass.components)) {
                    if (type === cmpnt.type) {
                        model.components.set(cmpnt.type, cmpnt);
                        // addToProperty(model, cmpntKey, cmpnt);
                    }
                }
            }
            entity.models.add(model);
            system.models.add(model);
            system.dispatchEvent(new ModelAddEvent({ model }));
            addToProperty(system, modelKey, model);
        } else {
            for (const [, { type }] of Object.entries(ModelClass.components)) {
                if (type === component.type) {
                    model.components.set(type, component);
                    // addToProperty(model, cmpntKey, component);
                }
            }
        }
    }
}


/**
 * @private
 * @ignore
 */
// function deleteComponentFromSystem(component, system) {

// }



/**
 * The EntityRegistry is responsible for maintaining the relationships between {@link Systems} and {@link EntityModel}s.
 * When components are registered with the EntityRegistry, the registry will look for all registered systems that have a matching EntityModel for that component type.
 * A model is considered matching if there are at least one component for all component types defined on the model.
 *
 * @example
 *
 * class FoobarModel extends EntityModel {
 *   @component('foobar') foobar;
 * }
 *
 * class FoobarSystem extends System {
 *   @FoobarModel.model foobar;
 * }
 *
 * const system = new FoobarSystem('foobar-system');
 * const stage = new Stage('main-stage');
 *
 * stage.systems.add(system);
 * stage.components.add({ id: new UUID(), entity: new UUID(), type: 'foobar' });
 *
 *
 */
export class EntityRegistry {
    /**
     * Creates an instance of EntityRegistry.
     * @param {Stage} stage
     */
    constructor(stage) {
        this.stage = stage;

        /**
         * A second distinct list of children containing all of the entities for the stage.
         * @type {GameNodeChildSet<Entity>}
         */
        this.entities = new GameNodeChildSet(stage);

        /**
         * @type {ComponentSet<Object>}
         */
        this.components = new ComponentSet(this);

        _.set(this, {
            systemsByType: new SetMap(),
            componentsByType: new SetMap(),
            entitiesByType: new SetMap(),
        });
    }

    /**
     * Finds all the models that this entity has all the components for
     * @param {*} system
     * @param {*} entity
     */
    static * matchingSystemModels(system, entity) {
        const SystemClass = system.constructor;

        for (const [key, { model: ModelClass }] of Object.entries(SystemClass.models)) {
            if (this.componentsMatchModel(entity.components, ModelClass)) {
                yield [key, ModelClass];
            }
        }
    }

    static componentsMatchModel(components, ModelClass) {
        return Object.values(ModelClass.components).every(({ type }) => {
            return [...components.values()].find(component => type === component.type);
        });
    }

    ensureEntityExists(id) {
        return this.entities.getById(id) || this.entities.add(new Entity(id, this)).getById(id);
    }

    registerSystem(system) {
        const SystemClass = system.constructor;

        for (const { model: ModelClass } of Object.values(SystemClass.models)) {
            for (const { type } of Object.values(ModelClass.components)) {
                _.get(this).systemsByType.add(type, system);

                for (const component of (_.get(this).componentsByType.get(type) || [])) {
                    addComponentToSystem(component, system);
                }
            }
        }

        this.stage.dispatchEvent(new SystemAddEvent({ system }));
    }

    unregisterSystem(system) {
        const SystemClass = system.constructor;
        for (const { model: ModelClass } of Object.values(SystemClass.models)) {
            for (const { type } of Object.values(ModelClass.components)) {
                _.get(this).systemsByType.delete(type, system);
            }
        }

        this.stage.dispatchEvent(new SystemDeleteEvent({ system }));
    }

    registerComponent(component) {
        component.id = component.id || new UUID();

        const entity = this.ensureEntityExists(component.entity);
        entity.components.add(component, false);

        _.get(this).componentsByType.add(component.type, component);
        _.get(this).entitiesByType.add(component.type, entity);

        for (const system of (_.get(this).systemsByType.get(component.type) || [])) {
            addComponentToSystem(component, system);
        }

        this.stage.dispatchEvent(new ComponentAddEvent({ component }));
        return component;
    }

    unregisterComponent(component) {
        const entity = this.entities.getById(component.entity);
        entity.components.delete(component, false);

        for (const model of entity.models) {
            for (const [key, { type }] of Object.entries(model.constructor.components)) {
                if (type === component.type) {
                    deleteFromProperty(model, key, component);
                }
            }

            model.components.delete(component);

            if (!EntityRegistry.componentsMatchModel(entity.components, model.constructor)) {
                for (const [key, { model: ModelClass }] of Object.entries(model.system.constructor.models)) {
                    if (ModelClass === model.constructor) {
                        deleteFromProperty(model.system, key, model);
                    }
                }

                const system = model.system;

                model.system.models.delete(model);
                entity.models.delete(model);

                system.dispatchEvent(new ModelDeleteEvent({ model }));
            }
        }

        _.get(this).componentsByType.delete(component.type, component);

        // if the entity has no more components of that type remove it from the entity registry group
        if (![...Object.values(entity.components)].find(({ type }) => type === component.type)) {
            _.get(this).entitiesByType.delete(component.type, entity);
        }

        this.stage.dispatchEvent(new ComponentDeleteEvent({ component }));
        return component;
    }

    createEntity(components = {}) {
        const entity = this.ensureEntityExists(new UUID());
        for(const [type, value] of Object.entries(components)) {
            this.stage.components.add({ type, entity: entity.id, id: new UUID(), value });   
        }
        return entity
    }
}

export default EntityRegistry;
