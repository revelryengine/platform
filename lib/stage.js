import { UUID, SetMap    } from '../deps/utils.js';

import { Component, ComponentSet } from './component.js';
import { Watchable } from './watchable.js';
import { SystemSet } from './system.js';

import { registerSchema } from './schema.js';
import { ComponentReferenceSet } from './reference.js';
import { AssetReferenceSet, registerLoader } from './asset.js';

/**
 * @import { Game                      } from './game.js';
 * @import { System, SystemConstructor } from './system.js';
 * @import { Model, ModelConstructor   } from './model.js';
 * @import { SystemContexts, SystemContextKey, SystemBundle, StageFile } from './ecs.js';
 * @import { ComponentDataMapSerialized, ComponentValueTypeMapSerialized } from './ecs.js';
 */

/**
 * @typedef {{
 *  'system:add':          { system: System },
 *  'system:delete':       { system: System },
 *  'system:registered':   { system: System },
 *  'system:unregistered': { system: System },
 * }} StageEvents
 */

/**
 * A stage is a collection of systems and components.
 * @extends {Watchable<StageEvents>}
 */
export class Stage extends Watchable {
    #systemsByType  = new SetMap();
    #systemsByModel = new SetMap();

    /** @type {SetMap<System, Model>} */
    #modelsBySystem = new SetMap();

    /** @type {WeakMap<ModelConstructor, Map<string, Model>>} */
    #modelsByClass  = new WeakMap();

    /**
     * @readonly
     */
    systems = new SystemSet({
        register:   (system) => this.#registerSystem(system),
        unregister: (system) => this.#unregisterSystem(system),
    });

    /**
     * @readonly
     */
    components = new ComponentSet({
        register:   (component) => this.#registerComponent(component),
        unregister: (component) => this.#unregisterComponent(component),
    });

    /**
     * @readonly
     */
    references = /** @type {const} */({
        components: new ComponentReferenceSet(this),
        assets:     new AssetReferenceSet(this),
    });

    /**
     * @param {Game} game
     * @param {string} id
     */
    constructor(game, id) {
        super();

        /**
         * @readonly
         */
        this.game = game;

        /**
         * @readonly
         */
        this.id = id;

        this.systems.watch('system:add',    ({ system }) => this.notify('system:add',    { system }));
        this.systems.watch('system:delete', ({ system }) => this.notify('system:delete', { system }));
    }


    /**
     * @param {number} deltaTime
     */
    update(deltaTime) {
        for(const system of this.systems) {
            system.update(deltaTime);
        }
    }

    render() {
        for(const system of this.systems) {
            system.render();
        }
    }

    /**
     * @template {SystemConstructor} T
     * @param {T} SystemConstructor
     */
    createSystem(SystemConstructor) {
        const system = new SystemConstructor(this);
        this.systems.add(system);
        return /** @type {InstanceType<T>} */(system);
    }

    /**
     * @template {SystemConstructor} T
     * @param {T} SystemConstructor
     */
    deleteSystem(SystemConstructor) {
        const system = this.systems.getById(SystemConstructor.id);
        if(system) {
            this.systems.delete(system);
            return true;
        }
        return false;
    }

    /**
     * @template {string} K
     * @param {{ type: K } & ComponentDataMapSerialized[K]} componentData
     */
    createComponent(componentData) {
        const component = new Component(this, componentData);
        this.components.add(component);
        return component;
    }

    /**
     * @template {string} K
     * @param {{ type: K, entity: string }} componentData
     */
    deleteComponent(componentData) {
        const component = this.components.find(componentData);
        if(component) {
            this.components.delete(component);
            return true;
        }
        return false;
    }

    /**
     * @param {Partial<ComponentValueTypeMapSerialized>} components
     * @param {{ entity?: string, owner?: string }} [options]
     */
    createEntity(components, { entity = UUID(), owner } = {}) {
        for(const [type, value] of Object.entries(components)) {
            this.createComponent({ entity, type, value, owner });
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
     * Finds all the models that this entity has all the components for
     * @param {System} system
     * @param {string} entity
     */
     * #matchingSystemModels(system, entity) {
        for (const [key, { model: ModelClass }] of Object.entries(/** @type {SystemConstructor}*/ (system.constructor).models)) {
            if (this.#entityMatchesModel(ModelClass, entity)) {
                yield /** @type {const} */ ([key, ModelClass]);
            }
        }
    }

    /**
     * @param {ModelConstructor} ModelClass
     * @param {string} entity
     */
    #entityMatchesModel(ModelClass, entity) {
        return ModelClass.components.every((type) => this.components.find({ entity, type }));
    }

