/// <reference lib="dom" />

import { GameNode  } from './gom/game-node.js';
import { UUID      } from './utils/uuid.js';
import { SetMap    } from './utils/set-map.js';

import { Component, ComponentSet } from './component.js';

class StageComponentSet extends ComponentSet {
    #stage;
    #register;
    #unregister;

    /**
     * @param {Stage} stage
     * @param {{ register: (component: Component) => Component, unregister: (component: Component) => void }} registrationHandlers
     */
    constructor(stage, { register, unregister }) {
        super();
        this.#stage      = stage;
        this.#register   = register;
        this.#unregister = unregister;
    }

    /**
     * @template {Revelry.ECS.ComponentTypeKeys} K
     * @param {Revelry.ECS.ComponentJSON<K> | Revelry.ECS.ComponentData<K>} componentData
     */
    add(componentData) {
        const initializer = this.#stage.initializers[componentData.type];

        if(initializer) {
            componentData.value = initializer(/** @type {Revelry.ECS.ComponentJSON<K>} */(componentData));
        }

        const component = super.add(/** @type {Revelry.ECS.ComponentData<K>} */(componentData));

        this.#register(component);

        return component;
    }

    /**
     * @param {{ entity: string, type: Revelry.ECS.ComponentTypeKeys }} componentData
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
 * @typedef {{ 'system:add': { system: import('./system.js').System }, 'system:delete': { system: import('./system.js').System } }} StageEvents
 */

/**
 * @typedef {Stage & { game: import('./game.js').Game }} ConnectedStage
 */

/**
 * A stage is a collection of systems and components.
 * @extends {GameNode<import('./game.js').Game, import('./system.js').System, StageEvents>}
 */
export class Stage extends GameNode {
    #systemsByType  = new SetMap();
    #systemsByModel = new SetMap();

    /** @type {SetMap<import('./system.js').System, import('./model.js').Model>} */
    #modelsBySystem = new SetMap();

    /** @type {WeakMap<import('./model.js').ModelConstructor, Map<string, import('./model.js').Model>>} */
    #modelsByClass  = new WeakMap();

    /** @type {Revelry.ECS.ComponentInitializers} */
    initializers = {};

    /**@type {StageComponentSet} */
    components = new StageComponentSet(this, {
        register:   (component) => this.#registerComponent(component),
        unregister: (component) => this.#unregisterComponent(component),
    });

    /**
     * @param {{ id?: string, element?: HTMLElement }} [options]
     */
    constructor(options) {
        super(options);

        this.watch('node:add',    { handler: (system) => this.#registerSystem(system)   });
        this.watch('node:delete', { handler: (system) => this.#unregisterSystem(system) });
    }

    /**
     * @param {Partial<Revelry.ECS.ComponentTypeValueMap>} components
     * @param {{ entity?: string, owner?: string }} [options]
     */
    createEntity(components, { entity = UUID(), owner } = {}) {
        for(const [type, value] of Object.entries(components)) {
            this.components.add(/** @type {Revelry.ECS.ComponentJSON} */({ entity, type, value, owner }));
        }
        return entity;
    }

    /**
     * Delete all of the components for an entity. Returns the number of components deleted.
     * @param {string} entity
     */
    deleteEntity(entity) {
        const components = this.components.find({ entity });
        let count = 0;
        for(const component of components) {
            this.components.delete(component);
            count++;
        }

        return count;
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
     * @param {import('./system.js').System} system
     * @param {string} entity
     */
     * #matchingSystemModels(system, entity) {
        for (const [key, { model: ModelClass }] of Object.entries(/** @type {import('./system.js').SystemConstructor}*/ (system.constructor).models)) {
            if (this.#entityMatchesModel(ModelClass, entity)) {
                yield /** @type {const} */ ([key, ModelClass]);
            }
        }
    }

    /**
     * @param {import('./model.js').ModelConstructor} ModelClass
     * @param {string} entity
     */
    #entityMatchesModel(ModelClass, entity) {
        return Object.values(ModelClass.components).every(({ type }) => this.components.find({ entity, type }));
    }

    /**
     * @param {import('./system.js').System} system
     */
    #registerSystem(system) {
        for (const { model: ModelClass } of Object.values(/** @type {import('./system.js').SystemConstructor} */ (system.constructor).models)) {
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
     * @param {import('./system.js').System} system
     */
    #unregisterSystem(system) {
        for (const { model: ModelClass } of Object.values(/** @type {import('./system.js').SystemConstructor}*/ (system.constructor).models)) {
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
     * @param {Component} component
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
     * @param {Component} component
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
     * @param {import('./system.js').System} system
     * @param {string} key
     * @param {import('./model.js').Model} model
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
     * @param {import('./system.js').System} system
     * @param {string} key
     * @param {import('./model.js').Model} model
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
     * @param {import('./model.js').ModelConstructor} ModelClass
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
     * @param {import('./model.js').ModelConstructor} ModelClass
     * @param {string} entity
     */
    #cleanupModel(ModelClass, entity) {
        this.#modelsByClass.get(ModelClass)?.delete(entity);
        if(!this.#modelsByClass.get(ModelClass)?.size) {
            this.#modelsByClass.delete(ModelClass);
        }
    }

    /**
     * @param {import('./system.js').System} system
     * @param {Component} component
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
     * @param {import('./system.js').System} system
     * @param {Component} component
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
     * @template {Revelry.ECS.SystemContextKeys} K
     * @overload
     * @param {K} contextName
     * @return {Revelry.ECS.SystemContexts[K] & { stage: Stage }}
     *
     * @overload
     * @param {string} contextName
     * @return {import('./system.js').System & { stage: Stage }}
     *
     * @param {string} contextName - The name of the context to fetch
     */
    getContext(contextName)  {
        return this.systems.getById(contextName);
    }

    /**
     * @template {import('./model.js').ModelConstructor} M
     * @param {string} entity
     * @param {M} ModelClass
     * @return {InstanceType<M>|undefined}
     */
    getEntityModel(entity, ModelClass) {
        return /** @type {InstanceType<M>} */(this.#modelsByClass.get(ModelClass)?.get(entity));
    }
}
