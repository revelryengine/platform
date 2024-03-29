
import { System      } from '../deps/ecs.js';
import { Model       } from '../deps/ecs.js';
import { Component   } from '../deps/ecs.js';
import { UUID        } from '../deps/ecs.js';
import { merge, diff } from '../deps/utils.js';

import { Asset     } from './asset.js';


/**
 * @typedef {{ [K in Revelry.ECS.ComponentTypeKeys]: Revelry.ECS.ComponentJSON<K>['value'] }} ComponentTypeValueOverrideMap
 */

/**
 * @typedef {{[key: string]: ComponentTypeValueOverrideMap }} PrefabOverrides
 * @typedef {{[key: string]: string }} PrefabReferences
 */

/**
 * @typedef {{ path: string, references?: PrefabReferences, overrides?: PrefabOverrides }} PrefabAssetValue
 * @typedef {{ meta: { name: string, description: string}, components: Revelry.ECS.ComponentJSON[] }} PrefabAssetJSON
 * @typedef {PrefabAssetJSON & {
 *     entityRegExp:  RegExp;
 *     entities: {[key: string]: import('../deps/ecs.js').ComponentJSONMap<ComponentTypesDefinition> };
 *     componentsWithReference: WeakSet<Revelry.ECS.ComponentJSON>;
 * }} PrefabAssetData
 * @typedef {{
 *   entities: PrefabReferences;
 *   components: Set<Component>;
 * }} PrefabAssetInstance
 */

/**
 * @extends {Asset<PrefabAssetData, PrefabAssetInstance>}
 */
export class PrefabAsset extends Asset {
    #referer;

    /**
     * @param {Revelry.ECS.ComponentJSON<ComponentTypes, 'prefab'>} component
     * @param {Asset<PrefabAssetData, PrefabAssetInstance>[]} [referer]
     */
    constructor(component, referer) {
        super(component);

        this.#referer = referer;

        if(referer) {
            if(referer.some((r) => r.path === this.path)) {
                throw new Error('Asset recursion loop');
            }

            referer[0].waitFor('unload').then(() => this.unload());
        }

        this.references = component.value.references;
        this.overrides  = component.value.overrides;
    }

    /**
     *
     * @param {PrefabAssetValue} value
     */
    set({ path, references, overrides }) {
        this.references = references;
        this.overrides  = overrides;

        super.set({ path });
    }

    /**
     * @param {AbortSignal} [signal]
     * @return {Promise<PrefabAssetData>}
     */
    async load(signal) {
        const json = /** @type {PrefabAssetJSON} */(await super.fetch(signal).then(res => res.json()));
        const data = /** @type {PrefabAssetData} */({ ...json });

        data.entities = {};

        for(const component of data.components) {
            data.entities[component.entity] ??= {};
            data.entities[component.entity][component.type] = component;

            const override = this.overrides?.[component.entity]?.[component.type];

            if(override) {
                this.overrides ??= {};

                const value = structuredClone(component.value);
                if(typeof override === 'object') {
                    if(typeof value === 'object' && value !== null) {
                        const delta = diff(value, structuredClone(override)) ?? {};
                        if(isEmptyObject(delta)) {
                            delete this.overrides[component.entity][component.type];
                        } else {
                            this.overrides[component.entity][component.type] = delta;
                        }
                    }
                } else {
                    if(value === override) {
                        delete this.overrides[component.entity][component.type];
                    }
                }
            }
        }

        data.entityRegExp = new RegExp(`(${Object.keys(data.entities).join('|')})`);
        data.componentsWithReference = new Set();

        for(const component of data.components) {
            if(JSON.stringify(component.value).match(data.entityRegExp)) {
                data.componentsWithReference.add(component);
            }

            if(component.type === 'prefab') {
                const prefab = new PrefabAsset(/** @type {Revelry.ECS.ComponentJSON<ComponentTypes, 'prefab'>} */(component), [this, ...this.referer ?? []]);
                await Promise.race([prefab.waitFor('data:loaded'), prefab.waitFor('error')]).then(() => {
                    if(prefab.state === 'error') throw prefab.error;
                });
            }
        }

        return data;
    }

    async createInstance() {
        if(!this.data) throw new Error('Invalid state');

        const instance = /** @type {PrefabAssetInstance} */({
            entities: {},
            components: new Set(),
        });

        for(const entity of Object.keys(this.data.entities)) {
            const uuid = this.references?.[entity] ?? UUID();

            instance.entities[entity] = uuid;
            instance.entities[uuid] = entity;
        }

        return instance;
    }

    toJSON() {
        return { path: this.path, references: this.references, overrides: this.overrides };
    }

    /**
     * @param {{ entity: string, type: string }} componentData
     */
    getOriginalValue({ entity, type }) {
        if(!this.data || !this.instance) throw new Error('Invalid state');

        const component = this.data.entities[entity]?.[type];

        if(!component) throw new Error('Component not found');

        let value = structuredClone(component.value);

        if(type === 'meta') {
            /** @type {ComponentJSON<ComponentTypes, 'meta'>['value']} */(value).parent ??= this.entity;
        }

        if(this.data.componentsWithReference.has(component)) {
            const instance = this.instance;
            value = JSON.parse(JSON.stringify(value).replace(this.data.entityRegExp, (match) => instance.entities[match]));
        }

        return value;
    }

