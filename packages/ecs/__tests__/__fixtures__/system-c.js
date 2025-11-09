import { System, Model } from '../../ecs.js';
import { bundle as bundleB } from './system-b.js';

/**
 * @import { SystemBundle } from '../../ecs.js'
 */

let loadCalled = false;

export class ModelC extends Model.Typed({
    components: ['c', 'f']
}) {}

export class SystemC extends System.Typed({
    id: 'system-c',
    models: {
        c: { model: ModelC, isSet: true },
    }
}) {
    get loadCalled() {
        return loadCalled;
    }
}

export const bundle = /** @type {const} @satisfies {SystemBundle} */({
    bundles: [bundleB],
    systems: [SystemC],
    schemas: {
        c: { type: 'boolean' },
        f: { type: 'string', asset: 'f' },
    },
    loaders: {
        'f': (uri, signal) => fetch(uri, { signal }).then(res => res.json()),
    },
    load: async () => { loadCalled = true },
});
