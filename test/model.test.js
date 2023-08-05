import { describe, it, beforeEach           } from 'std/testing/bdd.ts';
import { assertEquals                       } from 'std/testing/asserts.ts';
import { spy, assertSpyCall, assertSpyCalls } from 'std/testing/mock.ts';

import { Game   } from '../lib/game.js';
import { Stage  } from '../lib/stage.js';
import { System } from '../lib/system.js';
import { Model  } from '../lib/model.js';
import { UUID   } from '../lib/utils/uuid.js';

/** @typedef {import('std/testing/mock.ts').Spy} Spy */
/** @typedef {import('../lib/stage.js').Component} Component */
/** @typedef {import('../lib/utils/watchable.js').WatchHandler} WatchHandler */
/** @typedef {import('../lib/utils/watchable.js').WatchOptions} WatchOptions */


describe('Model', () => {
    /**
     * @extends {Model<{ a: string, b: string }>} 
     */
    class ModelA extends Model {
        static components = {
            a: { type: 'a' }, 
            b: { type: 'b' },
        }
    }

    /**
     * @extends {Model<{ a: string }>} 
     */
    class ModelB extends Model {
        static components = {
            a: { type: 'a' },
        }
    }

    class SystemA extends System {
        static models = {
            modelA:  { model: ModelA },
            modelBs: { model: ModelB },
            modelC:  { model: Model  },
        }
    }
    /** @type {string} */
    let componentAId;
    /** @type {string} */
    let componentBId; 
    /** @type {Component} */
    let componentA;
    /** @type {Component} */
    let componentB;
    /** @type {string} */
    let entityId;

    /** @type {Game} */
    let game;
    /** @type {Stage} */
    let stage;
    /** @type {System} */
    let system;
    /** @type {ModelA} */
    let modelA;

    beforeEach(() => {
        game   = new Game();
        stage  = new Stage();
        system = new SystemA();

        game.stages.add(stage);

        stage.systems.add(system);

        entityId = UUID();
        componentAId = UUID();
        componentBId = UUID();

        stage.components.add({ id: componentAId, entityId, type: 'a', value: 'valueA' });
        stage.components.add({ id: componentBId, entityId, type: 'b', value: 'valueB' });

        modelA = /** @type {ModelA} */(stage.getEntityById(entityId)?.models.getByClass(ModelA));

        componentA = /** @type {Component} */(stage.components.getById(componentAId));
        componentB = /** @type {Component} */(stage.components.getById(componentBId));
    });

    describe('components', () => {
        it('should have model property references to the component values', () => {
            assertEquals(modelA.a, componentA.value);
            assertEquals(modelA.b, componentB.value);
        });

        it('should update the component values when updating the model properties', () => {
            modelA.a = 'updatedA';
            modelA.b = 'updatedB';
            assertEquals(componentA.value, 'updatedA');
            assertEquals(componentB.value, 'updatedB');
        });
    });

    describe('watching', () => {
        let /** @type {Spy} */handler, /** @type {WatchOptions} */options;

        describe('all components', () => {
            beforeEach(() => {
                handler = spy();
                options = { handler };
                modelA.watch(options);
            });
    
            describe('watch', () => {
                it('should watch all components for changes', async () => {
                    modelA.a = 'testA';
                    modelA.b = 'testB';
                    await null;
                    assertSpyCall(handler, 0, { args: [new Map([['a', ['valueA']], ['b', ['valueB']]])] });
                });
            });
    
            describe('unwatch', () => {
                it('should unwatch all components', async () => {
                    modelA.unwatch(options);
                    modelA.a = 'testA';
                    modelA.b = 'testB';
                    await null;
                    assertSpyCalls(handler, 0);
                });
            });    
        })
        
        describe('immediate=true', () => {
            beforeEach(() => {
                handler = spy();
                options = { handler, immediate: true };
                modelA.watch(options);
            });

            it('should call the watcher immediately for all components that change', async () => {
                modelA.a = 'testA';
                modelA.b = 'testB';
                assertSpyCall(handler, 0, { args: ['a', 'valueA'] });
                assertSpyCall(handler, 1, { args: ['b', 'valueB'] });
                assertSpyCalls(handler, 2);
            });
        });

        describe('watch individual property', () => {
            beforeEach(() => {
                handler = spy();
                options = { handler, type: 'a' };
                modelA.watch(options);
            });


            it('should watch only component specified', async () => {
                modelA.a = 'testA';
                modelA.b = 'testB';
                await null;
                assertSpyCall(handler, 0, { args: ['valueA'] });
                assertSpyCalls(handler, 1);
            });
        });
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
});
