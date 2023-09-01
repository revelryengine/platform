import { GameNode  } from './gom/game-node.js';
import { UUID      } from './utils/uuid.js';
import { IdSet     } from './utils/id-set.js';
import { ClassSet  } from './utils/class-set.js';
import { SetMap    } from './utils/set-map.js';
import { Watchable } from './utils/watchable.js';

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
 * @extends IdSet<Component<T>>
 */
class StageComponentSet extends IdSet {
    #register;
    #unregister;
    
    /**
     * 
     * @param {{ register: (data: ComponentData<T>) => Component<T>, unregister: (component: Component<T>) => void }} registrationHandlers 
     */
    constructor({ register, unregister }) {
        super();
        this.#register   = register;
        this.#unregister = unregister;
    }

    /**
     * @param {ComponentDataAnon<T>|ComponentData<T>|Component<T>} component
     * @return {asserts component is ComponentData<T>}
     */
    deanonomize(component) {
        if(component instanceof Component) return;
        
        component.id ??= UUID();
        component.entityId ??= UUID();
    }


    /**
     * @param {ComponentDataAnon<T>|ComponentData<T>|Component<T>} component
     */
    add(component) {
        this.deanonomize(component);
        
        const registered = this.#register(component);
        return super.add(registered);
    }

    /**
     * @param {{ id: string }} component
     */
    delete(component) {
        const id = component.id;
        const registered = this.getById(id);

        if(registered) {
            this.#unregister(registered);
            return super.delete(registered);
        }
        return false;
    }
}

/**
 * @template {ComponentTypesDefinition} [T = ComponentTypesDefinition]
 * @extends IdSet<Component<T>>
 */
class EntityComponentSet extends IdSet {
    #byType = /** @type {{[K in Extract<keyof T, string>]?: Component<T, K>}} */({});

    #entityId;
    #stage;
    /**
     * @param {Entity<T>} entity
     */
    constructor({ id, stage }) {
        super();

        this.#entityId = id;
        this.#stage = stage;
    }