    /**
     * @param {{ entity: string, type: string }} componentData
     */
    getInstanceValue({ entity, type }) {
        if(!this.data || !this.instance) throw new Error('Invalid state');

        const component = this.data.entities[entity]?.[type];

        if(!component) throw new Error('Component not found');

        const override = this.overrides?.[entity]?.[type];

        let value = structuredClone(component.value);

        if(override) {
            if(typeof override === 'object') {
                if(typeof value === 'object' && value !== null) {
                    value = merge(value, structuredClone(override));
                }
            } else {
                value = structuredClone(override);
            }
        }

        if(type === 'meta') {
            /** @type {ComponentJSON<ComponentTypes, 'meta'>['value']} */(value).parent ??= this.entity;
        }

        if(this.data.componentsWithReference.has(component)) {
            const instance = this.instance;
            value = JSON.parse(JSON.stringify(value).replace(this.data.entityRegExp, (match) => instance.entities[match]));
        }

        return value;
    }

    /**
     * @param {{ entity: string, type: string }} componentData
     */
    getInstanceComponentData({ entity, type }) {
        const value     = this.getInstanceValue({ entity, type });
        const entityRef = this.instance?.entities[entity];

        if(!entityRef) throw new Error('Entity not found');

        return { type, entity: entityRef, value };
    }
}

export class PrefabModel extends Model.Typed({
    components: {
        prefab: { type: 'prefab' },
    }
}) { }

export class PrefabSystem extends System.Typed({
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

        model.prefab.watch('instance:create', { signal: abortCtl.signal, handler: ({ previous }) => {
            this.#deleteComponents(previous);
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
     * @type {WeakMap<Component<any, any>, PrefabModel>}
     */
    #modelsByComponent = new WeakMap();

    /**
     * @param {PrefabModel} model
     */
    #createComponents(model) {
        if(this.stage && model.prefab.data && model.prefab.instance) {
            for(const component of model.prefab.data.components) {
                const componentData  = /** @type {Revelry.ECS.ComponentJSON<ComponentTypes>} */(model.prefab.getInstanceComponentData(component));

                //stage may have other unknown component types so we need to cast it generically
                const stage = /** @type {import('../deps/ecs.js').Stage} */(/** @type {unknown} */(this.stage));

                this.#modelsByComponent.set(stage.components.add(componentData), model);
            }

            const abortCtl = new AbortController();
            this.#watchCtls.set(model.prefab.instance, abortCtl);

            for(const [src, dst] of Object.entries(model.prefab.instance.entities)) {
                if(this.stage.components.references.count({ entity: src }) === 0) {
                    if(model.prefab.references) {
                        delete model.prefab.references[dst];
                        if(Object.values(model.prefab.references).length === 0) {
                            delete model.prefab.references;
                        }
                    }
                }

                this.stage.components.references.watch(`reference:add:${src}`, { signal: abortCtl.signal, handler: ({ referer }) => {
                    model.prefab.references ??= {};
                    model.prefab.references[dst] = src;

                    const component = model.components['prefab'];
                    if(this.isPrefabComponent(component)){
                        this.updatePrefabOverride(component);
                    }
                } });

                this.stage.components.references.watch(`reference:release:${src}`, { signal: abortCtl.signal, handler: ({ referer, count }) => {
                    if(count === 0) {
                        if(model.prefab.references) {
                            delete model.prefab.references[dst];
                            if(Object.values(model.prefab.references).length === 0) {
                                delete model.prefab.references;
                            }
                        }
                    }
                    const component = model.components['prefab'];
                    if(this.isPrefabComponent(component)){
                        this.updatePrefabOverride(component);
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
     * @param {{ entity: string, type: any }} component
     */
    isPrefabComponent({ entity, type }) {
        if(!this.stage) return false;
        const component = this.stage.components.find({ entity, type });
        return !!(component && this.#modelsByComponent.get(component));
    }

    /**
     * @param {string} entity
     */
    isPrefabEntity(entity) {
        return this.isPrefabComponent({ entity, type: 'meta' });
    }

    /**
     * @param {{ entity: string, type: any }} component
     */
    getPrefabOverride({ entity, type }) {
        if(!this.stage) throw new Error('Invalid state');

        const component = this.stage.components.find({ entity, type });

        if(!component) throw new Error('Invalid component');

        const model = this.#modelsByComponent.get(component);

        if(!model || !model.prefab.data || !model.prefab.instance) throw new Error('Invalid state');

        const refId = model.prefab.instance.entities[entity];

        const original = model.prefab.getOriginalValue({ entity: refId, type });
        const value    = component.getJSONValue();
        const delta    = diff(original, value);

        return { model, original, value, delta, isEmpty: isEmptyObject(delta) }
    }

    /**
     * @param {{ entity: string, type: keyof ComponentTypes }} component
     */
    updatePrefabOverride({ entity, type }) {
        const { model, delta } = this.getPrefabOverride({ entity, type });
        console.log(model, delta);

        if(!model || !model.prefab.data || !model.prefab.instance) throw new Error('Invalid state');

        const refId = model.prefab.instance.entities[entity];

        if(model.prefab.overrides?.[refId] && isEmptyObject(delta ?? {})) {
            delete model.prefab.overrides[refId]?.[type];

            if(Object.keys(model.prefab.overrides[refId]).length === 0) {
                delete model.prefab.overrides[refId];
            }

            if(Object.keys(model.prefab.overrides).length === 0) {
                delete model.prefab.overrides;
            }
        } else {
            model.prefab.overrides ??= {};
            model.prefab.overrides[refId] ??= {};
            model.prefab.overrides[refId][type] = delta;
        }

        // check if prefab is part of another prefab and update the override for this component as well
        const prefabComponent = model.components['prefab'];
        const parentModel = this.#modelsByComponent.get(prefabComponent);
        if(parentModel) {
            this.updatePrefabOverride(prefabComponent);
        }
    }
}

/** @satisfies {Revelry.ECS.SystemBundle} */
export const bundle = {
    systems: [PrefabSystem],
    initializers: { prefab: (c) => new PrefabAsset(c) }
}
