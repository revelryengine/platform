
import { System    } from 'revelryengine/ecs/lib/system.js';
import { Model     } from 'revelryengine/ecs/lib/model.js';
import { UUID      } from 'revelryengine/ecs/lib/utils/uuid.js';
import { Asset     } from './asset.js';
import { merge     } from './utils/merge.js';
import { Component } from 'revelryengine/ecs/lib/stage.js';



/**
 * @typedef {{  
 *     prefab: { value: { path: string, references: References, overrides: Overrides }, complex: PrefabAsset },
 * } & import('./game-object.js').ComponentTypes } ComponentTypes
 */

const types = /** @type {ComponentTypes} */({});
const TypedModel  = Model.Typed(types);
const TypedSystem = System.Typed(types);

/**
 * @template {Extract<keyof ComponentTypes, string>} [K = Extract<keyof ComponentTypes, string>]
 * @typedef {import('revelryengine/ecs/lib/stage.js').ComponentData<ComponentTypes, K>} ComponentData
 */

/**
 * @typedef {Record<string, string>} References
 * @typedef {Record<string, unknown>} Overrides
 */

/**
 * @typedef {{ path: string, references: References, overrides: Overrides }} PrefabAssetValue
 */

/**
 * @typedef {{
 *     meta: { name: string, description: string};
 *     components:          ComponentData<any>[];
 *     componentsById:      Record<string, ComponentData<any>>;
 *     entityRegExp:        RegExp;
 *     componentsWithReference: Set<string>
 * }} PrefabAssetData
 */

/**
 * @typedef {{
 *     components:     ComponentData<any>[];
 *     references: {
 *         entities:   References;
 *         components: References;
 *         reverse: {
 *           entities:   References;
 *           components: References;
 *         },
 *     },     
 * }} PrefabAssetInstance
 */

const isObject      = (/** @type {object} */ o) => o != null && typeof o === 'object';
const isEmptyObject = (/** @type {object} */ o) => isObject(o) && (Object.keys(o).length === 0);

/**
 * Modified from https://github.com/mattphillips/deep-object-diff
 * We only need to find additions and changes to the object and not deletions so we can simplify a bit.
 * Empty objects are stripped and treated as no change, as are undefined values.
 * null should be used to unset a value via override.
 * 
 * @param {any} a - Object to compare against
 * @param {any} b 
 * @returns {object}
 */
function diff(a, b) {
    if (a === b || b === undefined) return {};

    if (!isObject(a) || !isObject(b)) return b;

    const result = Object.create(null);

    for(const key of Object.keys(b)) {
        if(isEmptyObject(b[key])) continue;

        const d = diff(Object.hasOwn(a, key) ? a[key] : Object.create(null), b[key]);

        if (!isEmptyObject(d)) {
            result[key] = d;
        }
    }

    return result;
}

/**
 * @extends {Asset<PrefabAssetData, PrefabAssetInstance>}
 */
export class PrefabAsset extends Asset {
    #entityId;
    #refererPath;
    
    /**
     * @param {PrefabAssetValue | PrefabAsset} value
     * @param {{ entityId: string ; }} component
     * @param {string[]} [refererPath]
     */
    constructor(value, component, refererPath) {
        if(value instanceof PrefabAsset) return value;

        super(value);
        this.#entityId    = component.entityId;
        this.#refererPath = refererPath;

        this.references = value.references;
        this.overrides  = value.overrides;
    }

    get entityId() {
        return this.#entityId;
    }

    get refererPath() {
        return this.#refererPath;
    }

    /**
     * 
     * @param {PrefabAssetValue} value 
     */
    set({ path, references, overrides }) {
        super.set({ path });

        this.references = references;
        this.overrides  = overrides;
    }

