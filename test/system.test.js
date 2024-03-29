import { describe, it, beforeEach } from 'https://deno.land/std@0.208.0/testing/bdd.ts';

import { assertExists     } from 'https://deno.land/std@0.208.0/assert/assert_exists.ts';
import { assertInstanceOf } from 'https://deno.land/std@0.208.0/assert/assert_instance_of.ts';

import { System } from '../lib/system.js';
import { Model  } from '../lib/model.js';

describe('System', () => {
    class ModelA extends Model.Typed({
        components: {
            b: { type: 'b' },
        }

    }) { }

    class ModelB extends Model.Typed({
        components: {
            a: { type: 'a' },
        }
    }) { }

    class SystemA extends System.Typed({
        models: {
            modelA:  { model: ModelA, },
            modelBs: { model: ModelB, isSet: true },
        }
    }) { }

    /** @type {SystemA} */
    let system;

    beforeEach(() => {
        system = new SystemA({ id: 'system' });
    });

    describe('models', () => {
        describe('model sets', () => {
            it('should create a new set for models where isSet is true', () => {
                assertInstanceOf(system.modelBs, Set);
            });
        });
    });

    describe('default models', () => {
        it('should not error when not defining a subclass', () => {
            assertExists(new System());
        })
    });
});
