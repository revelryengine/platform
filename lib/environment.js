import { Model, System } from '../deps/ecs.js';

import { GLTF } from '../deps/gltf.js';

import { Asset } from './asset.js';

/**
 * @extends {Asset<{ path: string, active: boolean }, GLTF, import('../deps/gltf.js').KHREnvironmentMapData>}
 */
export class EnvironmentAsset extends Asset {
    /**
     * @param {AbortSignal} [signal]
     * @return {Promise<GLTF>}
     */
    async load(signal) {
        return GLTF.load(import.meta.resolve(this.path), signal);
    }

    async createInstance() {
        if(!this.data) throw new Error('Invalid state');
        const map = this.data.extensions?.KHR_environment_map?.environment_maps[0];
        if(!map) throw new Error('Invalid Environment asset');
        return map;
    }
}

export class EnvironmentModel extends Model.Typed({
    components: {
        environment: { type: 'environment' },
    }, events: /** @type {{
        'activate':   void,
        'deactivate': void,
    }} */({})

}) {
    get map() {
        return this.environment.instance;
    }


}

export class EnvironmentSystem extends System.Typed({
    models: {
        environments: { model: EnvironmentModel, isSet: true },
    },
}) {
    id = 'environment';

    /**
     * @param {EnvironmentModel} model
     */
    onModelAdd(model) {
        const renderer = /** @type {import('./renderer.js').RendererSystem} */(this.stage?.getContext('renderer'));

        model.environment.watch('instance:create', ({ instance }) => {
            renderer.setEnvironmentMap(instance);
        });
    }

    /**
     * @param {EnvironmentModel} model
     */
    onModelDelete(model) {
        const renderer = /** @type {import('./renderer.js').RendererSystem} */(this.stage?.getContext('renderer'));
        if(model.map && model.map === renderer.getEnvironmentMap()) {
            const env = [...this.environments].filter((env) => env.map && env !== model).pop();
            renderer.setEnvironmentMap(env?.map ?? null);
        }
    }
}


/** @satisfies {Revelry.ECS.SystemBundle} */
export const bundle = {
    systems: [EnvironmentSystem],
    initializers: { environment: (c) => new EnvironmentAsset(c) }
}
