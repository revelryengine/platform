import { GameNode  } from './gom/game-node.js';
import { UUID      } from './utils/uuid.js';
import { SetMap    } from './utils/set-map.js';

import { Component, ComponentSet } from './component.js';
import Model from './model.js';

/** 
 * @typedef {import('./component.js').ComponentTypesDefinition} ComponentTypesDefinition
 */

/** 
 * @template {ComponentTypesDefinition} T
 * @typedef {import('./component.js').ComponentJSON<T>} ComponentDataJSON
 */

/** 
 * @template {ComponentTypesDefinition} T
 * @typedef {import('./component.js').ComponentInitializers<T>} ComponentInitializers
 */

/** 
 * @template {ComponentTypesDefinition} T
 * @typedef {import('./component.js').ComponentTypeValueMap<T>} ComponentTypeValueMap
 */

/**
 * @template {ComponentTypesDefinition} T
 * @typedef {import('./system.js').System<T, any>} System
 */

/**
 * @template {ComponentTypesDefinition} T
 * @typedef {import('./model.js').Model<T, any>} Model
 */

/**
 * @template {ComponentTypesDefinition} T
 * @typedef {import('./system.js').SystemConstructor<T>} SystemConstructor
 */

/**
 * @template {ComponentTypesDefinition} T
 * @typedef {import('./model.js').ModelConstructor<T>} ModelConstructor
 */

/**
 * @template {ComponentTypesDefinition} [T = ComponentTypesDefinition]
 * @extends ComponentSet<T>
 */
class StageComponentSet extends ComponentSet {
    #stage;
    #register;
    #unregister;
    
    /**
     * @param {Stage<T>} stage
     * @param {{ register: (component: Component<T, any>) => Component<T>, unregister: (component: Component<T, any>) => void }} registrationHandlers 
     */
    constructor(stage, { register, unregister }) {
        super();
        this.#stage      = stage;
        this.#register   = register;
        this.#unregister = unregister;
    }

    /**
     * @param {ComponentDataJSON<T>} componentData
     */
    add(componentData) {
        const initializer = this.#stage.initializers[componentData.type];

        if(initializer) {
            componentData.value = initializer(componentData);
        }

        const component = super.add(new Component(componentData));

        this.#register(component);

        return component;
    }

    /**
     * @param {{ entity: string, type: Extract<keyof T, string> }} componentData
     */
    delete(componentData) {
        const component = this.find(componentData);

        if(!component) return false;

        this.#unregister(component);

        super.delete(component);
        
        return true;
    }
}


/** 
 * @template {ComponentTypesDefinition} T
 * @typedef {{ 'system:add': { system: System<T> }, 'system:delete': { system: System<T> } }} SystemEvents */


/**
 * A stage is a collection of systems and components.
 * @template {ComponentTypesDefinition} [T = ComponentTypesDefinition]
 * @extends {GameNode<import('./game.js').Game, System<T>, SystemEvents<T>>}
 */
export class Stage extends GameNode {
    #systemsByType  = new SetMap();
    #systemsByModel = new SetMap();

    /** @type {SetMap<System<T>, Model<T>>} */
    #modelsBySystem = new SetMap();

    /** @type {WeakMap<ModelConstructor<T>, Map<string, Model<T>>>} */
    #modelsByClass  = new WeakMap();
    
    /** @type {ComponentInitializers<T>} */
    initializers = {};

    /**@type {StageComponentSet<T>} */
    components = new StageComponentSet(this, {
        register:   (component) => this.#registerComponent(component), 
        unregister: (component) => this.#unregisterComponent(component),
    });

