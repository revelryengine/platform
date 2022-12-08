import { describe, it, beforeEach                     } from 'https://deno.land/std@0.143.0/testing/bdd.ts';
import { assertEquals, assertInstanceOf, assertExists } from 'https://deno.land/std@0.143.0/testing/asserts.ts';

import { System } from '../../lib/system.js';

describe('System', () => {
    let system;

    class SystemA extends System {
        static get models() {
            return {
                modelA:  { },
                modelBs: { isSet: true },
            }
        }
    }

    beforeEach(() => {
        system = new SystemA('system');
    });

    describe('models', () => {
        describe('model sets', () => {
            it('should create a new set for models where isSet is true', () => {
                assertInstanceOf(system.modelBs, Set);
            });
        });
    });

    describe('stage', () => {
        it('should be a reference to the parent stage', () => {
            system.parent = {};
            assertEquals(system.stage, system.parent);
        });
    });

    describe('game', () => {
        it('should be a reference to the stage parent game', () => {
            system.parent = { parent: {} };
            assertEquals(system.game, system.stage.parent);
        });
    });

    describe('default models', () => {
        it('should not error when not defining a subclass', () => {
            assertExists(new System());
        })
    });
});
