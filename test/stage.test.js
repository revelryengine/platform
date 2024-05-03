import { describe, it, beforeEach, afterEach } from 'https://deno.land/std@0.208.0/testing/bdd.ts';
import { spy, assertSpyCall, assertSpyCalls  } from 'https://deno.land/std@0.208.0/testing/mock.ts';
import { FakeTime                            } from 'https://deno.land/std@0.208.0/testing/time.ts';

import { assert           } from 'https://deno.land/std@0.208.0/assert/assert.ts';
import { assertEquals     } from 'https://deno.land/std@0.208.0/assert/assert_equals.ts';
import { assertExists     } from 'https://deno.land/std@0.208.0/assert/assert_exists.ts';
import { assertFalse      } from 'https://deno.land/std@0.208.0/assert/assert_false.ts';
import { assertInstanceOf } from 'https://deno.land/std@0.208.0/assert/assert_instance_of.ts';

import { Game, Stage, System, Model, UUID, componentSchemas, assetLoaders, unregisterSchema, unregisterLoader } from '../lib/ecs.js';

/**
 * @import { Spy } from 'https://deno.land/std@0.208.0/testing/mock.ts'
 */

describe('Stage', () => {

    class ModelA extends Model.Typed({
        components: ['a']
    }) { }

    class ModelB extends Model.Typed({
        components: ['a', 'b']
    }) { }

    class ModelC extends Model.Typed({
        components: ['c', 'd']
    }) { }


    class SystemA extends System.Typed({
        id: 'systemA',
        models: {
            modelA:  { model: ModelA },
            modelB:  { model: ModelB },
            modelCs: { model: ModelC, isSet: true },
        }

    }) { }

    class SystemB extends System.Typed({
        id: 'systemB',
        models: {
            modelA:  { model: ModelA },
            modelB:  { model: ModelB },
        }
    }) { }

    /** @type {FakeTime} */
    let time;
    /** @type {Game} */
    let game;

    /** @type {Stage} */
    let stage;
    /** @type {SystemA} */
    let systemA;
    /** @type {SystemB} */
    let systemB;
    /** @type {string} */
    let entityA;
    /** @type {string} */
    let entityB;
    /** @type {Spy} */
    let handler;

    beforeEach(() => {
        time  = new FakeTime();
        game  = new Game();
        stage = new Stage(game, 'stage');

        // stage.initializers['d'] = () => new Foobar();

        entityA = UUID();
        entityB = UUID();

        systemA  = new SystemA(stage);
        systemB  = new SystemB(stage);

        stage.systems.add(systemA);
        stage.systems.add(systemB);

        stage.createComponent({ entity: entityA, type: 'a', value: 'a'  });
        stage.createComponent({ entity: entityA, type: 'b', value: 123  });
        stage.createComponent({ entity: entityA, type: 'c', value: true });
        stage.createComponent({ entity: entityA, type: 'd', value: { a: 'a' } });

        stage.createComponent({ entity: entityB, type: 'a', value: 'a'  });
        stage.createComponent({ entity: entityB, type: 'b', value: 123  });
        stage.createComponent({ entity: entityB, type: 'c', value: true });
        stage.createComponent({ entity: entityB, type: 'd', value: { a: 'a' } });
    });

    afterEach(() => {
        time.restore();
    });

    describe('createComponent', () => {
        it('should add a system property for each matched Model', () => {
            assert(Object.hasOwn(systemA.models, 'modelA'));
            assert(Object.hasOwn(systemA.models, 'modelB'));
            assert(Object.hasOwn(systemA.models, 'modelCs'));

            assert(Object.hasOwn(systemB.models, 'modelA'));
            assert(Object.hasOwn(systemB.models, 'modelB'));
        });

        it('should add a system property as as Set when isSet is true', () => {
            assertInstanceOf(systemA.models.modelCs, Set);
        });

        it('should add each entity to set when isSet is true', () => {
            assertEquals(systemA.models.modelCs.size, 2);
            assertEquals([...systemA.models.modelCs][0].entity, entityA);
            assertEquals([...systemA.models.modelCs][1].entity, entityB);
        });

        it('should share component between models matching the same entity', () => {
            assertEquals(systemA.models.modelA.components['a'], systemA.models.modelB.components['a']);
        });

        it('should only create a single model across multiple systems', () => {
            assertEquals(systemA.models.modelA, systemB.models.modelA);
        });
    });

    describe('deleteComponent', () => {
        beforeEach(() => {

            stage.deleteComponent({ entity: entityA, type: 'b' });

            stage.deleteComponent({ entity: entityB, type: 'a' });
            stage.deleteComponent({ entity: entityB, type: 'b' });
            stage.deleteComponent({ entity: entityB, type: 'c' });
            stage.deleteComponent({ entity: entityB, type: 'd' });
        });

        it('should delete system property when model no longer matches', () => {
            assertEquals(systemA.models.modelB, undefined);
            assertEquals(systemB.models.modelB, undefined);
        });

        it('should remove entities from system property Set when model is removed', () => {
            assertEquals(systemA.models.modelCs.size, 1);
        });

        it('should return false if component is not present', () => {
            assertFalse(stage.deleteComponent({ entity: entityA, type: 'e' }));
        });

        it('should return false if entity is not present', () => {
            assertFalse(stage.deleteComponent({ entity: UUID(), type: 'e' }));
        });
    });

    describe('stage events', () => {
        /** @type {string} */
        let entityC;
        /** @type {string} */
        let entityD;

        beforeEach(() => {
            entityC = UUID();
            entityD = UUID();
            handler = spy();
        });

        describe('system:add', () => {
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
                stage.watch('system:add', handler);
                stage.systems.add(systemC);
            });

            it('should notify system:add when a new system is added', () => {
                assertSpyCall(handler, 0, { args: [{ system: systemC }]});
            });

        });

        describe('system:delete', () => {
            beforeEach(() => {
                stage.watch('system:delete', handler);
                stage.systems.delete(systemA);
            });

            it('should notify system:delete when a system is deleted', () => {
                assertSpyCall(handler, 0, { args: [{ system: systemA }]});
            });
        });

        describe('system:registered', () => {
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
                stage.watch('system:registered', handler);
                stage.systems.add(systemC);
            });

            it('should notify system:registered when a new system is added', () => {
                assertSpyCall(handler, 0, { args: [{ system: systemC }]});
            });

        });

        describe('system:unregistered', () => {
            beforeEach(() => {
                stage.watch('system:unregistered', handler);
                stage.systems.delete(systemA);
            });

            it('should notify system:unregistered when a system is deleted', () => {
                assertSpyCall(handler, 0, { args: [{ system: systemA }]});
            });
        });

        it('should notify model:add when all the components for that model are registered', () => {
            systemA.watch('model:add', { handler: ({ model, key}) => handler(model.constructor, key) });

            stage.createComponent({ entity: entityC, type: 'a', value: 'a' });
            stage.createComponent({ entity: entityD, type: 'a', value: 'a' });
            stage.createComponent({ entity: entityD, type: 'b', value: 123 });

            assertSpyCall(handler, 0, { args: [ModelA, 'modelA']});
            assertSpyCall(handler, 1, { args: [ModelA, 'modelA']});
            assertSpyCall(handler, 2, { args: [ModelB, 'modelB']});
        });

        it('should call onModelAdd when all the components for that model are registered', () => {
            systemA.onModelAdd = (model, key) => handler(model.constructor, key);

            stage.createComponent({ entity: entityC, type: 'a', value: 'a' });
            stage.createComponent({ entity: entityD, type: 'a', value: 'a' });
            stage.createComponent({ entity: entityD, type: 'b', value: 123 });

            assertSpyCall(handler, 0, { args: [ModelA, 'modelA'] });
            assertSpyCall(handler, 1, { args: [ModelA, 'modelA'] });
            assertSpyCall(handler, 2, { args: [ModelB, 'modelB'] });
        });

        it('should notify model:delete when all the components for that model are unregistered', () => {
            systemA.watch('model:delete', { handler: ({ model, key}) => handler(model.constructor, key) });

            stage.components.delete({ entity: entityA, type: 'a' });

            assertSpyCall(handler, 0, { args: [ModelA, 'modelA'] });
            assertSpyCall(handler, 1, { args: [ModelB, 'modelB'] });
        });

        it('should call onModelDelete when all the components for that model are deleted if defined', () => {
            systemA.onModelDelete = (model, key) => handler(model.constructor, key);

            stage.components.delete({ entity: entityA, type: 'a' });

            assertSpyCall(handler, 0, { args: [ModelA, 'modelA'] });
            assertSpyCall(handler, 1, { args: [ModelB, 'modelB'] });
        });
    });

    describe('createSystem', () => {
        class SystemC extends System.Typed({
            id: 'SystemC',
            models: {
                modelA: { model: ModelA }
            }
        }) { }

        /** @type {SystemC} */
        let systemC;

        beforeEach(() => {
            systemC = stage.createSystem(SystemC);
        });

        it('should add existing components to new system', () => {
            assertExists(systemC.models.modelA);
        });
    });

    describe('deleteSystem', () => {
        beforeEach(() => {
            stage.deleteSystem(SystemA);
        });

        it('should no longer add models to system', () => {
            const size = systemA.models.modelCs.size;
            stage.createComponent({ entity: UUID(), type: 'c', value: true });
            assertEquals(systemA.models.modelCs.size, size);
        });

        it('should return false if System is not present', () => {
            assertFalse(stage.deleteSystem(SystemA));
        });
    });

    describe('createEntity', () => {
        beforeEach(() => {
            stage = new Stage(game, 'stage');
        })
        it('should create all the components specified sharing the same entity id', () => {
            stage.createEntity({ a: 'a', b: 123, c: true, d: { a: 'a' } });

            assertEquals(stage.components.count(), 4);
            assertEquals([...stage.components][0].entity, [...stage.components][1].entity);
            assertEquals([...stage.components][0].entity, [...stage.components][2].entity);
            assertEquals([...stage.components][0].entity, [...stage.components][3].entity);
        });

        it('should generate and return a new entity id if not specified', () => {
            assert(UUID.isUUID(stage.createEntity({ a: 'a', b: 123, c: true, d: { a: 'a' } })));
        });
    });

    describe('deleteEntity', () => {
        /**
         * @type {string}
         */
        let entity;

        beforeEach(() => {
            stage = new Stage(game, 'stage');
            entity = stage.createEntity({ a: 'a', b: 123, c: true, d: { a: 'a' } });
        })
        it('should delete all the components for the specified entity', () => {
            assertEquals(stage.components.count(), 4);
            assertEquals([...stage.components][0].entity, [...stage.components][1].entity);
            assertEquals([...stage.components][0].entity, [...stage.components][2].entity);
            assertEquals([...stage.components][0].entity, [...stage.components][3].entity);

            stage.deleteEntity(entity);

            assertEquals(stage.components.count(), 0);
        });

        it('should return the number of components deleted ', () => {
            assertEquals(stage.deleteEntity(entity), 4);
        });
    });

    describe('getEntityModel', () => {
        it('should return an existing model for a given entity', () => {
            assertInstanceOf(stage.getEntityModel(entityA, ModelA), ModelA);
        });
    });


    describe('update', () => {
        /** @type {SystemA} */
        let systemA;
        /** @type {SystemB} */
        let systemB;

        /** @type {Spy} */
        let updateA;
        /** @type {Spy} */
        let updateB;

        beforeEach(() => {
            stage   = new Stage(game, 'stage');
            systemA = new SystemA(stage);
            systemB = new SystemB(stage);

            stage.systems.add(systemA);
            stage.systems.add(systemB);

            updateA = spy(systemA, 'update');
            updateB = spy(systemB, 'update');
        });

        it('should call update on all stages', () => {
            stage.update(1);
            assertSpyCalls(updateA, 1);
            assertSpyCalls(updateB, 1);
        });
    });

    describe('render', () => {
        /** @type {SystemA} */
        let systemA;
        /** @type {SystemB} */
        let systemB;

        /** @type {Spy} */
        let renderA;
        /** @type {Spy} */
        let renderB;

        beforeEach(() => {
            stage   = new Stage(game, 'stage');
            systemA = new SystemA(stage);
            systemB = new SystemB(stage);

            stage.systems.add(systemA);
            stage.systems.add(systemB);

            renderA = spy(systemA, 'render');
            renderB = spy(systemB, 'render');
        });

        it('should call render on all stages', () => {
            stage.render();
            assertSpyCalls(renderA, 1);
            assertSpyCalls(renderB, 1);
        });
    });

    describe('loadFile', () => {
        /**
         * @type {Stage}
         */
        let stageA;

        /**
         * @type {Stage}
         */
        let stageB;

        beforeEach(async () => {
            stageA = game.createStage('a');
            stageB = game.createStage('b');

            await stageA.loadFile(import.meta.resolve('./fixtures/a.revstg'));
            await stageB.loadFile(import.meta.resolve('./fixtures/b.revstg'));
        });

        afterEach(() => {
            unregisterSchema('a');
            unregisterSchema('b');
            unregisterSchema('c');
            unregisterSchema('d');
            unregisterSchema('f');
            unregisterLoader('f');
        });

        it('should add systems to each stage', () => {
            assert(stageA.getContext('system-a'));
            assert(stageA.getContext('system-b'));

            assert(stageB.getContext('system-c'));
        });

        it('should registerSchemas from bundle', () => {
            assert(componentSchemas['a']);
            assert(componentSchemas['b']);
            assert(componentSchemas['c']);
            assert(componentSchemas['d']);
            assert(componentSchemas['f']);
        });

        it('should registerLoaders from bundle', () => {
            assert(assetLoaders['f']);
        });

        it('should call load if present in the bundle', () => {
            // @ts-expect-error
            assert(stageB.getContext('system-c').loadCalled);
        });

        it('should support recursive loading', async () => {
            assert(stageB.getContext('system-b'));
        });

        it('should throw DOMException on abort', async () => {
            const abortCtrl = new AbortController();

            let error;
            stageA.loadFile(import.meta.resolve('./fixtures/a.revstg'), abortCtrl.signal).catch(e => error = e);
            abortCtrl.abort();
            await time.runMicrotasks();
            assertInstanceOf(error, DOMException);
        });
    });
});
