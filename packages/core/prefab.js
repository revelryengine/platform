
import { System, Model, Component, componentSchemas } from 'revelryengine/ecs/ecs.js';
import { applyPatch, createPatch } from 'revelryengine/deps/rfc6902.js';
import { NonNull } from 'revelryengine/utils/utils.js';
import { PREFAB_DELIM } from './constants.js';

import { GameObjectModel } from './game-object.js';

/**
 * @import { ComponentTypeKey, SystemBundle, ComponentTypeSchema, ComponentDataMap, ComponentDataMapSerialized, Stage } from 'revelryengine/ecs/ecs.js';
 * @import { Operation } from 'revelryengine/deps/rfc6902.js';
 */

/**
 * @typedef {{
 *     meta: {
 *         name:        string,
 *         description: string,
 *     },
 *     components: ComponentDataMapSerialized[string][],
 * }} PrefabFile
 */

/**
 * @param {{uri: string, signal: AbortSignal }} params
 */
export async function PrefabLoader({ uri, signal }) {
    const file   = /** @type {PrefabFile} */(await fetch(import.meta.resolve(uri), { signal }).then(res => res.json()));
    const values = /** @type {{ [key:string]: { [key:string]: any} }}*/({});
    for(const component of file.components) {
        values[component.entity] ??= {};
        values[component.entity][component.type] = component.value;
    }
    return /** @type {const} */({ components: file.components, values: values })
}

export const PrefabSchema = /** @type {const} @satisfies {ComponentTypeSchema}*/({
    type: 'object',
    properties: {
        asset: { type: 'string', asset: 'revelry/prefab' },
        overrides: { // keyed by entity
            type: 'object',
            additionalProperties: {
                type: 'object', // value keyed by type,
                additionalProperties: {
                    type: 'object',
                    properties: {
                        op: {
                            type: 'string',
                            enum: ['patch', 'append', 'omit']
                        },
                        patch: {
                            type: 'array', //json patch operations
                            items: {
                                type: 'object',
                                properties: {
                                    op:    { type: 'string', enum: ['add', 'replace', 'remove', 'move', 'copy', 'test'] },
                                    path:  { type: 'string' },
                                },
                                required: ['op', 'path']
                            }
                        }
                    },
                    required: ['op'],
                }
            },
            default: {},
        },
    },
    observed: ['asset'],
});

