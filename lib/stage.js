import { GameNode  } from './gom/game-node.js';
import { UUID      } from './utils/uuid.js';
import { IdSet     } from './utils/id-set.js';
import { ClassSet  } from './utils/class-set.js';
import { SetMap    } from './utils/set-map.js';
import { Watchable } from './utils/watchable.js';

import { ModelAddEvent, ModelDeleteEvent } from './events/events.js';

/** @typedef {import('./game.js').Game} Game */
/** @typedef {import('./system.js').System} System */
/** @typedef {import('./system.js').SystemConstructor} SystemConstructor */
/** @typedef {import('./model.js').Model} Model */
/** @typedef {import('./model.js').ModelConstructor} ModelConstructor */

/**
 * @typedef  ComponentData
 * @property {string} [id]
 * @property {string} type
 * @property {string} entityId
 * @property {any} value
 */

/** 
 * @typedef {{id: string} & ComponentData} ComponentDataWithId
 */

/**
 * @typedef ComplexComponentData
 * @property {(input: any) => void} set
 * @property {() => any} clone
 * @property {() => object} [toJSON]
 */

/** 
 * An initializer is used to initialize complex component data that can not be serialized directly to/from JSON.
 * When a component is registered, if an initializer is defined for the specified component type the component value is set to the result of `new Initializer(value)`.
 * When a component is serialized the value will be converted to JSON using JSON.stringify. Therefore to control serializing complex data add a toJSON method to the Initializer.
 * 
 * All complex component data should implement set and clone methods to support maintaining component state and references.
 * 
 * For example the following should return the component to the same state:
 * 
 * @example
 * ```js
 * const data = new Initializer();
 * 
 * //save state
 * const state = data.clone();
 * 
 * //undo
 * data.set(state);
 * ```
 * 
 * To register new initializers use stage.initializers.set(type: String, Initializer: Initializer)
 * @typedef {new (input: any, component: Component) => ComplexComponentData} Initializer
 */

export class Component extends Watchable {
    /** @type {Stage} */
    #stage;

    /** @type {any} */
    #value;

    /** @type {any} */
    value;

    /** @type {AbortController|null} */
    #abortCtl = null;
    
    /**
     * @param {Stage} stage
     * @param {ComponentDataWithId} componentData

     * @param {Initializer} [initializer]
     */
    constructor(stage, { id, type, entityId, value }, initializer) {
        super();
        this.id       = id;
        this.type     = type;
        this.entityId = entityId;
        this.#stage   = stage;
        this.#value   = initializer ? new initializer(value, this): value;

        Object.defineProperty(this, 'value', {
            enumerable: true,
            get: () => {
                return this.#value;    
            },
            set: (newValue) => {
                const oldvalue = this.#value;
        
                if(oldvalue !== newValue) {
                    this.#value = newValue;

                    this.#abortCtl?.abort();

                    if(Watchable.isWatchable(this.#value)) {
                        this.#abortCtl ??= new AbortController();
                        this.#value.watch({ handler: (changes) => this.notify('value', changes), signal: this.#abortCtl.signal });
                    }

                    this.notify('value', oldvalue);
                } 
            }
        });

        if(Watchable.isWatchable(this.#value)) {
            this.#abortCtl = new AbortController();
            this.#value.watch({ handler: (changes) => this.notify('value', changes), signal: this.#abortCtl.signal });
        }
    }

    cleanup() {
        this.#abortCtl?.abort();
    }

    get stage() {
        return this.#stage;
    }
}

export class Entity {
    models = /** @type {ClassSet<Model>}*/ (new ClassSet());

    components = /** @type {IdSet<ComponentData, Component>}*/ (new IdSet()).setRegistrationHandlers({
        register: (component) => {
            this.stage.components.add({ ...component, entityId: this.id });
            return /** @type {Component} */ (this.stage.components.getById(component.id));
        },
        unregister: (component) => this.stage.components.delete(component),
    });

    /**
     * @param {string} id
     * @param {Stage} stage
     */
    constructor(id, stage) {
        this.id    = id;
        this.stage = stage;
    } 
}

/**
 * A stage is a collection of systems and components.
 * 
 * @extends {GameNode<Game, System>}
 */
export class Stage extends GameNode {
    #entities         = /** @type {IdSet<Entity, Entity>} */ (new IdSet());
    #systemsByType    = new SetMap();
    #componentsByType = new SetMap();
    #entitiesByType   = new SetMap();
    #systemsByModel   = new SetMap();
    
    initializers = /** @type {Map<String, Initializer>} */(new Map());

    components = /** @type {IdSet<ComponentData,Component>} */ (new IdSet()).setRegistrationHandlers({
        register:   (component) => this.#registerComponent(component), 
        unregister: (component) => this.#unregisterComponent(component)
    });

    constructor() {
        super(...arguments);

        this.children.setRegistrationHandlers({
            register:   (system) => this.#registerSystem(system), 
            unregister: (system) => this.#unregisterSystem(system)
        });
    }

    /**
     * 
     */
    createEntity(components = {}, entityId = UUID()) {
        for(const [type, value] of Object.entries(components)) {
            this.components.add({ type, entityId, value });   
        }
        return entityId;
    }

    /**
     * Spawns the Model by creating all the required components and adding them to the stage.
     *
     * @param {ModelConstructor} ModelClass
     * @param {ComponentData} components
     */
    spawn(ModelClass, components) {
        const entityId = components.entityId ?? UUID();

        for(const [key, { type }] of Object.entries(ModelClass.components)) {
            const value = /** @type {any} */ (components)[key];

            if(value === undefined) throw new Error(`Missing component: ${key}`);

            this.components.add({ type, entityId, value });   
        }

        return this.#entities.getById(entityId)?.models.getByClass(ModelClass);
    }

    /**
     * Returns the entity by id
     * @param {string} id
     */
    getEntityById(id) {
        return this.#entities.getById(id);
    }

    /**
     * Reference to the game which is the stage's parent
     */
    get game() {
        return this.parent;
    }

    /**
     * Reference to stage's systems which are the stage's children.
     */
    get systems() {
        return this.children;
    }

    /**
     * Finds all the models that this entity has all the components for
     * @param {System} system
     * @param {Entity} entity
     */
     static * #matchingSystemModels(system, entity) {
        for (const [key, { model: ModelClass }] of Object.entries(/** @type {SystemConstructor}*/ (system.constructor).models)) {
            if (this.#componentsMatchModel(entity.components, ModelClass)) {
                yield /** @type {const} */ ([key, ModelClass]);
            }
        }
    }

    /**
     * @param {IdSet<ComponentData, Component>} components
     * @param {ModelConstructor} ModelClass
     */
    static #componentsMatchModel(components, ModelClass) {
        return Object.values(ModelClass.components).every(({ type }) => {
            return [...components.values()].find(component => type === component.type);
        });
    }

