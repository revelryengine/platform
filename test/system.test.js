import { describe, it, beforeEach                     } from 'std/testing/bdd.ts';
import { assertEquals, assertInstanceOf, assertExists } from 'std/testing/asserts.ts';

import { System } from '../lib/system.js';
import { Model  } from '../lib/model.js';

/** @typedef {import('../lib/game.js').Game} Game */
/** @typedef {import('../lib/stage.js').Stage} Stage */

describe('System', () => {
    /**
     * @extends {System<{ modelA: Model<{ a: string }>, modelBs: Set<Model<{ a: string }>> }>} 
     */
    class SystemA extends System {
        static models = {
            modelA:  { model: Model, },
            modelBs: { model: Model, isSet: true },
        }
    }

    /** @type {SystemA} */
    let system;

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
            system.parent = /** @type {Stage} */({});
            assertEquals(system.stage, system.parent);
        });
    });

    describe('game', () => {
        it('should be a reference to the stage parent game', () => {
            system.parent =  /** @type {Stage} */({ parent:  /** @type {Game} */({}) });
            assertExists(system.stage?.parent);
            assertEquals(system.game, system.stage?.parent);
        });
    });

    describe('default models', () => {
        it('should not error when not defining a subclass', () => {
            assertExists(new System());
        })
    });
});