export class PrefabModel extends Model.Typed(/** @type {const} */({
    components: ['prefab']
})) {
    /**
     * @type {Set<Component>}
     */
    prefabComponents = new Set();

    /**
     * @param {string} [topLevel]
     */
    * ancestorPrefabs(topLevel = '') {
        let search = /** @type {PrefabModel|null} */(this);

        while (search && search.entity.includes(topLevel)) {
            if(search = this.getParentPrefab()) yield search;
        }
    }

    getParentPrefab() {
        if(!this.entity.includes(PREFAB_DELIM)) return null;
        return NonNull(this.stage.getEntityModel(this.entity.slice(0, this.entity.lastIndexOf(PREFAB_DELIM)), PrefabModel), 'Parent Prefab not found');
    }

    /**
     * @param {string} entity
     * @param {string} type
     * @param {string} topLevel
     * @return {unknown}
     */
    getInitialValue(entity, type, topLevel = '') {
        const values = this.components.prefab.references?.['/asset']?.data?.values;
        const overrides = this.components.prefab.value.overrides;

        const sourceEntity = entity.slice(this.entity.length + 1);

        if(!values) throw new Error('Prefab not loaded');

        if(sourceEntity in values && type in values[sourceEntity]) {
            return structuredClone(values[sourceEntity][type]);
        } else if(overrides[sourceEntity]?.[type]?.op === 'append') {
            return structuredClone(overrides[sourceEntity][type].value);
        } else if(this.entity.includes(PREFAB_DELIM)){
            const parentPrefab = this.getParentPrefab();
            if(parentPrefab?.entity.includes(topLevel)) return parentPrefab.getInitialValue(entity, type, topLevel);
        }

        throw new Error(`Component ${entity}:${type} not found in prefab values or overrides`);
    }

    /**
     * Returns a patch that when applied to the default value of the component will return it to the runtime value specified.
     *
     * @param {ComponentDataMap[string]} component
     */
    getOverridePatch({ entity, type, value }) {
        const values = this.components.prefab.references?.['/asset']?.data?.values;

        if(!values) throw new Error('Prefab not loaded');

        const origin = this.stage.getContext('prefab').getPrefabOrigin(entity);
        const copy   = { entity, type, value: origin.getInitialValue(entity, type) };

        if(origin !== this) { //apply overrides from bottom level up to one level down from this prefab
            origin.applyOverrides(copy, entity.slice(0, this.entity.indexOf(PREFAB_DELIM, this.entity.length + 1)));
        }

        if(componentSchemas[type]) {
            return createPatch({ value: componentSchemas[type].serialize(copy.value) }, { value: componentSchemas[type].serialize(value) });
        } else {
            return createPatch({ value: copy.value }, { value });
        }
    }

    /**
     * Recursively applies overrides to the specified component from the prefab and all ancestors.
     * Applies from the bottom up to the specified top level prefab entity.
     * - Returns null if the component is omitted by the current model
     * - Applies any override patches
     * - Sets the parent of any unparented meta components to the current model entity
     * - Prefixes any internal component references with the current model entity
     *
     * @param {ComponentDataMap[string]} component
     * @param {string} [topLevel]
     * @return {ComponentDataMap[string]|null}
     */
    applyOverrides(component, topLevel =  '') {
        const values = this.components.prefab.references?.['/asset']?.data?.values;
        const overrides = this.components.prefab.value.overrides;

        if(!values) throw new Error('Prefab not loaded');

        const { entity, type } = component;
        const sourceEntity = entity.slice(this.entity.length + 1);

        const override = this.components.prefab.value.overrides[sourceEntity]?.[type];
        if(override?.op === 'omit') return null;
        if(override?.op === 'patch') {
            applyPatch(component, /** @type {Operation[]} */(override.patch));
        }

        if(component.type === 'meta' && !component.value.parent) {
            component.value.parent = this.entity;
        }

        if(componentSchemas[type]?.hasReference) {
            for(const { schema, target, key } of componentSchemas[type].traverse(component, 'value')) {
                if(schema.isComponentReference) {
                    if(target[key] && (target[key] in values || target[key] in overrides)) {
                        target[key] = `${this.entity}${PREFAB_DELIM}${target[key]}`;
                    }
                }
            }
        }

        if(this.entity.includes(PREFAB_DELIM)){
            const parentPrefab = this.getParentPrefab();
            if(parentPrefab?.entity.includes(topLevel)) return parentPrefab.applyOverrides(component, topLevel);
        }

        return component;
    }
}

