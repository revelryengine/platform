import { describe, it, beforeEach, afterEach } from 'std/testing/bdd.ts';
import { spy, assertSpyCall, assertSpyCalls  } from 'std/testing/mock.ts';
import { FakeTime                            } from 'std/testing/time.ts';

import { assertEquals } from 'std/assert/assert_equals.ts';

import { Game      } from '../lib/game.js';
import { Stage     } from '../lib/stage.js';
import { System    } from '../lib/system.js';
import { Model     } from '../lib/model.js';
import { UUID      } from '../lib/utils/uuid.js';
import { Watchable } from '../lib/utils/watchable.js';

/** @typedef {import('std/testing/mock.ts').Spy} Spy */

/**
 * @typedef {{  
 *   a: { value: string },
 *   b: { value: number },
 *   c: { value: import('../lib/utils/watchable.js').Watchable },
 *   d: { value: import('../lib/component.js').ComplexComponentValue, json: { foo: string } },
 * }} ComponentTypes
 */

/**
 * @template {Extract<keyof ComponentTypes, string>} [K = Extract<keyof ComponentTypes, string>]
 * @typedef {import('../lib/component.js').Component<ComponentTypes, K>} Component
 */

/**
 * @template {Extract<keyof ComponentTypes, string>} [K = Extract<keyof ComponentTypes, string>]
 * @typedef {import('../lib/component.js').ComponentData<ComponentTypes, K>} ComponentData
 */

/**
 * @template {Extract<keyof ComponentTypes, string>} [K = Extract<keyof ComponentTypes, string>]
 * @typedef {import('../lib/component.js').ComponentReference<ComponentTypes, K>} ComponentReference
 */

describe('Model', () => {
    const types = /** @type {ComponentTypes} */({});
    const TypedModel  = Model.Typed(types);
    const TypedSystem = System.Typed(types);

    class ModelA extends TypedModel({
        components: {
            a: { type: 'a' }, 
            b: { type: 'b' },
            c: { type: 'c' },
        }
    }) { }

    class SystemA extends TypedSystem({
        models: {
            modelA: { model: ModelA },
        },
    }) { }

    /** @type {FakeTime} */
    let time;

    /** @type {ComponentData<'a'>} */
    let componentA;
    /** @type {ComponentData<'b'>} */
    let componentB;
    /** @type {ComponentData<'c'>} */
    let componentC;
    /** @type {string} */
    let entity;

    /** @type {Game} */
    let game;
    /** @type {Stage<ComponentTypes>} */
    let stage;
    /** @type {SystemA} */
    let system;
    /** @type {ModelA} */
    let modelA;

    beforeEach(() => {
        time   = new FakeTime();
        game   = new Game();
        stage  = new Stage();
        system = new SystemA();

        game.stages.add(stage);

        stage.systems.add(system);

        entity = UUID();

        stage.components.add({ entity, type: 'a', value: 'abc' });
        stage.components.add({ entity, type: 'b', value: 123 });
        stage.components.add({ entity, type: 'c', value: new Watchable() });

        modelA = system.modelA;

        componentA = /** @type {ComponentData<'a'>} */(stage.components.find({ entity, type: 'a' }));
        componentB = /** @type {ComponentData<'b'>} */(stage.components.find({ entity, type: 'b' }));
        componentC = /** @type {ComponentData<'c'>} */(stage.components.find({ entity, type: 'c' }));
    });

    afterEach(() => {
        time.restore();
    });

    describe('components', () => {
        it('should have model property references to the component values', () => {
            assertEquals(modelA.a, componentA.value);
            assertEquals(modelA.b, componentB.value);
        });

        it('should update the component values when updating the model properties', () => {
            modelA.a = 'def';
            modelA.b = 456;
            assertEquals(componentA.value, 'def');
            assertEquals(componentB.value, 456);
        });
    });

    describe('watching', () => {
        let /** @type {Spy} */handler;

        describe('all components', () => {
            beforeEach(() => {
                handler = spy();
                modelA.watch(handler);
            });
    
            describe('watch', () => {
                it('should watch all components for changes', async () => {
                    modelA.a = 'def';
                    modelA.b = 456;
                    await time.runMicrotasks();
                    assertSpyCalls(handler, 1);
                    assertEquals(handler.calls[0].args[0].get('a:change'), 'abc');
                    assertEquals(handler.calls[0].args[0].get('b:change'), 123);
                });
            });
    
            describe('unwatch', () => {
                it('should unwatch all components', async () => {
                    modelA.unwatch(handler);
                    modelA.a = 'def';
                    modelA.b = 456;
                    await time.runMicrotasks();
                    assertSpyCalls(handler, 0);
                });
            });    
        })
        
        describe('immediate=true', () => {
            beforeEach(() => {
                handler = spy();
                modelA.watch({ handler, immediate: true });
            });

            it('should call the watcher immediately for all components that change', async () => {
                modelA.a = 'def';
                modelA.b = 456;
                assertSpyCall(handler, 0, { args: ['a:change', 'abc'] });
                assertSpyCall(handler, 1, { args: ['b:change', 123] });
                assertSpyCalls(handler, 2);
            });
        });

        describe('watch individual property', () => {
            beforeEach(() => {
                handler = spy();
                modelA.watch('a:change', handler);
            });


            it('should watch only component specified', async () => {
                modelA.a = 'def';
                modelA.b = 456;
                await time.runMicrotasks();
                assertSpyCall(handler, 0, { args: ['abc'] });
                assertSpyCalls(handler, 1);
            });
        });

        describe('watchable component value', () => {
            beforeEach(() => {
                handler = spy();
                modelA.watch('c:notify', handler);
            });

            it('should capture component value notify events', async () => {
                componentC.value.notify('c', 'test1');
                componentC.value.notify('d', 'test2');
                await time.runMicrotasks();
                assertSpyCall(handler, 0, { args: [new Map([['c', 'test1'], ['d', 'test2']])] });
                assertSpyCalls(handler, 1);
            });
        })
    });

    describe('stage', () => {
        it('should be a reference to the stage', () => {
            assertEquals(modelA.stage, stage);
        });
    });

    describe('game', () => {
        it('should be a reference to the stage game', () => {
            assertEquals(modelA.game, game);
        });
    });

    describe('default components', () => {
        it('should not error when using the base Model class', () => {
            stage.systems.add(new (TypedSystem({ models: { modelA: { model: Model } } })));
            stage.components.add({ entity: UUID(), type: 'a', value: 'a' });
        });
    });
});
