import { GameNode         } from './gom/game-node.js';
import { GameNodeChildSet } from './gom/game-node-child-set.js';
import { UUID             } from './utils/uuid.js';
import { IdSet            } from './utils/id-set.js';
import { ClassSet         } from './utils/class-set.js';
import { SetMap           } from './utils/set-map.js';

import { ModelAddEvent, ModelDeleteEvent } from './events/events.js';

class Entity {
    models = new ClassSet();

    components = new IdSet().setRegistrationHandlers({
        register: (component) => {
            component.entity = this.id;
            this.stage.components.add(component);
        },
        unregister: (component) => this.stage.components.delete(component),
    });

    constructor(id, stage) {
        this.id    = id;
        this.stage = stage;
    }
}

/**
 * A stage is a collection of systems and components.
 */
export class Stage extends GameNode {
    #entities         = new IdSet();
    #systemsByType    = new SetMap();
    #componentsByType = new SetMap();
    #entitiesByType   = new SetMap();
    #systemsByModel   = new SetMap();

    /** @type {GameNodeChildSet<System>} */
    children = new GameNodeChildSet(this).setRegistrationHandlers({
        register:   (system) => this.#registerSystem(system), 
        unregister: (system) => this.#unregisterSystem(system),
    });

    /** @type {IdSet<Object>} */
    components = new IdSet().setRegistrationHandlers({
        register:   (component) => this.#registerComponent(component), 
        unregister: (component) => this.#unregisterComponent(component),
    });

    /**
     * 
     */
    createEntity(components = {}, entity = new UUID()) {
        for(const [type, value] of Object.entries(components)) {
            this.components.add({ type, entity, value });   
        }
        return entity;
    }

    /**
     * Spawns the Model by creating all the required components and adding them to the stage.
     *
     * @param {Function} ModelClass
     * @param {Object} [components={}]
     */
    spawn(ModelClass, components = {}) {
        const entity = components.entity ?? new UUID();

        for(const [key, { type }] of Object.entries(ModelClass.components)) {
            const value = components[key];

            if(value === undefined) throw new Error(`Missing component: ${key}`);

            this.components.add({ type, entity, value });   
        }

        return this.#entities.getById(entity).models.getByClass(ModelClass);
    }

    getEntityById(id) {
        return this.#entities.getById(id);
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
     * Finds all the models that this entity has all the components for
     * @param {*} system
     * @param {*} entity
     */
     static * #matchingSystemModels(system, entity) {
        const SystemClass = system.constructor;

        for (const [key, { model: ModelClass }] of Object.entries(SystemClass.models)) {
            if (this.#componentsMatchModel(entity.components, ModelClass)) {
                yield [key, ModelClass];
            }
        }
    }

    static #componentsMatchModel(components, ModelClass) {
        return Object.values(ModelClass.components).every(({ type }) => {
            return [...components.values()].find(component => type === component.type);
        });
    }

    #ensureEntityExists(id) {
        return this.#entities.getById(id) ?? this.#entities.add(new Entity(id, this)).getById(id);
    }

    #registerSystem(system) {
        const SystemClass = system.constructor;

        for (const { model: ModelClass } of Object.values(SystemClass.models)) {
            for (const { type } of Object.values(ModelClass.components)) {
                this.#systemsByType.add(type, system);

                const components = this.#componentsByType.get(type);
                if(components) {
                    for (const component of components) {
                        this.#addComponentToSystem(system, component);
                    }
                }
            }
        }
    }

    #unregisterSystem(system) {
        const SystemClass = system.constructor;
        for (const { model: ModelClass } of Object.values(SystemClass.models)) {
            for (const { type } of Object.values(ModelClass.components)) {
                this.#systemsByType.delete(type, system);
            }
        }
    }

    #registerComponent(component) {
        const entity = this.#ensureEntityExists(component.entity);
        entity.components.add(component, false);

        this.#componentsByType.add(component.type, component);
        this.#entitiesByType.add(component.type, entity);

        const systems = this.#systemsByType.get(component.type);
        if(systems) {
            for (const system of systems) {
                this.#addComponentToSystem(system, component);
            }
        }

        return component;
    }

    #unregisterComponent(component) {
        const entity = this.#entities.getById(component.entity);
        if(entity) {
            const systems = this.#systemsByType.get(component.type);
            if(systems) {
                for (const system of systems) {
                    this.#deleteComponentFromSystem(system, component);
                }
            }
            this.#componentsByType.delete(component.type, component);

            // if the entity has no more components of that type remove it from the entity registry group
            if (![...Object.values(entity.components)].find(({ type }) => type === component.type)) {
                this.#entitiesByType.delete(component.type, entity);
            }

            entity.components.delete(component, false);

            if(!entity.components.size) this.#entities.delete(entity);
        }
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
        const entity = this.#entities.getById(component.entity);
        for (const [key, ModelClass] of Stage.#matchingSystemModels(system, entity)) {
            
            let model = entity.models.getByClass(ModelClass);
            
            if (!model) {
                model = new ModelClass(`${ModelClass.name}:${entity.id}`, entity);
                entity.models.add(model);
            }
            if(!system.models.has(model)) {
                system.models.add(model);
                this.#systemsByModel.add(model, system);
                this.#addModelToSystemProperty(system, key, model);
    
                system.onModelAdd?.(model, key);
                system.dispatchEvent(new ModelAddEvent({ model, key }));
            }
        }
    }
    
    #deleteComponentFromSystem(system, component) {
        const entity = this.#entities.getById(component.entity);
    
        for (const [key, ModelClass] of Stage.#matchingSystemModels(system, entity)) {
            let model = entity.models.getByClass(ModelClass);
            if(model.types.has(component.type)) {
                this.#deleteModelFromSystemProperty(system, key, model);
                system.models.delete(model);
                this.#systemsByModel.delete(model, system);

                if(!this.#systemsByModel.get(model)?.size) entity.models.delete(model);
    
                system.onModelDelete?.(model, key);
                system.dispatchEvent(new ModelDeleteEvent({ model, key }));
    
                //fallback to another entity model if other components of the same type exist?
            }
        }
    }
}

export default Stage;