    /**
     * @param {System} system
     */
    #registerSystem(system) {
        for (const { model: ModelClass } of Object.values(/** @type {SystemConstructor} */ (system.constructor).models)) {
            for (const type of ModelClass.components) {
                this.#systemsByType.add(type, system);
                this.notify('system:registered', { system });

                for (const component of this.components.find({ type })) {
                    this.#addComponentToSystem(system, component);
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
            for (const type of ModelClass.components) {
                for (const component of this.components.find({ type })) {
                    this.#deleteComponentFromSystem(system, component);
                }

                this.#systemsByType.delete(type, system);
                this.notify('system:unregistered', { system });
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
    }

    /**
     * @param {System} system
     * @param {string} key
     * @param {Model} model
     */
    #addModelToSystemProperty(system, key, model) {
        const obj = /** @type {any} */ (system.models);

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
        const obj = /** @type {any} */ (system.models);

        if (obj[key] instanceof Set) {
            obj[key].delete(model);
        } else {
            if (obj[key] !== model) return;
            delete obj[key];
        }
    }

    /**
     * @param {ModelConstructor} ModelClass
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
     * @param {ModelConstructor} ModelClass
     * @param {string} entity
     */
    #cleanupModel(ModelClass, entity) {
        this.#modelsByClass.get(ModelClass)?.delete(entity);
        if(!this.#modelsByClass.get(ModelClass)?.size) {
            this.#modelsByClass.delete(ModelClass);
        }
    }

    /**
     * @param {System} system
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
     * @param {System} system
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
                    this.#cleanupModel(ModelClass, component.entity);
                }
            }
        }
    }

    /**
     * @template {SystemContextKey} K
     * @overload
     * @param {K} contextName
     * @return {SystemContexts[K]}
     *
     * @overload
     * @param {string} contextName
     * @return {System}
     *
     * @param {string} contextName - The name of the context to fetch
     */
    getContext(contextName)  {
        const system = this.systems.getById(contextName);
        if(!system) throw new Error(`System with id "${contextName}" not found`);
        return system;
    }

    /**
     * @template {ModelConstructor} M
     * @param {string} entity
     * @param {M} ModelClass
     * @return {InstanceType<M>|undefined}
     */
    getEntityModel(entity, ModelClass) {
        return /** @type {InstanceType<M>} */(this.#modelsByClass.get(ModelClass)?.get(entity));
    }

    /**
    * Fetches all the system bundles and components of stage file.
    * @param {string} src
    * @param {AbortSignal} [signal]
    */
    async loadFile(src, signal) {
        const stageFileURL = import.meta.resolve(src);

        const aborted   = new Promise((_, reject) => signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'abort'))));
        const fetched   = fetch(stageFileURL, { signal }).then(res => res.json());

        const stageFile = /** @type {StageFile} */(await Promise.race([aborted, fetched]));
        const systemModules = await Promise.race([aborted, Promise.all(stageFile.systems.map(system => {
            return /** @type {Promise<{ bundle: SystemBundle }>} */(import(new URL(system, stageFileURL).toString()));
        }))]);

        const unique = /** @type {Set<SystemBundle>} */(new Set());

        for(const { bundle } of systemModules) {

            const search = [bundle];

            while(search.length) {
                const bundle = /** @type {SystemBundle} */(search.shift());
                if(!unique.has(bundle)) {
                    unique.add(bundle);

                    if(bundle.bundles) {
                        search.push(...bundle.bundles);
                    }
                }
            }
        }

        for(const { load, schemas, loaders, systems } of unique) {

            await load?.();

            if(schemas) {
                for(const [type, schema] of Object.entries(schemas)) {
                    registerSchema(type, schema);
                }
            }

            if(loaders) {
                for(const [type, loader] of Object.entries(loaders)) {
                    registerLoader(type, loader);
                }
            }

            if(systems) {
                for(const System of systems) {
                    this.systems.add(new System(this));
                }
            }
        }

        for(const component of stageFile.components) {
            this.createComponent(component);
        }

        return this;
    }
}
