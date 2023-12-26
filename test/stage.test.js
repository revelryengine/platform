import { describe, it, beforeEach, afterEach } from 'https://deno.land/std@0.208.0/testing/bdd.ts';
import { spy, assertSpyCall                  } from 'https://deno.land/std@0.208.0/testing/mock.ts';
import { FakeTime                            } from 'https://deno.land/std@0.208.0/testing/time.ts';

import { assert           } from 'https://deno.land/std@0.208.0/assert/assert.ts';
import { assertEquals     } from 'https://deno.land/std@0.208.0/assert/assert_equals.ts';
import { assertExists     } from 'https://deno.land/std@0.208.0/assert/assert_exists.ts';
import { assertFalse      } from 'https://deno.land/std@0.208.0/assert/assert_false.ts';
import { assertInstanceOf } from 'https://deno.land/std@0.208.0/assert/assert_instance_of.ts';

import { Stage     } from '../lib/stage.js';
import { System    } from '../lib/system.js';
import { Model     } from '../lib/model.js';
import { UUID      } from '../lib/utils/uuid.js';
import { Watchable } from '../lib/utils/watchable.js';

/**
 * @typedef {import('https://deno.land/std@0.208.0/testing/mock.ts').Spy} Spy
 */

describe('Stage', () => {

    class ModelA extends Model.Typed({
        components: {
            a: { type: 'a' },
        },
    }) { }

    class ModelB extends Model.Typed({
        components: {
            a: { type: 'a' },
            b: { type: 'b' },
        }
    }) { }

    class ModelC extends Model.Typed({
        components: {
            c: { type: 'c' },
            d: { type: 'd' },
        }
    }) {
        cleanup() {
            cleanupSpy(this.entity);
        }
    }


    class SystemA extends System.Typed({
        models: {
            modelA:  { model: ModelA },
            modelB:  { model: ModelB },
            modelCs: { model: ModelC, isSet: true },
        }

    }) { }

    class SystemB extends System.Typed({
        models: {
            modelA:  { model: ModelA },
            modelB:  { model: ModelB },
        }
    }) { }

    class Foobar {
        set() {

        }
        toJSON() {
            return { foo: 'bar' }
        }
    }

    /** @type {FakeTime} */
    let time;
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
    /** @type {Spy} */
    let cleanupSpy;

    beforeEach(() => {
        time = new FakeTime();
        stage = new Stage();

        stage.initializers['d'] = (c) => new Foobar();

        entityA = UUID();
        entityB = UUID();

        systemA  = new SystemA({ id: 'systemA' });
        systemB  = new SystemB({ id: 'systemB' });

        stage.systems.add(systemA);
        stage.systems.add(systemB);

        stage.components.add({ entity: entityA, type: 'a', value: 'a' });
        stage.components.add({ entity: entityA, type: 'b', value: 123 });
        stage.components.add({ entity: entityA, type: 'c', value: new Watchable() });
        stage.components.add({ entity: entityA, type: 'd', value: { foo: 'bar' } });

        stage.components.add({ entity: entityB, type: 'a', value: 'a' });
        stage.components.add({ entity: entityB, type: 'b', value: 123 });
        stage.components.add({ entity: entityB, type: 'c', value: new Watchable() });
        stage.components.add({ entity: entityB, type: 'd', value: { foo: 'bar' } });

        cleanupSpy = spy();
    });

    afterEach(() => {
        time.restore();
    });

    describe('components.add', () => {
        it('should add a system property for each matched Model', () => {
            assert(Object.hasOwn(systemA, 'modelA'));
            assert(Object.hasOwn(systemA, 'modelB'));
            assert(Object.hasOwn(systemA, 'modelCs'));

            assert(Object.hasOwn(systemB, 'modelA'));
            assert(Object.hasOwn(systemB, 'modelB'));
        });

        it('should add a system property as as Set when isSet is true', () => {
            assertInstanceOf(systemA.modelCs, Set);
        });

        it('should add each entity to set when isSet is true', () => {
            assertEquals(systemA.modelCs.size, 2);
            assertEquals([...systemA.modelCs][0].entity, entityA);
            assertEquals([...systemA.modelCs][1].entity, entityB);
        });

        it('should share component between models matching the same entity', () => {
            assertEquals(systemA.modelA.components['a'], systemA.modelB.components['a']);
        });

        it('should only create a single model across multiple systems', () => {
            assertEquals(systemA.modelA, systemB.modelA);
        });

        it('should initialize the component value if an initializer is specified', () => {
            assertInstanceOf([...systemA.modelCs][0].d, Foobar);
        });
    });

    describe('components.delete', () => {
        beforeEach(() => {

            stage.components.delete({ entity: entityA, type: 'b' });

            stage.components.delete({ entity: entityB, type: 'a' });
            stage.components.delete({ entity: entityB, type: 'b' });
            stage.components.delete({ entity: entityB, type: 'c' });
            stage.components.delete({ entity: entityB, type: 'd' });
        });

        it('should delete system property when model no longer matches', () => {
            assertEquals(systemA.modelB, undefined);
            assertEquals(systemB.modelB, undefined);
        });

        it('should call model.cleanup on model when model no longer matches', () => {
            assertSpyCall(cleanupSpy, 0, { args: [entityB] });
        });

        it('should remove entities from system property Set when model is removed', () => {
            assertEquals(systemA.modelCs.size, 1);
        });

        it('should return false if component is not present', () => {
            assertFalse(stage.components.delete({ entity: entityA, type: 'e' }));
        });

        it('should return false if entity is not present', () => {
            assertFalse(stage.components.delete({ entity: UUID(), type: 'e' }));
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
                models: {
                    modelA: { model: ModelA }
                }
            }) { }

            /** @type {SystemC} */
            let systemC;

            beforeEach(() => {
                systemC = new SystemC();
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

        it('should notify model:add when all the components for that model are registered', () => {
            systemA.watch('model:add', { handler: ({ model, key}) => handler(model.constructor, key) });

            stage.components.add({ entity: entityC, type: 'a', value: 'a' });
            stage.components.add({ entity: entityD, type: 'a', value: 'a' });
            stage.components.add({ entity: entityD, type: 'b', value: 123 });

            assertSpyCall(handler, 0, { args: [ModelA, 'modelA']});
            assertSpyCall(handler, 1, { args: [ModelA, 'modelA']});
            assertSpyCall(handler, 2, { args: [ModelB, 'modelB']});
        });

        it('should call onModelAdd when all the components for that model are registered', () => {
            systemA.onModelAdd = (model, key) => handler(model.constructor, key);

            stage.components.add({ entity: entityC, type: 'a', value: 'a' });
            stage.components.add({ entity: entityD, type: 'a', value: 'a' });
            stage.components.add({ entity: entityD, type: 'b', value: 123 });

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

    describe('systems.add', () => {
        class SystemC extends System.Typed({
            models: {
                modelA: { model: ModelA }
            }
        }) { }

        /** @type {SystemC} */
        let systemC;

        beforeEach(() => {
            systemC = new SystemC();
            stage.systems.add(systemC);
        });

        it('should add existing components to new system', () => {
            assertExists(systemC.modelA);
        });
    });

    describe('systems.delete', () => {
        beforeEach(() => {
            stage.systems.delete(systemA);
        });

        it('should no longer add models to system', () => {
            const size = systemA.modelCs.size;
            stage.components.add({ entity: UUID(), type: 'c', value: new Watchable });
            assertEquals(systemA.modelCs.size, size);
        });

        it('should delete models that only existed for system that was deleted', () => {
            assertSpyCall(cleanupSpy, 0, { args: [entityA] });
        });
    });

    describe('createEntity', () => {
        beforeEach(() => {
            stage = new Stage();
        })
        it('should create all the components specified sharing the same entity id', () => {
            stage.createEntity({ a: 'a', b: 123, c: new Watchable(), d: { foo: 'bar' } });
            assertEquals(stage.components.count(), 4);
            assertEquals([...stage.components][0].entity, [...stage.components][1].entity);
            assertEquals([...stage.components][0].entity, [...stage.components][2].entity);
            assertEquals([...stage.components][0].entity, [...stage.components][3].entity);
        });

        it('should generate and return a new entity id if not specified', () => {
            assert(UUID.isUUID(stage.createEntity({ a: 'a', b: 123, c: new Watchable() })));
        });
    });

    describe('deleteEntity', () => {
        /**
         * @type {string}
         */
        let entity;

        beforeEach(() => {
            stage = new Stage();
            entity = stage.createEntity({ a: 'a', b: 123, c: new Watchable(), d: { foo: 'bar' } });
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

    describe('systems', () => {
        it('should be a reference to the stage children', () => {
            assertEquals(stage.systems, stage.children);
        });
    });

    describe('game', () => {
        it('should be a reference to the parent game', () => {
            stage.parent = /** @type {import('../lib/game.js').Game} */({});
            assertEquals(stage.game, stage.parent);
        });
    });
});
