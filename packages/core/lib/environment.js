import { Model, System } from '../deps/ecs.js';

import { GLTF } from '../deps/gltf.js';

/**
 * @import { SystemBundle, ComponentTypeSchema } from '../deps/ecs.js';
 */

export const EnvironmentSchema = /** @type {const} @satisfies {ComponentTypeSchema}*/({
    type: 'object',
    properties: {
        asset: { type: 'string', asset: 'revelry/environment' },
    },
    observed: ['asset'],
});

/**
 * @param {{uri: string, signal: AbortSignal }} params
 */
export async function EnvironmentLoader({ uri, signal }) {
    return GLTF.load(import.meta.resolve(uri), signal).then((gltf) => {
        const map = gltf.extensions?.KHR_environment_map?.environment_maps[0];
        if(!map) {
            throw new Error('Invalid Environment asset');
        }
        return map;
    });
}

export class EnvironmentModel extends Model.Typed(/** @type {const} */({
    components: ['environment'],
})) {
    get map() {
        return this.components.environment.references['/asset']?.data;
    }
}

export class EnvironmentSystem extends System.Typed(/** @type {const} */({
    id: 'environment',
    models: {
        environments: { model: EnvironmentModel, isSet: true },
    },
})) {
    /**
     * @param {EnvironmentModel} model
     */
    onModelAdd(model) {
        this.#setEnvironmentMap(model);
        model.components.environment.watch('reference:resolve:/asset', () => this.#setEnvironmentMap(model));
    }

    /**
     * @param {EnvironmentModel} model
     */
    #setEnvironmentMap(model) {
        const renderer = this.stage.getContext('renderer');

        if(model.map) {
            renderer.setEnvironmentMap(model.map)
        }
    }

    /**
     * @param {EnvironmentModel} model
     */
    onModelDelete(model) {
        const renderer = this.stage.getContext('renderer');
        if(model.map && model.map === renderer.getEnvironmentMap()) {
            const env = [...this.models.environments].filter((env) => env.map && env !== model).pop();
            renderer.setEnvironmentMap(env?.map ?? null);
        }
    }
}


/** @satisfies {SystemBundle} */
export const bundle = {
    systems: [EnvironmentSystem],
    schemas: {
        environment: EnvironmentSchema,
    },
    loaders: {
        'revelry/environment': EnvironmentLoader,
    }
}