    /**
     * @param {AbortSignal} [signal] 
     * @return {Promise<PrefabAssetData>}
     */
    async load(signal) {
        const data = /** @type {PrefabAssetData} */(await super.fetch(signal).then(res => res.json()));

        const entityIds = new Set();

        for(const component of data.components) {
            entityIds.add(component.entityId);
        }

        data.entityRegExp   = new RegExp(`(${[...entityIds].join('|')})`);
        data.componentsById = {};
        data.componentsWithReference = new Set();

        for(const component of data.components) {
            data.componentsById[component.id] = component;
            if(JSON.stringify(component.value).match(data.entityRegExp)) {
                data.componentsWithReference.add(component.id);
            }
        }

        return data;
    }

    async createInstance() {
        if(this.#refererPath?.includes(this.path)) {
            console.warn('Prefab recursion detected', this.path, this.#refererPath);
            throw new Error('Prefab recursion');
        }

        if(!this.data) {
            console.warn('Data not loaded');
            throw new Error('Data not loaded');
        }

        const instance = /** @type {PrefabAssetInstance} */({
            components:     [],
            references: {
                components: {},
                entities:   {},
                reverse: {
                    components: {},
                    entities:   {},
                }
            }
        });

        for(const component of this.data.components) {
            const entityId = instance.references.reverse.entities[component.entityId] ??= this.references?.[component.entityId] ?? UUID();
            const id       = instance.references.reverse.components[component.id] = this.references?.[component.id] ?? UUID();

            instance.references.entities[entityId] = component.entityId;
            instance.references.components[id] = component.id;

            const { type, value } = component;
            
            instance.components.push({ id, entityId, type, value: structuredClone(value) });
        }

        for(const component of instance.components) {
            const refId = instance.references.components[component.id];

            if(this.data.componentsWithReference.has(refId)) {
                component.value = JSON.parse(JSON.stringify(component.value).replace(this.data.entityRegExp, (match) => instance.references.reverse.entities[match]));
            }

            const override = this.overrides?.[refId];
            if(override !== undefined) {
                if(typeof override === 'object' && typeof component.value === 'object') {
                    merge(component.value, override);
                } else {
                    component.value = structuredClone(override);
                }
            }
            
            if(component.type === 'prefab') {
                const prefab = new PrefabAsset(component.value, component, [...this.#refererPath ?? [], this.path]);

                await prefab.loaded;

                component.value = prefab;
            }

            if(component.type === 'meta') {
                component.value.parent ??= this.#entityId;
            }
        }

        return instance;
    }

    toJSON() {
        return { path: this.path, references: this.references, overrides: this.overrides };
    }

    clone() {
        return this.toJSON();
    }

    /**
     * @param {string} componentId 
     */
    getOriginalValue(componentId) {
        if(!this.data || !this.instance) throw new Error('Instance not loaded');

        const refId     = this.instance.references.components[componentId];
        const component = this.data.componentsById[refId];

        if(this.data.componentsWithReference.has(refId)){
            const references = this.instance.references;
            return JSON.parse(JSON.stringify(component.value).replace(this.data.entityRegExp, (match) => references.reverse.entities[match]))
        }   

        if(component.type === 'meta') {
            return { parent: this.#entityId, ...component.value };
        }

        return component.value;
    }
}

export class PrefabModel extends TypedModel({
    components: {
        prefab: { type: 'prefab' },
    }
}) { } 

export class PrefabSystem extends TypedSystem({
    models: {
        prefabs: { model: PrefabModel, isSet: true },
    }
}) {
    id = 'prefab';

    /** @type {WeakMap<PrefabModel | PrefabAssetInstance, AbortController>} */
    #watchCtls = new WeakMap();

    /**
     * @param {PrefabModel} model
     */
    onModelAdd(model) {
        const abortCtl = new AbortController();
        this.#watchCtls.set(model, abortCtl);

        model.prefab.watch('instance:create', { signal: abortCtl.signal, handler: (previousInstance) => {
            this.#deleteComponents(previousInstance);
            this.#createComponents(model);
        } });

        this.#createComponents(model);
    }

    /**
     * @param {PrefabModel} model
     */
    onModelDelete(model) {
        this.#watchCtls.get(model)?.abort();

        this.#deleteComponents(model.prefab.instance);
    }

    /**
     * @type {WeakMap<Component<ComponentTypes, any>, PrefabModel>}
     */
    #modelsByComponent = new WeakMap();

    /**
     * @param {PrefabModel} model
     */
    #createComponents(model) {
        if(this.stage && model.prefab.instance) {
            for(const component of model.prefab.instance.components) {
                let stageComponent = this.stage.components.getById(component.id);
                if(!stageComponent) {
                    stageComponent = this.stage.components.add(component).getById(component.id, true);
                }
                this.#modelsByComponent.set(stageComponent, model);
            }

            const abortCtl = new AbortController();
            this.#watchCtls.set(model.prefab.instance, abortCtl);

            for(const [src, dst] of Object.entries(model.prefab.instance.references.entities)) {
                this.stage.watch(`reference:create:${src}`, { signal: abortCtl.signal, handler: () => {
                    model.prefab.references ??= {};
                    model.prefab.references[dst] = src;

                    const componentId = model.components['prefab'].id;
                    if(this.isPrefabComponent(componentId)){
                        this.updatePrefabOverride(componentId);
                    } 
                } });

                this.stage.watch(`reference:release:${src}`, { signal: abortCtl.signal, handler: (count) => {
                    if(!count) {
                        delete model.prefab.references?.[dst];
                    }
                    const componentId = model.components['prefab'].id;
                    if(this.isPrefabComponent(componentId)){
                        this.updatePrefabOverride(componentId);
                    } 
                } })
            }
        }
    }

    /**
     * @param {PrefabAssetInstance | undefined} instance
     */
    #deleteComponents(instance) {
        if(this.stage && instance) {
            this.#watchCtls.get(instance)?.abort();

            for(const component of Object.values(instance.components)) {
                this.stage.components.delete(component);
            }
        }
    }

    /**
     * @param {string} componentId
     */
    isPrefabComponent(componentId) {
        if(!this.stage) return false;
        const component = this.stage.components.getById(componentId);
        return !!(component && this.#modelsByComponent.get(component));
    }

    /**
     * @param {string} entityId 
     */
    isPrefabEntity(entityId) {
        if(!this.stage) return false;

        const entity = this.stage.getEntityById(entityId);

        if(entity) {
            const component = entity.components.getByType('meta');
            return !!(component && this.#modelsByComponent.get(component))
        }
    }

    /**
     * @param {string} componentId
     */
    getPrefabOverride(componentId) {
        if(!this.stage) throw new Error('Invalid state');

        const component = this.stage.components.getById(componentId);

        if(!component) throw new Error('Invalid component');

        const model = this.#modelsByComponent.get(component);

        if(!model || !model.prefab.data || !model.prefab.instance) throw new Error('Invalid state');;

        const refId    = model.prefab.instance.references.components[componentId];
        const original = model.prefab.getOriginalValue(componentId);
        const value    = component.getJSONValue();
        const delta    = diff(original, value);

        return { model, refId, original, value, delta, isEmpty: isEmptyObject(delta) }
    }

    /**
     * @param {string} componentId
     */
    updatePrefabOverride(componentId) {
        const { model, refId, delta } = this.getPrefabOverride(componentId);

        if(model.prefab.overrides && isEmptyObject(delta ?? {})) {
            delete model.prefab.overrides[refId];
            if(Object.keys(model.prefab.overrides).length === 0) {
                delete model.prefab.overrides;
            }
        } else {
            model.prefab.overrides ??= {};
            model.prefab.overrides[refId] = delta;
        }    

        // check if prefab is part of another prefab and update the override for this component as well
        const prefabComponent = model.components['prefab'];
        const parentModel = this.#modelsByComponent.get(prefabComponent);
        if(parentModel) {
            this.updatePrefabOverride(prefabComponent.id);
        } 
    }
}