    constructor() {
        super(...arguments);

        this.watch('node:add',    { handler: (system) => this.#registerSystem(system)   });
        this.watch('node:delete', { handler: (system) => this.#unregisterSystem(system) });
    }

    /**
     * @param {Partial<ComponentTypeValueMap<T>>} components
     * @param {string} [entity=UUID()]
     */
    createEntity(components, entity = UUID()) {
        for(const [type, value] of Object.entries(components)) {
            this.components.add(/** @type {ComponentDataJSON<T>} */({ entity, type, value }));   
        }
        return entity;
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
     * @param {System<T>} system
     * @param {string} entity
     */
     * #matchingSystemModels(system, entity) {
        for (const [key, { model: ModelClass }] of Object.entries(/** @type {SystemConstructor<T>}*/ (system.constructor).models)) {
            if (this.#entityMatchesModel(ModelClass, entity)) {
                yield /** @type {const} */ ([key, ModelClass]);
            }
        }
    }

    /**
     * @param {ModelConstructor<T>} ModelClass
     * @param {string} entity
     */
    #entityMatchesModel(ModelClass, entity) {
        return Object.values(ModelClass.components).every(({ type }) => this.components.find({ entity, type }));
    }

    /**
     * @param {System<T>} system
     */
    #registerSystem(system) {
        for (const { model: ModelClass } of Object.values(/** @type {SystemConstructor<T>} */ (system.constructor).models)) {
            for (const { type } of Object.values(ModelClass.components)) {
                this.#systemsByType.add(type, system);
                this.notify('system:add', { system });

                for (const component of this.components.find({ type })) {
                    this.#addComponentToSystem(system, component);
                }
            }
        }
        
        return system;
    }

    /**
     * @param {System<T>} system
     */
    #unregisterSystem(system) {
        for (const { model: ModelClass } of Object.values(/** @type {SystemConstructor<T>}*/ (system.constructor).models)) {
            for (const { type } of Object.values(ModelClass.components)) { 
                for (const component of this.components.find({ type })) {
                    this.#deleteComponentFromSystem(system, component);
                }

                this.#systemsByType.delete(type, system);
                this.notify('system:delete', { system });
            }
        }
    }

    /**
     * @param {Component<T>} component
     */
    #registerComponent(component) {
        const systems = this.#systemsByType.get(component.type);
        if(systems) {
            for (const system of systems) {
                this.#addComponentToSystem(system, component);
            }
        }

        return component;
    }

    /**
     * @param {Component<T>} component
     */
    #unregisterComponent(component) {
        const systems = this.#systemsByType.get(component.type);
        if(systems) {
            for (const system of systems) {
                this.#deleteComponentFromSystem(system, component);
            }
        }

        component.cleanup();
    }

    /**
     * @param {System<T>} system
     * @param {string} key
     * @param {Model<T>} model
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
     * @param {System<T>} system
     * @param {string} key
     * @param {Model<T>} model
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
     * @param {ModelConstructor<T>} ModelClass
     * @param {string} entity
     */
    #ensureModelExists(ModelClass, entity) {
        let models = this.#modelsByClass.get(ModelClass);
        if(!models) {
            models = new Map();
            this.#modelsByClass.set(ModelClass, models);
        }

        let model = models.get(entity);
        if(!model) {
            model = new ModelClass(this, entity);
            models.set(entity, model)
        }

        return model;
    }

    /**
     * @param {ModelConstructor<T>} ModelClass
     * @param {string} entity
     */
    #cleanupModel(ModelClass, entity) {
        this.#modelsByClass.get(ModelClass)?.delete(entity);
        if(!this.#modelsByClass.get(ModelClass)?.size) {
            this.#modelsByClass.delete(ModelClass);
        }
    }
    
    /**
     * @param {System<T>} system
     * @param {Component<T>} component
     */
    #addComponentToSystem(system, component) {
        for (const [key, ModelClass] of this.#matchingSystemModels(system, component.entity)) {

            const model = this.#ensureModelExists(ModelClass, component.entity);
            
            if(!this.#modelsBySystem.get(system)?.has(model)) {
                this.#modelsBySystem.add(system, model);
                this.#systemsByModel.add(model, system);
                this.#addModelToSystemProperty(system, key, model);
    
                system.onModelAdd(model, key);
                system.notify('model:add', { model, key });
            }
        }
    }
    
    /**
     * @param {System<T>} system
     * @param {Component<T>} component
     */
    #deleteComponentFromSystem(system, component) {
        for (const [key, ModelClass] of this.#matchingSystemModels(system, component.entity)) {

            const model = this.#modelsByClass.get(ModelClass)?.get(component.entity);

            if(model && model.types.has(component.type)) {
                this.#deleteModelFromSystemProperty(system, key, model);
                this.#modelsBySystem.delete(system, model);
                this.#systemsByModel.delete(model, system);

                system.onModelDelete(model, key);
                system.notify('model:delete', { model, key });

                if(!this.#systemsByModel.get(model)?.size) {
                    model.cleanup();
                    this.#cleanupModel(ModelClass, component.entity);
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

    /**
     * @template {import('./model.js').ModelConstructor<T>} M
     * @param {string} entity
     * @param {M} ModelClass
     * @return {InstanceType<M>|undefined}
     */
    getEntityModel(entity, ModelClass) {
        return /** @type {InstanceType<M>} */(this.#modelsByClass.get(ModelClass)?.get(entity));
    }
}

export default Stage;
