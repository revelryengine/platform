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
 *   d: { value: { foo: string }, complex: import('../lib/stage.js').ComplexComponentValue },
 * }} ComponentTypes
 */

/**
 * @template {Extract<keyof ComponentTypes, string>} [K = Extract<keyof ComponentTypes, string>]
 * @typedef {import('../lib/stage.js').Component<ComponentTypes, K>} Component
 */

/**
 * @template {Extract<keyof ComponentTypes, string>} [K = Extract<keyof ComponentTypes, string>]
 * @typedef {import('../lib/stage.js').ComponentData<ComponentTypes, K>} ComponentData
 */

/**
 * @template {Extract<keyof ComponentTypes, string>} [K = Extract<keyof ComponentTypes, string>]
 * @typedef {import('../lib/stage.js').ComponentReference<ComponentTypes, K>} ComponentReference
 */

const types = /** @type {ComponentTypes} */({});

describe('Model', () => {
    
    class ModelA extends Model.define({ 
        a: { type: 'a' }, 
        b: { type: 'b' },
        c: { type: 'c' },
    }, types) { }

    class SystemA extends System.define({
        modelA:  { model: ModelA },
    }, types) { }

    /** @type {FakeTime} */
    let time;

    /** @type {string} */
    let componentAId;
    /** @type {string} */
    let componentBId; 
    /** @type {string} */
    let componentCId; 

    /** @type {ComponentData<'a'>} */
    let componentA;
    /** @type {ComponentData<'b'>} */
    let componentB;
    /** @type {ComponentData<'c'>} */
    let componentC;
    /** @type {string} */
    let entityId;

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

        entityId = UUID();
        componentAId = UUID();
        componentBId = UUID();
        componentCId = UUID();

        stage.components.add({ id: componentAId, entityId, type: 'a', value: 'abc' });
        stage.components.add({ id: componentBId, entityId, type: 'b', value: 123 });
        stage.components.add({ id: componentCId, entityId, type: 'c', value: new Watchable() });

        modelA = /** @type {ModelA} */(stage.getEntityById(entityId)?.models.getByClass(ModelA));

        componentA = /** @type {ComponentData<'a'>} */(stage.components.getById(componentAId));
        componentB = /** @type {ComponentData<'b'>} */(stage.components.getById(componentBId));
        componentC = /** @type {ComponentData<'c'>} */(stage.components.getById(componentCId));
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
        it('should be a reference to the entity stage', () => {
            assertEquals(modelA.stage, stage);
        });
    });

    describe('game', () => {
        it('should be a reference to the entity stage game', () => {
            assertEquals(modelA.game, game);
        });
    });

    describe('default components', () => {
        it('should not error when using the base Model class', () => {
            stage.systems.add(new (System.define({ modelA: { model: Model } }, types)));
            stage.components.add({ id: UUID(), entityId: UUID(), type: 'a', value: 'a' });
        });
    });
});
