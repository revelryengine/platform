import { describe, it, beforeEach } from 'std/testing/bdd.ts';

import { assertEquals     } from 'std/assert/assert_equals.ts';
import { assertExists     } from 'std/assert/assert_exists.ts';
import { assertInstanceOf } from 'std/assert/assert_instance_of.ts';

import { System } from '../lib/system.js';
import { Model  } from '../lib/model.js';


/**
 * @typedef {{  
*   a: { value: string },
*   b: { value: number },
*   c: { value: import('../lib/utils/watchable.js').Watchable },
*   d: { value: { foo: string }, complex: import('../lib/stage.js').ComplexComponentValue },
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

describe('System', () => {
    const types = /** @type {ComponentTypes} */({});
    const TypedModel  = Model.Typed(types);
    const TypedSystem = System.Typed(types);

    class ModelA extends TypedModel({ 
        components: {
            b: { type: 'b' },
        }
        
    }) { }

    class ModelB extends TypedModel({ 
        components: {
            a: { type: 'a' }, 
        }
    }) { }

    class SystemA extends TypedSystem({
        models: {
            modelA:  { model: ModelA, },
            modelBs: { model: ModelB, isSet: true },
        }
    }) { }

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
            system.parent = /** @type {import('../lib/stage.js').Stage<ComponentTypes>} */({});
            assertEquals(system.stage, system.parent);
        });
    });

    describe('game', () => {
        it('should be a reference to the stage parent game', () => {
            system.parent =  /** @type {import('../lib/stage.js').Stage<ComponentTypes>} */({ parent:  /** @type {import('../lib/game.js').Game} */({}) });
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