    /**
     * @param {string} id
     */
    #ensureEntityExists(id) {
        let entity = this.#entities.getById(id);
        if (!entity) {
            entity = new Entity(id, this);
            this.#entities.add(entity);
        }
        return entity;
    }

    /**
     * @param {System} system
     */
    #registerSystem(system) {
        for (const { model: ModelClass } of Object.values(/** @type {SystemConstructor}*/ (system.constructor).models)) {
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
        return system;
    }

    /**
     * @param {System} system
     */
    #unregisterSystem(system) {
        for (const { model: ModelClass } of Object.values(/** @type {SystemConstructor}*/ (system.constructor).models)) {
            for (const { type } of Object.values(ModelClass.components)) {
                this.#systemsByType.delete(type, system);
            }
        }
    }

    /**
     * @param {ComponentDataWithId|Component} componentData
     */
    #registerComponent(componentData) {       
        const component = componentData instanceof Component ? componentData : new Component(this, componentData, this.initializers.get(componentData.type));

        const entity = this.#ensureEntityExists(component.entityId);
        entity.components.addSilent(component);

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

    /**
     * @param {Component} component
     */
    #unregisterComponent(component) {
        const entity = this.#entities.getById(component.entityId);
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

            entity.components.deleteSilent(component);

            if(!entity.components.size) this.#entities.delete(entity);

            component.cleanup();
        }
    }

    /**
     * @param {System} system
     * @param {string} key
     * @param {Model} model
     */
    #addModelToSystemProperty(system, key, model) {
        const obj = /** @type {any} */ (system);

        if (obj[key] instanceof Set) {
            obj[key].add(model);
        } else {
            if (obj[key] !== undefined) return;
            obj[key] = model;
        }
    }
    
    /**
     * @param {System} system
     * @param {string} key
     * @param {Model} model
     */
    #deleteModelFromSystemProperty(system, key, model) {
        const obj = /** @type {any} */ (system);

        if (obj[key] instanceof Set) {
            obj[key].delete(model);
        } else {
            if (obj[key] !== model) return;
            delete obj[key];
        }
    }
    
    /**
     * @param {System} system
     * @param {Component} component
     */
    #addComponentToSystem(system, component) {
        const entity = this.#entities.getById(component.entityId);
        if(entity) {
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
        
                    system.onModelAdd(model, key);
                    system.dispatchEvent(new ModelAddEvent({ model, key }));
                }
            }
        }
    }
    
    /**
     * @param {System} system
     * @param {Component} component
     */
    #deleteComponentFromSystem(system, component) {
        const entity = this.#entities.getById(component.entityId);
        if(entity) {
            for (const [key, ModelClass] of Stage.#matchingSystemModels(system, entity)) {
                const model = entity.models.getByClass(ModelClass);
                if(model && model.types.has(component.type)) {
                    this.#deleteModelFromSystemProperty(system, key, model);
                    system.models.delete(model);
                    this.#systemsByModel.delete(model, system);
    
                    system.onModelDelete(model, key);
                    system.dispatchEvent(new ModelDeleteEvent({ model, key }));

                    if(!this.#systemsByModel.get(model)?.size) {
                        entity.models.delete(model);
                        model.cleanup();
                    }
                    //fallback to another entity model if other components of the same type exist?
                }
            }
        }
    }

    /**
     * @param {string} contextName - The name of the context to fetch
     */
    getContext(contextName)  {
        return this.systems.getById(contextName);
    }
}

export default Stage;
