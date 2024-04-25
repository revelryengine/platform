import { System, Model } from '../../lib/ecs.js';
import { a } from './schemas.js';

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

/** @satisfies {SystemBundle} */
export const bundle = {
    systems: [SystemA],
    schemas: { a },
};
