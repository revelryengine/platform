import { System, Model } from '../../lib/ecs.js';
import { b } from './schemas.js';

/**
 * @import { SystemBundle } from '../../lib/ecs.js'
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

/** @satisfies {SystemBundle} */
export const bundle = {
    systems: [SystemB],
    schemas: { b },
};
