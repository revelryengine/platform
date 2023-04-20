import { describe, it, beforeEach                 } from 'std/testing/bdd.ts';
import { assertEquals, assertExists, assertThrows } from 'std/testing/asserts.ts';
import { spy, assertSpyCall, assertSpyCalls       } from 'std/testing/mock.ts';


import { Game   } from '../../lib/game.js';
import { Stage  } from '../../lib/stage.js';
import { System } from '../../lib/system.js';
import { Model  } from '../../lib/model.js';
import { UUID   } from '../../lib/utils/uuid.js';

describe('Model', () => {
    let componentAId, componentBId, componentA, componentB, entityId, game, stage, system, modelA;

    class ModelA extends Model {
        static get components() {
            return { 
                a: { type: 'a' }, 
                b: { type: 'b' }, 
            };
        }
    }

    class ModelB extends Model {
        static get components() {
            return { 
                a: { type: 'a' },
            };
        }
    }

    class SystemA extends System {
        static get models() {
            return {
                modelA:  { model: ModelA },
                modelBs: { model: ModelB },
            }
        }
    }

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
        
        modelA = stage.getEntityById(entityId).models.getByClass(ModelA);

        componentA = stage.components.getById(componentAId);
        componentB = stage.components.getById(componentBId);
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
        let handler, watcher;
        beforeEach(() => {
            handler = spy();
            watcher = modelA.watch(handler);
        });

        describe('watch', () => {
            it('should watch all components for changes', async () => {
                modelA.a = 'testA';
                modelA.b = 'testB';
                await null;
                assertSpyCall(handler, 0, { args: [new Map([['a', 'valueA'], ['b', 'valueB']])] });
            });

            it('should return a watcher object containing the original handler and an unwatch method', async () => {
                assertEquals(watcher.handler, handler);
                watcher.unwatch();
                modelA.a = 'testA';
                modelA.b = 'testB';
                await null;
                assertSpyCalls(handler, 0);
            });
        });

        describe('unwatch', () => {
            it('should unwatch all components', async () => {
                modelA.unwatch(handler);
                modelA.a = 'testA';
                modelA.b = 'testB';
                await null;
                assertSpyCalls(handler, 0);
            });
        });
        describe('notify', () => {
            it('should notify all components of changes', async () => {
                modelA.notify();
                await null;
                assertSpyCall(handler, 0, { args: [new Map([['a', undefined], ['b', undefined]])] });
            });
    
            it('should notify all components of changes with the specified oldValue', async () => {
                modelA.notify({ a: 'oldValueA', b: 'oldValueB' });
                await null;
                assertSpyCall(handler, 0, { args: [new Map([['a', 'oldValueA'], ['b', 'oldValueB']])] });
            });
        });

        describe('immediate=true', () => {
            let handler;
            beforeEach(() => {
                handler = spy();
                modelA.watch({ handler, immediate: true });
            });

            it('should call the watcher immediately for all components that change', async () => {
                modelA.a = 'testA';
                modelA.b = 'testB';
                assertSpyCall(handler, 0, { args: ['a', 'valueA'] });
                assertSpyCall(handler, 1, { args: ['b', 'valueB'] });
                assertSpyCalls(handler, 2);
            });
        });

        describe('watchProp', () => {
            let handler, watcher;
            beforeEach(() => {
                handler = spy();
                watcher = modelA.watchProp('a', handler);
            });

            it('should return an object containing the original watch handler, an unwatch method and the component the watcher was attached to', async () => {
                assertEquals(watcher.component, modelA.components.get('a'));
                assertEquals(watcher.handler, handler);
                assertExists(watcher.immediate);

                watcher.unwatch();
                modelA.a = 'testA';
                await null;
                assertSpyCalls(handler, 0);
            });

            it('should watch only component specified', async () => {
                modelA.a = 'testA';
                modelA.b = 'testB';
                await null;
                assertSpyCall(handler, 0, { args: [watcher.component, 'valueA'] });
                assertSpyCalls(handler, 1);
            });

            it('should throw an error if prop does not exist on model', () => {
                assertThrows(() => {
                    modelA.watchProp('x', () => {});
                }, Error, 'Component property missing')
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

    describe('default components', () => {
        it('should not error when not defining a subclass', () => {
            assertExists(new Model());
        })
    });
});
