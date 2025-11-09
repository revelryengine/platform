import { System, Model } from '../../ecs.js';

/**
 * @import { SystemBundle } from '../../ecs.js'
 */

export class ModelB extends Model.Typed({
    components: ['b']
}) {}

export class SystemB extends System.Typed({
    id: 'system-b',
    models: {
        b: { model: ModelB, isSet: true },
    }
}) { }

export const bundle = /** @type {const} @satisfies {SystemBundle} */({
    systems: [SystemB],
    schemas: {
        b: { type: 'number'  }
    },
});
