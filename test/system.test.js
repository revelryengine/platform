import { describe, it, beforeEach                     } from 'std/testing/bdd.ts';
import { assertEquals, assertInstanceOf, assertExists } from 'std/testing/asserts.ts';

import { System } from '../lib/system.js';
import { Model  } from '../lib/model.js';

/**
 * @template V,[C=any]
 * @typedef {import('../lib/stage.js').ComponentValue<V,C>} ComponentValue
 */
/**
 * @typedef {{  
*   a: ComponentValue<string>,
*   b: ComponentValue<number>,
*   c: ComponentValue<import('../lib/utils/watchable.js').Watchable>
*   d: ComponentValue<{ foo: string }, import('../lib/stage.js').ComplexComponentValue>
* }} ComponentTypes
*/
/**
* @template {Extract<keyof ComponentTypes, string>} [K = Extract<keyof ComponentTypes, string>]
* @typedef {import('../lib/stage.js').Component<ComponentTypes,K>} Component
*/
/**
* @template {Extract<keyof ComponentTypes, string>} [K = Extract<keyof ComponentTypes, string>]
* @typedef {import('../lib/stage.js').ComponentData<ComponentTypes,K>} ComponentData
*/
/**
* @typedef {import('../lib/stage.js').ComponentReference<ComponentTypes>} ComponentReference
*/

const types = /** @type {ComponentTypes} */({});

describe('System', () => {

    class ModelA extends Model.define({ 
        b: { type: 'b' },
    }, types) { }

    class ModelB extends Model.define({ 
        a: { type: 'a' }, 
    }, types) { }

    class SystemA extends System.define({
        modelA:  { model: ModelA, },
        modelBs: { model: ModelB, isSet: true },
    }, types) { }

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
            system.parent = /** @type {import('../lib/stage.js').Stage} */({});
            assertEquals(system.stage, system.parent);
        });
    });

    describe('game', () => {
        it('should be a reference to the stage parent game', () => {
            system.parent =  /** @type {import('../lib/stage.js').Stage} */({ parent:  /** @type {import('../lib/game.js').Game} */({}) });
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
