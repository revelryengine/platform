import { describe, it, beforeEach } from 'https://deno.land/std@0.208.0/testing/bdd.ts';
import { spy, assertSpyCall, assertSpyCalls  } from 'https://deno.land/std@0.208.0/testing/mock.ts';

import { assertExists       } from 'https://deno.land/std@0.208.0/assert/assert_exists.ts';
import { assertInstanceOf   } from 'https://deno.land/std@0.208.0/assert/assert_instance_of.ts';
import { assertStrictEquals } from 'https://deno.land/std@0.208.0/assert/assert_strict_equals.ts';
import { assertThrows       } from 'https://deno.land/std@0.208.0/assert/assert_throws.ts';
import { assertFalse        } from 'https://deno.land/std@0.208.0/assert/assert_false.ts';
import { assert             } from 'https://deno.land/std@0.208.0/assert/assert.ts';

import { System, SystemSet } from '../lib/system.js';
import { Model  } from '../lib/model.js';
import { Game   } from '../lib/game.js';
import { Stage  } from '../lib/stage.js';




/**
 * @import { Spy } from 'https://deno.land/std@0.208.0/testing/mock.ts';
 */

describe('System', () => {
    class ModelA extends Model.Typed({
        components: ['b']

    }) { }

    class ModelB extends Model.Typed({
        components: ['a']
    }) { }

    class SystemA extends System.Typed({
        id: 'SystemA',
        models: {
            modelA:  { model: ModelA, },
            modelBs: { model: ModelB, isSet: true },
        }
    }) { }

    /** @type {Game} */
    let game;

    /** @type {Stage} */
    let stage;

    /** @type {SystemA} */
    let system;


    beforeEach(() => {
        game   = new Game();
        stage  = new Stage(game, 'stage');
        system = new SystemA(stage);
    });

    describe('models', () => {
        describe('model sets', () => {
            it('should create a new set for models where isSet is true', () => {
                assertInstanceOf(system.models.modelBs, Set);
            });
        });
    });

    describe('default models', () => {
        it('should not error when not defining a subclass', () => {
            assertExists(new System(stage));
        })
    });

    describe('game', () => {
        it('should have reference to game', () => {
            assertStrictEquals(system.game, game);
        })
    });

    describe('SystemSet', () => {
        /** @type {SystemSet} */
        let systems;

        /** @type {Spy} */
        let addSpy;
        /** @type {Spy} */
        let deleteSpy;

        /** @type {Spy} */
        let registerSpy;
        /** @type {Spy} */
        let unregisterSpy;

        beforeEach(() => {
            addSpy    = spy();
            deleteSpy = spy();

            registerSpy   = spy();
            unregisterSpy = spy();

            systems = new SystemSet({
                register:   registerSpy,
                unregister: unregisterSpy,
            });

            systems.watch('system:add', addSpy);
            systems.watch('system:delete', deleteSpy);
        });

        describe('add', () => {
            class SystemC extends System.Typed({
                id: 'SystemC',
                models: {
                    modelA: { model: ModelA }
                }
            }) { }

            /** @type {SystemC} */
            let systemC;

            beforeEach(() => {
                systemC = new SystemC(stage);
                systems.add(systemC);
            });

            it('should not error if system already exists', () => {
                systems.add(systemC);
            });

            it('should error if another system with the same name is added', () => {
                assertThrows(() => {
                    systems.add(new SystemC(stage));
                }, `System with id ${systemC.id} already exists`)
            });

            it('should call register when system is added', () => {
                assertSpyCall(registerSpy, 0, { args: [systemC] });
            });

            it('should not call register if system already added ', () => {
                systems.add(systemC);
                assertSpyCalls(registerSpy, 1);
            });

            it('should call system:add event', () => {
                assertSpyCall(addSpy, 0, { args: [{ system: systemC }] });
            });

            it('should not call system:add event if already present', () => {
                systems.add(systemC);
                assertSpyCalls(addSpy, 1);
            });
        });

        describe('delete', () => {
            class SystemC extends System.Typed({
                id: 'SystemC',
                models: {
                    modelA: { model: ModelA }
                }
            }) { }

            /** @type {SystemC} */
            let systemC;

            beforeEach(() => {
                systemC = new SystemC(stage);
                systems.add(systemC);
            });

            it('should return true if system is present', () => {
                assert(systems.delete(systemC));
            });

            it('should return false if system is not present', () => {
                assertFalse(systems.delete(new SystemA(stage)));
            });

            it('should call unregister when system is deleted', () => {
                systems.delete(systemC);
                assertSpyCall(unregisterSpy, 0, { args: [systemC] });
            });

            it('should not call unregister when system is deleted if not present', () => {
                systems.delete(new SystemA(stage));
                assertSpyCalls(unregisterSpy, 0);
            });

            it('should call system:delete event', () => {
                systems.delete(systemC);
                assertSpyCall(deleteSpy, 0, { args: [{ system: systemC }] });
            });

            it('should not call system:delete event if not present', () => {
                systems.delete(new SystemA(stage));
                assertSpyCalls(deleteSpy, 0);
            });
        });
    });
});