export class PrefabSystem extends System.Typed(/** @type {const} */({
    id: 'prefab',
    models: {
        prefabs: { model: PrefabModel, isSet: true },
    }
})) {

    /**
     * @param {PrefabModel} model
     */
    #assertNonRecursive(model) {
        const traversed = new Set();

        let search = /** @type {PrefabModel|false} */(model);
        while (search) {
            const uri = search.components.prefab.value.asset;
            if(traversed.has(uri)) {
                throw new Error(`Recursive prefab reference detected: ${uri} -> ${[...traversed].reverse().join(' -> ')}`);
            }
            traversed.add(uri);
            search = search.entity.includes(PREFAB_DELIM) && this.getPrefabOrigin(search.entity);
        }
    }

    /**
     * @type {WeakMap<PrefabModel, AbortController>}
     */
    #abortCtls = new WeakMap();

    /**
     * @param {PrefabModel} model
     */
    onModelAdd(model) {
        try {
            this.#assertNonRecursive(model);
            this.#createComponents(model);
            model.components.prefab.watch('reference:resolve:/asset', () => this.#createComponents(model));
            model.components.prefab.watch(() => {
                this.stage.getEntityModel(model.entity, GameObjectModel)?.notify('node:update')
            });
        } catch(e) {
            console.error(e);
        }
    }

    /**
     * @param {PrefabModel} model
     */
    onModelDelete(model) {
        this.#abortCtls.get(model)?.abort();

        for(const component of model.prefabComponents) {
            this.stage.components.delete(component);
        }
    }

    /**
     * @param {string} entity
     */
    getPrefabModel(entity) {
        return this.stage.getEntityModel(entity, PrefabModel);
    }

    /**
     * @param {string} entity
     */
    getPrefabOriginRoot(entity) {
        if(entity.includes(PREFAB_DELIM)) {
            const root = entity.slice(0, entity.indexOf(PREFAB_DELIM));
            return NonNull(this.getPrefabModel(root));
        }

        throw new Error('Entity is not a prefab child');
    }

    /**
     * @param {string} entity
     */
    getPrefabOrigin(entity) {
        if(entity.includes(PREFAB_DELIM)) {
            const source = entity.slice(0, entity.lastIndexOf(PREFAB_DELIM));
            return NonNull(this.getPrefabModel(source));
        }

        throw new Error('Entity is not a prefab child');
    }

    /**
     * Bottom up iteration of ancestors that are prefab sources
     * @param {string} entity
     */
    * ancestorsOf(entity) {
        const gameObject = NonNull(this.stage.getEntityModel(entity, GameObjectModel), `GameObject not found ${entity}`);
        for(const parent of gameObject.ancestors()) {
            const prefab = this.getPrefabModel(parent.entity);
            if(prefab) {
                yield prefab;
            }
        }
    }

    /**
     * @type {WeakMap<Component, PrefabModel>}
     */
    #origins = new WeakMap();

    /**
     * @param {PrefabModel} model
     */
    #createComponents(model) {
        const abortCtl = new AbortController();

        this.#abortCtls.get(model)?.abort();
        this.#abortCtls.set(model, abortCtl);

        const data = model.components.prefab.references['/asset']?.data;

        if(data) {
            for(const component of model.prefabComponents) {
                this.stage.components.delete(component);
            }
            const children   = new Set();
            const components = [...data.components];

            for(const [entity, types] of Object.entries(model.components.prefab.value.overrides)) {
                for(const [type, override] of Object.entries(types)) {
                    if(override.op === 'append') {
                        components.push({ entity, type, value: override.value })
                    }
                }
            }

            for(const { entity, type, value } of components) {
                const copy  = { entity: `${model.entity}${PREFAB_DELIM}${entity}`, type, value: structuredClone(value) };

                if(model.applyOverrides(copy) === null) continue;

                const component = this.stage.createComponent(copy);

                model.prefabComponents.add(component);

                this.#origins.set(component, model);

                if(type === 'prefab') {
                    children.add(`${model.entity}${PREFAB_DELIM}${entity}`);
                }
            }


            Promise.all([...children].map(id => new Promise((resolve) => this.watch(`prefab:load:${id}`, { signal: abortCtl.signal, handler: resolve })))).then(() => {
                this.notify(`prefab:load:${model.entity}`);
            });
        }
    }

    /**
     * @param {string} entity
     */
    isPrefabOrigin(entity) {
        return !!this.stage.components.find({ entity, type: 'prefab' });
    }

    /**
     * Returns trus if the prefab has any overrides, append or omit values.
     *
     * Returns false if the prefab is nested.
     *
     * @param {string} entity
     *
     */
    hasPrefabChanges(entity) {
        const value = this.stage.components.find({ entity, type: 'prefab' })?.value;
        return !!(!entity.includes(PREFAB_DELIM) && value && (Object.keys(value.overrides).length));
    }

    /**
     * @param {string} entity
     */
    isPrefabEntity(entity) {
        return entity.includes(PREFAB_DELIM);
    }

    /**
     * @param {string} entity
     */
    isPrefabChild(entity) {
        for(const _ of this.ancestorsOf(entity)) {
            return true;
        }
        return false;
    }

    /**
     * @param {string} entity
     */
    isPrefabAddition(entity) {
        const ancestors = [...this.ancestorsOf(entity)];
        if(ancestors.length) {
            const source = this.getPrefabOrigin(entity)?.entity;
            return !source || (ancestors[0].entity !== source && ancestors.some((prefab) => prefab.entity === source));
        }
        return false;
    }

    /**
     * @param {string} entity
     */
    isPrefabTransfer(entity) {
        const ancestors = [...this.ancestorsOf(entity)];
        if(ancestors.length) {
            const source = this.getPrefabOrigin(entity)?.entity;
            return !!source && !ancestors.some((prefab) => prefab.entity === source);
        }
        return false;
    }

    /**
     * @param {{ value?: unknown }} object
     * @param {NonNullable<ComponentDataMapSerialized['prefab']['value']['overrides']>[string][string]['patch']} operations
     */
    applyPatch(object, operations){
        applyPatch(object, /** @type {Operation[]} */(operations));
    }
}

/** @satisfies {SystemBundle} */
export const bundle = {
    systems: [PrefabSystem],
    schemas: {
        prefab: PrefabSchema,
    },
    loaders: {
        'revelry/prefab': PrefabLoader,
    },
}
