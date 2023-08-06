import { GameNode  } from './gom/game-node.js';
import { UUID      } from './utils/uuid.js';
import { IdSet     } from './utils/id-set.js';
import { ClassSet  } from './utils/class-set.js';
import { SetMap    } from './utils/set-map.js';
import { Watchable } from './utils/watchable.js';

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
                        this.#value.watch({ handler: (changes) => this.notify('value:change', changes), signal: this.#abortCtl.signal });
                    }

                    this.notify('value:change', oldvalue);
                } 
            }
        });

        if(Watchable.isWatchable(this.#value)) {
            this.#abortCtl = new AbortController();
            this.#value.watch({ handler: (changes) => this.notify('value:change', changes), signal: this.#abortCtl.signal });
        }
    }

    cleanup() {
        this.#abortCtl?.abort();
    }

    get stage() {
        return this.#stage;
    }
}

/**
 * @extends {IdSet<Omit<ComponentData, 'entityId'>, Component>}
 */
class EntityComponentSet extends IdSet {
    /** @type {Map<string, Component>} */
    #byType = new Map();

    /**
     * @param {Component | Omit<ComponentData, 'entityId'>} item 
     */
    add(item) {
        super.add(item);
        this.#byType.set(item.type, /** @type {Component} */(super.getById(/** @type {string} */(item.id))));
        return this;
    }

    /**
     * @param {Component} item 
     */
    addSilent(item) {
        super.addSilent(item);
        this.#byType.set(item.type, /** @type {Component} */(super.getById(item.id)));
        return this;
    }

    /**
     * @param {Pick<Component, 'id'>} item 
     */
    delete(item) {
        const type = super.getById(item.id)?.type;
        if(!type) return false;
        this.#byType.delete(type);
        return super.delete(item);
    }

    /**
     * @param {Component} item 
     */
    deleteSilent(item) {
        this.#byType.delete(item.type);
        return super.deleteSilent(item);
    }

    /**
     * @param {string} type 
     */
    getByType(type) {
        return this.#byType.get(type);
    }
}

export class Entity {
    models = /** @type {ClassSet<Model>}*/ (new ClassSet());

    components = new EntityComponentSet().setRegistrationHandlers({
        register: (component) => {
            this.stage.components.add({ ...component, entityId: this.id });
            return /** @type {Component} */ (this.stage.components.getById(component.id));
        },
        unregister: (component) => {
            this.stage.components.delete(component);
        },
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
 * A component reference object used to resolve components that may not exist yet.
 */
export class ComponentReference extends Watchable {
    #stage;
    #entityId;
    #type;
    #referenceCounts;

    #abortCtl = new AbortController();

    #aborted   = false;
    #released  = false;
    #destroyed = false;

    /**
     * @type {Component|null}
     */
    #component = null;

    /**
     * 
     * @param {Stage} stage 
     * @param {string} entityId 
     * @param {string} type 
     * @param {{[key: string]: number}} referenceCounts
     */
    constructor(stage, entityId, type, referenceCounts) {
        super();
        this.#stage    = stage;
        this.#entityId = entityId;
        this.#type     = type;

        referenceCounts[this.#entityId] ??= 0;
        referenceCounts[this.#entityId]++;

        referenceCounts[this.#key] ??= 0;
        referenceCounts[this.#key]++;

        this.#referenceCounts = referenceCounts;

        this.#resolve();
    }

    async #resolve() {        
        const entity = this.#stage.getEntityById(this.#entityId);
        const component = entity?.components.getByType(this.#type);

        if(component) {
            this.#component = component;
        } else {
            try {
                this.#component = (await this.#stage.waitFor(`component:add:${this.#key}`, this.#abortCtl.signal))[0].component;
            } catch {
                this.#aborted = true;
                this.notify('abort');

                return;
            }
        }
        this.notify('resolve', this.#component);

        try {
            await this.#stage.waitFor(`component:delete:${this.#key}`, this.#abortCtl.signal);
            this.#destroyed = true;
            this.notify('destroy', this.#component);
        } catch { /* empty */ }
    }

    /**
     * @type {'resolved'|'destroyed'|'released'|'aborted'|'pending'}
     */
    get status() {
        if(this.#aborted)   return 'aborted';
        if(this.#released)  return 'released';
        if(this.#destroyed) return 'destroyed';
        if(this.#component) return 'resolved';
        return 'pending';
    }

    get #key () {
        return `${this.#entityId}:${this.#type}`;
    }

    get stage() {
        return this.#stage;
    }

    get entityId() {
        return this.#entityId;
    }

    get type() {
        return this.#type;
    }

    get component() {
        return this.#component;
    }

    release() {
        this.#abortCtl.abort();

        if(!this.#released) {
            this.#referenceCounts[this.#key]--;
            if(this.#referenceCounts[this.#key] === 0){
                delete this.#referenceCounts[this.#key];
            }

            this.#referenceCounts[this.#entityId]--;
            if(this.#referenceCounts[this.#entityId] === 0){
                delete this.#referenceCounts[this.#entityId];
            }

            this.#released = true;
            this.notify('release');
        }
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
            this.notify('entity:add', { entity });
            this.notify(`entity:add:${id}`, { entity });
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
                this.notify('system:add', { system });

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
                this.notify('system:delete', { system });
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

        this.notify('component:add', { component });
        this.notify(`component:add:${component.entityId}:${component.type}`, { component });

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
            if (!entity.components.getByType(component.type)) {
                this.#entitiesByType.delete(component.type, entity);
            }

            entity.components.deleteSilent(component);

            if(!entity.components.size) {
                this.#entities.delete(entity);
                this.notify('entity:delete', { entity });
                this.notify(`entity:delete:${entity.id}`, { entity });
            }

            this.notify('component:delete', { component });
            this.notify(`component:delete:${component.entityId}:${component.type}`, { component });
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
                    system.notify('model:add', { model, key });
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
                    system.notify('model:delete', { model, key });

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

    /**
     * @type {{[key: string]: number}}
     */
    #referenceCounts = {};

    /**
     * @param {string} entityId 
     * @param {string} type 
     */
    getComponentReference(entityId, type) {
        return new ComponentReference(this, entityId, type, this.#referenceCounts);
    }

    /**
     * 
     * @param {string} entityId 
     * @param {string} type 
     */
    getComponentReferenceCount(entityId, type) {
        return this.#referenceCounts[`${entityId}:${type}`] ?? 0;
    }

    /**
     * 
     * @param {string} entityId 
     */
    getEntityReferenceCount(entityId) {
        return this.#referenceCounts[entityId] ?? 0;
    }
}

export default Stage;
