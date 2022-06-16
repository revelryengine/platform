import { UUID   } from './utils/uuid.js';
import { SetMap } from './utils/set-map.js';
import { IdSet  } from './utils/id-set.js';

import { ModelAddEvent, ModelDeleteEvent } from './events/events.js';

class Entity {
    /**
     * Creates an instance of Entity.
     * @param {String|UUID} id
     */
    constructor(id) {
        this.id = id;

        /**
         * A set of all the components for this entity.
         * @type {IdSet<Object>}
         */
        this.components = new IdSet();

        /**
         * A Set of all the {@link EntityModels} for this entity.
         * @type {IdSet<EntityModel>}
         */
        this.models = new IdSet();
    }
}

/**
 * The Registry is responsible for maintaining the relationships between {@link Systems} and {@link Model}s.
 * When components are registered with the Registry, the registry will look for all registered systems that have a matching Model for that component type.
 * A model is considered matching if there are at least one component for all component types defined on the model.
 *
 * @example
 *
 * class FoobarModel extends Model {
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
export class Registry {
    /**
     * Creates an instance of Registry.
     */
    #systemsByType    = new SetMap();
    #componentsByType = new SetMap();
    #entitiesByType   = new SetMap();

    constructor() {

        /**
         * @type {IdSet<Entity>}
         */
        this.entities = new IdSet();
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
                this.#systemsByType.add(type, system);

                for (const component of (this.#componentsByType.get(type) || [])) {
                    this.#addComponentToSystem(system, component);
                }
            }
        }
    }

    unregisterSystem(system) {
        const SystemClass = system.constructor;
        for (const { model: ModelClass } of Object.values(SystemClass.models)) {
            for (const { type } of Object.values(ModelClass.components)) {
                this.#systemsByType.delete(type, system);
            }
        }
    }

    registerComponent(component) {
        component.id = component.id || new UUID();

        const entity = this.ensureEntityExists(component.entity);
        entity.components.add(component, false);

        this.#componentsByType.add(component.type, component);
        this.#entitiesByType.add(component.type, entity);

        for (const system of (this.#systemsByType.get(component.type) || [])) {
            this.#addComponentToSystem(system, component);
        }

        return component;
    }

    unregisterComponent(component) {
        const entity = this.entities.getById(component.entity);
        if(!entity) return false;
        
        for (const system of (this.#systemsByType.get(component.type) || [])) {
            this.#deleteComponentFromSystem(system, component);
        }

        this.#componentsByType.delete(component.type, component);

        // if the entity has no more components of that type remove it from the entity registry group
        if (![...Object.values(entity.components)].find(({ type }) => type === component.type)) {
            this.#entitiesByType.delete(component.type, entity);
        }

        return entity.components.delete(component, false);
    }


    #addModelToSystemProperty(system, key, model) {
        if (system[key] instanceof Set) {
            system[key].add(model);
        } else {
            if (system[key] !== undefined) return;
            system[key] = model;
        }
    }
    
    #deleteModelFromSystemProperty(system, key, model) {
        if (system[key] instanceof Set) {
            system[key].delete(model);
        } else {
            if (system[key] !== model) return;
            delete system[key];
        }
    }
    
    #addComponentToSystem(system, component) {
        const entity = this.entities.getById(component.entity);
        for (const [modelKey, ModelClass] of Registry.matchingSystemModels(system, entity)) {
    
            const id = `${system.constructor.name}:${ModelClass.name}:${entity.id}`;
            let model = entity.models.getById(id);
            if (!model) {
                model = new ModelClass(id, entity);
                entity.models.add(model);
            }
            if(!system.models.has(model)) {
                system.models.add(model);
                this.#addModelToSystemProperty(system, modelKey, model);
    
                system.onModelAdd?.(model);
                system.dispatchEvent(new ModelAddEvent({ model }));
            }
        }
    }
    
    #deleteComponentFromSystem(system, component) {
        const entity = this.entities.getById(component.entity);
    
        for (const [modelKey, ModelClass] of Registry.matchingSystemModels(system, entity)) {
            const id = `${system.constructor.name}:${ModelClass.name}:${entity.id}`;
            let model = entity.models.getById(id);
            if(model.components.has(component.type)) {
                this.#deleteModelFromSystemProperty(system, modelKey, model);
                system.models.delete(model);
                entity.models.delete(model);
    
                system.onModelDelete?.(model);
                system.dispatchEvent(new ModelDeleteEvent({ model }));
    
                //fallback to another entity model if other components of the same type exist?
            }
        }
    }
}

export default Registry;