    /**
     * @param {ComponentDataAnon<T>|Component<T>} component
     * @return {asserts component is ComponentData<T>}
     */
    deanonomize(component) {
        if(component instanceof Component) {
            if(component.entityId !== this.#entityId) throw new Error('Component registered to another entity');
            return;
        }

        component.id ??= UUID();
        component.entityId = this.#entityId;
    }

    /**
     * @param {ComponentDataAnon<T>|Component<T>} component 
     */
    add(component) {
        this.deanonomize(component);

        this.#stage.components.add(component);
        const registered = /** @type {Component<T>} */(this.#stage.components.getById(/** @type {ComponentData<T>} */(component).id));

        this.#byType[component.type] = registered;
        return super.add(registered);
    }

    /**
     * @param {{ id: string }} component 
     */
    delete(component) {
        const registered = super.getById(component.id);
        if(!registered) return false;
        this.#stage.components.delete(registered)
        delete this.#byType[registered.type];
        return super.delete(registered);
    }

    /**
     * @param {Component<T>} component
     */
    addSilent(component) {
        this.#byType[component.type] = component;
        return super.add(component);
    }

    /**
     * @param {Component<T>} component
     */
    deleteSilent(component) {
        delete this.#byType[component.type];
        return super.delete(component);
    }

    /**
     * @param {Extract<keyof T, string>} type 
     */
    getByType(type) {
        return this.#byType[type];
    }
}

/**
 * @template {ComponentTypesDefinition} [T = ComponentTypesDefinition]
 * @template {Extract<keyof T, string>} [K = Extract<keyof T, string>]
 * @extends {Watchable<{'value:change': ComponentTypeMap<T>[K]['complex'], 'value:notify': Map<string, unknown> }>}
 */
export class Component extends Watchable {
    #id;
    #entityId;
    #type;

    /** @type {ComponentTypeMap<T>[K]['complex']} */
    #value;

    /** @type {Stage<T>} */
    #stage;

    /** @type {AbortController|null} */
    #abortCtl = null;
    
    /**
     * @param {Stage<T>} stage
     * @param {ComponentDataMap<T>[K]} componentData
     */
    constructor(stage, componentData) {
        super();
        const { id, entityId, type, value } = componentData;

        this.#id       = id;
        this.#entityId = entityId;
        this.#type     = type;
        this.#value    = stage.initializers[type]?.(componentData) ?? value;
        this.#stage    = stage;
        
        if(Watchable.isWatchable(this.#value)) {
            this.#abortCtl = new AbortController();
            this.#value.watch({ handler: (events) => this.notify('value:notify', events), signal: this.#abortCtl.signal });
        }
    }

    get id() {
        return this.#id;
    }

    get entityId() {
        return this.#entityId;
    }

    get type() {
        return this.#type;
    }

    get value() {
        return this.#value;
    }

    set value(newValue) {
        const oldValue = this.#value;
        
        if(oldValue !== newValue) {
            this.#value = newValue;

            this.notify('value:change', oldValue);

            this.#abortCtl?.abort();

            if(Watchable.isWatchable(this.#value)) {
                this.#abortCtl ??= new AbortController();
                this.#value.watch({ handler: (events) => this.notify('value:notify', events), signal: this.#abortCtl.signal });
            }
        } 
    }

    get stage() {
        return this.#stage;
    }

    cleanup() {
        this.#abortCtl?.abort();
    }

    toJSON() {
        return { id: this.#id, entityId: this.#entityId, type: this.#type, value: this.getJSONValue() };
    }

    /**
     * @return {ComponentTypeMap<T>[K]['value']}
     */
    getJSONValue () {
        return /** @type {{ toJSON?: () => ComponentTypeMap<T>[K]['value'] }} */(this.value).toJSON?.() ?? this.value;
    }
}


/**
 * @template {ComponentTypesDefinition} [T = ComponentTypesDefinition]
 */
export class Entity {
    /**
     * @param {string} id
     * @param {Stage<T>} stage
     */
    constructor(id, stage) {
        this.id    = id;
        this.stage = stage;

        this.models     = /** @type {ClassSet<Model<T>>}*/ (new ClassSet());
        this.components = /** @type {EntityComponentSet<T>} */(new EntityComponentSet(this));
    } 
}

/**
 * A component reference object used to resolve components that may not exist yet.
 * 
 * @template {ComponentTypesDefinition} [T = ComponentTypesDefinition]
 * @template {Extract<keyof T, string>} [K = Extract<keyof T, string>]
 * @extends {Watchable<{ abort: void, release: void, resolve: Component<T, K>, destroy: Component<T, K> }>}
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
     * @type {Component<T, K>|null}
     */
    #component = null;

    /**
     * 
     * @param {Stage<T>} stage 
     * @param {string} entityId 
     * @param {Extract<keyof T, string>} type 
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
        const component = /** @type {Component<T, K>} */(entity?.components.getByType(this.#type));

        if(component) {
            this.#component = component;
        } else {
            try {
                this.#component = /** @type {Component<T, K>} */((await this.#stage.waitFor(`component:add:${this.#key}`, this.#abortCtl.signal)).component);
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
 * @template {ComponentTypesDefinition} T
 * @typedef {{ 'system:add': { system: System<T> }, 'system:delete': { system: System<T> } }} SystemEvents */

/** 
 * @template {ComponentTypesDefinition} T
 * @typedef {{ 
 *     'entity:add': { entity: Entity<T> }, 
 *     'entity:delete': { entity: Entity<T> }, 
 *     [key: `entity:add:${string}`]: { entity: Entity<T> }, 
 *     [key: `entity:delete:${string}`]: { entity: Entity<T> },
 * }} EntityEvents
 */
/** 
 * @template {ComponentTypesDefinition} T
 * @typedef {{ 
 *    'component:add': { component: Component<T> }, 
 *    'component:delete': { component: Component<T> }, 
 *    [key: `component:add:${string}`]: { component: Component<T> }, 
 *    [key: `component:delete:${string}`]: { component: Component<T> },
 * }} ComponentEvents
 */

/** 
 * @typedef {{ 
*    [key: `reference:create:${string}`]: number, 
*    [key: `reference:create:${string}:${string}`]: number,
*    [key: `reference:release:${string}`]: number, 
*    [key: `reference:release:${string}:${string}`]: number,
* }} ReferenceEvents
*/

/**
 * A stage is a collection of systems and components.
 * @template {ComponentTypesDefinition} [T = ComponentTypesDefinition]
 * @extends {GameNode<import('./game.js').Game, System<T>, SystemEvents<T> & EntityEvents<T> & ComponentEvents<T> & ReferenceEvents>}
 */
export class Stage extends GameNode {
    #entities         = /** @type {IdSet<Entity<T>>} */ (new IdSet());
    #systemsByType    = new SetMap();
    #componentsByType = new SetMap();
    #systemsByModel   = new SetMap();
    
    /** @type {ComponentInitializers<T>} */
    initializers = {};

    /**@type {StageComponentSet<T>} */
    components = new StageComponentSet({
        register:   (component) => this.#registerComponent(component), 
        unregister: (component) => this.#unregisterComponent(component),
    });

    constructor() {
        super(...arguments);
        this.watch('node:add',    { immediate: true, handler: (system) => this.#registerSystem(system)   });
        this.watch('node:delete', { immediate: true, handler: (system) => this.#unregisterSystem(system) });
    }

    /**
     * @param {Partial<ComponentTypeValueMap<T>>} components
     * @param {string} [entityId=UUID()]
     */
    createEntity(components, entityId = UUID()) {
        for(const [type, value] of Object.entries(components)) {
            this.components.add(/** @type {ComponentData<T>} */({ id: UUID(), entityId, type, value }));   
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
     * @param {System<T>} system
     * @param {Entity<T>} entity
     */
     * #matchingSystemModels(system, entity) {
        for (const [key, { model: ModelClass }] of Object.entries(/** @type {SystemConstructor<T>}*/ (system.constructor).models)) {
            if (this.#componentsMatchModel(entity.components, ModelClass)) {
                yield /** @type {const} */ ([key, ModelClass]);
            }
        }
    }

    /**
     * @param {EntityComponentSet<T>} components
     * @param {ModelConstructor<T>} ModelClass
     */
    #componentsMatchModel(components, ModelClass) {
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
            entity = /** @type {Entity<T>} */ (new Entity(id, this));
            this.#entities.add(entity);
            this.notify('entity:add', { entity });
            this.notify(`entity:add:${id}`, { entity });
        }
        return entity;
    }

    /**
     * @param {System<T>} system
     */
    #registerSystem(system) {
        for (const { model: ModelClass } of Object.values(/** @type {SystemConstructor<T>} */ (system.constructor).models)) {
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
     * @param {System<T>} system
     */
    #unregisterSystem(system) {
        for (const { model: ModelClass } of Object.values(/** @type {SystemConstructor<T>}*/ (system.constructor).models)) {
            for (const { type } of Object.values(ModelClass.components)) {
                this.#systemsByType.delete(type, system);
                this.notify('system:delete', { system });
            }
        }
    }

    /**
     * @param {ComponentData<T>} componentData
     */
    #registerComponent(componentData) {
        const component = componentData instanceof Component ? componentData : /** @type {Component<T>} */(new Component(this, componentData));

        const entity = this.#ensureEntityExists(component.entityId);
        entity.components.addSilent(component);

        this.#componentsByType.add(component.type, component);

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
     * @param {Component<T>} component
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
     * @param {System<T>} system
     * @param {Component<T>} component
     */
    #addComponentToSystem(system, component) {
        const entity = this.#entities.getById(component.entityId);
        if(entity) {
            for (const [key, ModelClass] of this.#matchingSystemModels(system, entity)) {
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
     * @param {System<T>} system
     * @param {Component<T>} component
     */
    #deleteComponentFromSystem(system, component) {
        const entity = this.#entities.getById(component.entityId);
        if(entity) {
            for (const [key, ModelClass] of this.#matchingSystemModels(system, entity)) {
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
     * @template {Extract<keyof T, string>} K
     * @param {string} entityId 
     * @param {K} type 
     */
    getComponentReference(entityId, type) {
        const ref = /** @type {ComponentReference<T, K>} */(new ComponentReference(this, entityId, type, this.#referenceCounts));

        this.notify(`reference:create:${entityId}`, this.#referenceCounts[entityId]);
        this.notify(`reference:create:${entityId}:${type}`, this.#referenceCounts[`${entityId}:${type}`]);

        ref.waitFor('release').then(() => {
            this.notify(`reference:release:${entityId}`, this.#referenceCounts[entityId]);
            this.notify(`reference:release:${entityId}:${type}`, this.#referenceCounts[`${entityId}:${type}`]);
        });

        return ref;
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



/**
 * @typedef {Record<string, { value: unknown, complex?: unknown }>} ComponentTypesDefinition
 */

/**
 * @template {ComponentTypesDefinition} T
 * @typedef {{
 *    [K in Extract<keyof T, string>]: { value: T[K]['value'], complex: T[K] extends { complex: unknown } ? T[K]['complex']: T[K]['value'] }
 * }} ComponentTypeMap
 */

/**
 * @template {ComponentTypesDefinition} T
 * @typedef {{
 *      [K in keyof ComponentTypeMap<T>]: ComponentTypeMap<T>[K]['value'] | ComponentTypeMap<T>[K]['complex']
 * }} ComponentTypeValueMap
 */

/**
 * @template {ComponentTypesDefinition} T
 * @typedef {{
 *  [K in Extract<keyof T, string>]: {
 *       id:       string; 
 *       entityId: string;
 *       type:     K;
 *       value:    ComponentTypeMap<T>[K]['value'] | ComponentTypeMap<T>[K]['complex'];
 *  }}} ComponentDataMap
 */

/**
 * @template {ComponentTypesDefinition} T
 * @typedef {{
 *  [K in Extract<keyof T, string>]: {
 *       id?:       string, 
 *       entityId?: string,
 *       type:      K;
 *       value:     ComponentTypeMap<T>[K]['value'] | ComponentTypeMap<T>[K]['complex'];
 *  }}} ComponentDataMapAnon
 */

/**
 * @template {ComponentTypesDefinition} T
 * @template {Extract<keyof T, string>} [K = Extract<keyof T, string>]
 * @typedef {ComponentDataMap<T>[K]} ComponentData
 */

/**
 * @template {ComponentTypesDefinition} T
 * @template {Extract<keyof T, string>} [K = Extract<keyof T, string>]
 * @typedef {ComponentDataMapAnon<T>[K]} ComponentDataAnon
 */

/** 
 * An initializer is used to initialize complex component data that can not be serialized directly to/from JSON.
 * When a component is registered, if an initializer is defined for the specified component type the component value is set to the result of `new Initializer(value)`.
 * When a component is serialized the value will be converted to JSON using JSON.stringify. Therefore to control serializing complex data add a toJSON method to the Initializer.
 * 
 * All complex component data should implement set and toJSON methods to support maintaining component state.
 * 
 * For example the following should return the component to the same state:
 * 
 * @example
 * ```js
 * const data = new ComponentInitializer();
 * 
 * //save state
 * const state = data.toJSON();
 * 
 * //undo
 * data.set(state);
 * ```
 * 
 * To register new initializers add them to the stage.initializers
 * ```
 * stage.initializers[keyof ComponentTypesDefinition] = (component: ComponentData) => ComplexComponentValue
 * ```
 * 
 * @template {ComponentTypesDefinition} T
 * @typedef {Partial<{
 *     [K in Extract<keyof T, string>]: (c: ComponentDataMap<T>[K]) => ComponentTypeMap<T>[K]['complex'];
 * }>}  ComponentInitializers
 */

/**
 * @typedef {{
 *     set(value: unknown): void;
 *     toJSON(): Record<string, unknown>;
 * }} ComplexComponentValue
 */

export default Stage;
