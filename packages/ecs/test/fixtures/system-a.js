import { System, Model } from '../../lib/ecs.js';

/**
 * @import { SystemBundle } from '../../lib/ecs.js'
 */

export class ModelA extends Model.Typed({
    components: ['a']
}) {}

export class SystemA extends System.Typed({
    id: 'system-a',
    models: {
        a: { model: ModelA, isSet: true },
    }
}) { }

export const bundle = /** @type {const} @satisfies {SystemBundle} */({
    systems: [SystemA],
    schemas: {
        a: { type: 'string'  },
        b: { type: 'number'  },
        c: { type: 'boolean' },
        d: { type: 'object', properties: { e: { type: 'string' } } },
    },
});
