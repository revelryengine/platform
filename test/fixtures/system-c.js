import { System, Model } from '../../lib/ecs.js';
import { bundle as bundleB } from './system-b.js';
import { c, k } from './schemas.js';

let loadCalled = false;
/**
 * @import { SystemBundle } from '../../lib/ecs.js'
 */

export class ModelC extends Model.Typed({
    components: ['c', 'k']
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

/** @satisfies {SystemBundle} */
export const bundle = {
    bundles: [bundleB],
    systems: [SystemC],
    schemas: { c, k },
    loaders: {
        'a': (uri, signal) => fetch(uri, { signal }).then(res => res.json()),
    },
    load: async () => { loadCalled = true },
};
