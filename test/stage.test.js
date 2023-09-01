import { describe, it, beforeEach, afterEach } from 'std/testing/bdd.ts';
import { spy, assertSpyCall, assertSpyCalls  } from 'std/testing/mock.ts';
import { FakeTime                            } from 'std/testing/time.ts';

import { assert           } from 'std/assert/assert.ts';
import { assertEquals     } from 'std/assert/assert_equals.ts';
import { assertExists     } from 'std/assert/assert_exists.ts';
import { assertFalse      } from 'std/assert/assert_false.ts';
import { assertThrows     } from 'std/assert/assert_throws.ts';
import { assertInstanceOf } from 'std/assert/assert_instance_of.ts';

import { Stage     } from '../lib/stage.js';
import { System    } from '../lib/system.js';
import { Model     } from '../lib/model.js';
import { UUID      } from '../lib/utils/uuid.js';
import { Watchable } from '../lib/utils/watchable.js';

/**
 * @typedef {import('std/testing/mock.ts').Spy} Spy
 */

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
 * @template {Extract<keyof ComponentTypes, string>} [K = Extract<keyof ComponentTypes, string>]
 * @typedef {import('../lib/stage.js').ComponentReference<ComponentTypes, K>} ComponentReference
 */

describe('Stage', () => {
    const types = /** @type {ComponentTypes} */({});
    const TypedModel  = Model.Typed(types);
    const TypedSystem = System.Typed(types);


    class ModelA extends TypedModel({
        components: {
            a: { type: 'a' },
        },
    }) { }
        

    class ModelB extends TypedModel({
        components: {
            a: { type: 'a' },
            b: { type: 'b' },
        }
    }) {
        cleanup() {
            cleanupSpy(this.entity.id);
        }
    }

    class ModelC extends TypedModel({
        components: {
            c: { type: 'c' },
            d: { type: 'd' },
        }
    }) { }


    class SystemA extends TypedSystem({
        models: {
            modelA:  { model: ModelA },
            modelB:  { model: ModelB },
            modelCs: { model: ModelC, isSet: true },
        }
        
    }) { }

    class SystemB extends TypedSystem({
        models: {
            modelA:  { model: ModelA },
            modelB:  { model: ModelB },
            modelCs: { model: ModelC, isSet: true },
        }
    }) { }

    class Initializer {
        #value;

        /**
         * @param {ComponentTypes['d']['value'] | ComponentTypes['d']['complex']} value
         */
        constructor(value) {
            this.#value = value;
        }

        /**
         * @param {ComponentTypes['d']['value']} value
         */
        set(value) {
            this.#value = value;
        }

        toJSON() {
            return this.#value;
        }
    }

    /** @type {FakeTime} */
    let time;
    /** @type {Stage<ComponentTypes>} */
    let stage;
    /** @type {SystemA} */
    let systemA;
    /** @type {SystemB} */
    let systemB;
    /** @type {string} */
    let entityA; 
    /** @type {string} */
    let entityB;
    /** @type {string} */
    let componentA;
    /** @type {string} */
    let componentB;
    /** @type {string} */
    let componentC;
    /** @type {string} */
    let componentD;
    /** @type {string} */
    let componentE;
    /** @type {string} */
    let componentF;
    /** @type {string} */
    let componentG;
    /** @type {string} */
    let componentH;
    /** @type {Spy} */
    let handler;
    /** @type {Spy} */
    let cleanupSpy;

    beforeEach(() => {
        time = new FakeTime();
        stage = new Stage();

        stage.initializers['d'] = (c) => new Initializer(c.value);

        entityA = UUID();
        entityB = UUID();

        componentA = UUID();
        componentB = UUID();
        componentC = UUID();
        componentD = UUID();
        componentE = UUID();
        componentF = UUID();
        componentG = UUID();
        componentH = UUID();

        systemA  = new SystemA('systemA');
        systemB  = new SystemB('systemB');
        
        stage.systems.add(systemA);
        stage.systems.add(systemB);

        stage.components.add({ id: componentA, entityId: entityA, type: 'a', value: 'a' });
        stage.components.add({ id: componentB, entityId: entityA, type: 'b', value: 123 });
        stage.components.add({ id: componentC, entityId: entityA, type: 'c', value: new Watchable() });

        stage.components.add({ id: componentD, entityId: entityB, type: 'a', value: 'a' });
        stage.components.add({ id: componentE, entityId: entityB, type: 'b', value: 123 });
        stage.components.add({ id: componentF, entityId: entityB, type: 'c', value: new Watchable() });

        stage.components.add({ id: componentG, entityId: entityA, type: 'd', value: { foo: 'bar' } });
        stage.components.add({ id: componentH, entityId: entityB, type: 'd', value: { foo: 'bar' } });
    });

    afterEach(() => {
        time.restore();
    });

    describe('components.add', () => {
        describe('getEntityById', () => {
            it('should return an entity for components added', () => {
                assertExists(stage.getEntityById(entityA));
                assertExists(stage.getEntityById(entityB));
            });
        });

        it('should add a system property for each matched Model', () => {
            assert(Object.hasOwn(systemA, 'modelA'));
            assert(Object.hasOwn(systemA, 'modelB'));
            assert(Object.hasOwn(systemA, 'modelCs'));

            assert(Object.hasOwn(systemB, 'modelA'));
            assert(Object.hasOwn(systemB, 'modelB'));
            assert(Object.hasOwn(systemB, 'modelCs'));
        });
    
        it('should add a system property as as Set when isSet is true', () => {
            assertInstanceOf(systemA.modelCs, Set);
            assertInstanceOf(systemB.modelCs, Set);
        });
    
        it('should add each entity to set when isSet is true', () => {
            assertEquals(systemA.modelCs.size, 2);
            assertEquals(systemB.modelCs.size, 2);
            assertEquals([...systemA.modelCs][0].entity.id, entityA);
            assertEquals([...systemA.modelCs][1].entity.id, entityB);
        });
    
    
        it('should share component between models matching the same entity', () => {
            assertEquals(systemA.modelA.components['a'], systemA.modelB.components['a']);
        });
        
        
        it('should have a reference for each component in each entity', () => {
            assertExists(stage.getEntityById(entityA)?.components.getById(componentA));
            assertExists(stage.getEntityById(entityA)?.components.getById(componentB));
            assertExists(stage.getEntityById(entityA)?.components.getById(componentC));
            assertExists(stage.getEntityById(entityB)?.components.getById(componentD));
            assertExists(stage.getEntityById(entityB)?.components.getById(componentE));
            assertExists(stage.getEntityById(entityB)?.components.getById(componentF));
        });
    
        it('should have a reference for each model in each entity', () => {
            const modelsA = stage.getEntityById(entityA)?.models;
            const modelsB = stage.getEntityById(entityB)?.models;
    
            assertExists(modelsA?.getByClass(ModelA));
            assertExists(modelsA?.getByClass(ModelB));
            assertExists(modelsB?.getByClass(ModelA));
            assertExists(modelsB?.getByClass(ModelB));
        });

        it('should generate a uuid for a component if it is not provided', () => {
            const component = /** @type {ComponentData<'a'>} */({ entityId: UUID(), type: 'a', value: 'valueA' });
            stage.components.add(component);
            assert(component.id);
            assert(UUID.isUUID(component.id));
        });

        it('should only create a single model across multiple systems', () => {
            assertEquals(systemA.modelA, systemB.modelA);
        });

        it('should initialize the component value if an initializer is specified', () => {
            assertInstanceOf([...systemA.modelCs][0].d, Initializer);
        });

        it('should not initialize a component instance', () => {
            const component = /** @type {ComponentData<'a'>} */(stage.components.getById(componentC));
            assertExists(component);

            stage.components.delete(component);

            component.value = 'test';

            stage.components.add(component);
            assertEquals(stage.components.getById(componentC)?.value, 'test');

        });
    });

    describe('components.delete', () => {
        beforeEach(() => {
            cleanupSpy = spy();
            stage.components.delete({ id: componentB });
            stage.components.delete({ id: componentD });
            stage.components.delete({ id: componentE });
            stage.components.delete({ id: componentF });
            stage.components.delete({ id: componentH });
        });

        describe('getEntityById', () => {
            it('should not return an entity if all components have been deleted', () => {
                assert(stage.getEntityById(entityB) === undefined);
            });
        });

        it('should delete system property when model no longer matches', () => {
            assertEquals(systemA.modelB, undefined);
            assertEquals(systemB.modelB, undefined);
        });

        it('should call model.cleanup on model when model no longer matches', () => {
            assertSpyCall(cleanupSpy, 0, { args: [entityA] });
            assertSpyCall(cleanupSpy, 1, { args: [entityB] });
        });

        it('should remove entities from system property Set when model is removed', () => {
            assertEquals(systemA.modelCs.size, 1);
        });

        it('should return false if component is not present', () => {
            assertFalse(stage.components.delete({ id: UUID() }));
        });

        it('should return false if entity is not present', () => {
            assertFalse(stage.components.delete({ id: UUID() }));
        });
    });

    describe('component.toJSON', () => {
         /** @type {Component<'a'>} */
        let component;
        /** @type {ComponentData<'a'>} */
        let json;
        beforeEach(() => {
            component = /** @type {Component<'a'>} */(stage.components.getById(componentA));
            json = component.toJSON();
        });

        it('should return an object containing id, entityId, type, and value', () => {
            assertEquals(component.id,       json.id);
            assertEquals(component.entityId, json.entityId);
            assertEquals(component.type,     json.type);
            assertEquals(component.value,    json.value);
        });
    });

    describe('component.getJSONValue', () => {
        /** @type {Component<'d'>} */
        let component;
        /** @type {ComponentTypes['d']['value']} */
        let json;
        beforeEach(() => {
            component = /** @type {Component<'d'>} */(stage.components.getById(componentG));
            json = component.getJSONValue();
        });

        it('should return the value of toJSON of a complex object', () => {
            assertEquals(json, { foo: 'bar' });
        });
    });

    describe('component value change', () => {
        /** @type {Component<'a'>} */
        let component;
        beforeEach(() => {
            handler = spy();
            component = /** @type {Component<'a'>} */(stage.components.getById(componentA));
            component.watch('value:change', handler);
        });

        it('should call watch handler when value changes', async () => {
            const oldValue = component.value;
            component.value = 'change';
            await time.runMicrotasks();
            assertSpyCall(handler, 0, { args: [oldValue]});
        });

        it('should not call watch handler when value is the same', async () => {
            component.value = 'a';
            await time.runMicrotasks();
            assertSpyCalls(handler, 0);
        });
    });

    describe('component watchable value event', () => {
        /** @type {string} */
        let componentW;
        /** @type {Component<'c'>} */
        let component;
        /** @type {Watchable} */
        let watchableA; 
        /** @type {Watchable} */
        let watchableB;

        beforeEach(() => {
            componentW = UUID();
            watchableA = new Watchable();
            watchableB = new Watchable();

            stage.components.add({ id: componentW, entityId: entityB, type: 'c', value: watchableA });

            handler = spy();
            component = /** @type {Component<'c'>} */(stage.components.getById(componentW));
            component.watch('value:notify',  handler);
        });

        it('should call watch handler when watchable notifies event', async () => {
            watchableA.notify('a', 'a');
            await time.runMicrotasks();
            assertSpyCall(handler, 0, { args: [new Map([['a', 'a']])]});
        });

        it('should call watch handler when new watchable notifies', async () => {
            component.value = watchableB;
            watchableB.notify('b', 'b');
            await time.runMicrotasks();
            assertSpyCall(handler, 0, { args: [new Map([['b', 'b']])]});
        });

        it('should not call watch handler when original watchable value has been removed', async () => {
            component.value = watchableB;
            watchableA.notify('a', 'a');
            await time.runMicrotasks();
            assertSpyCalls(handler, 0);
        });

        it('should not call watch handler after component has been removed', async () => {
            stage.components.delete(component);
            watchableA.notify('a', 'a');
            await time.runMicrotasks();
            assertSpyCalls(handler, 0);
        });
    });

    describe('component.stage', () => {
        it('should have a reference to the stage', () => {
            const component = stage.components.getById(componentA);
            assertExists(component);
            assertEquals(component.stage, stage);
        });
    });

    describe('model.entity.components.add', () => {
        /** @type {string} */
        let componentX;
        beforeEach(() => {
            componentX = UUID();
            systemA.modelA.entity.components.add({ id: componentX, type: 'a', value: 'a' });
        });

        it('should add the component to the stage', () => {
            assert(stage.components.getById(componentX));
        });

        it('should add the entity id to the component', () => {
            assertEquals(stage.components.getById(componentX)?.entityId, systemA.modelA.entity.id);
        });

        it('should not throw an error if trying to add a Component that belongs to the same entity', () => {
            const component = /** @type {Component<'c'>} */(stage.components.getById(componentA));  
            systemA.modelA.entity.components.add(component);
        });

        it('should throw an error if trying to add a Component that belongs to another entity', () => {
            const component = /** @type {Component<'c'>} */(stage.components.getById(componentD));
            assertThrows(() => systemA.modelA.entity.components.add(component), 'Component registered to another entity');
        });
    });

    describe('model.entity.components.delete', () => {
        beforeEach(() => {
            systemA.modelA.entity.components.delete({ id: componentF });
            systemA.modelA.entity.components.delete({ id: componentA });
        });

        it('should remove the component from the stage', () => {
            assert(!stage.components.getById(componentA));
        });

        it('should not remove the component from the stage if it does not belong to the entity', () => {
            assert(stage.components.getById(componentF));
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

            class SystemC extends TypedSystem({
                models: {
                    modelA: { model: ModelA }
                }
            }) { }

            /** @type {SystemC} */
            let systemC;

            beforeEach(() => {
                systemC = new SystemC();
                stage.watch('system:add', { immediate: true, handler });
                stage.systems.add(systemC);
            });

            it('should notify system:add when a new system is added', () => {
                assertSpyCall(handler, 0, { args: [{ system: systemC }]});
            });
        });

        describe('system:delete', () => {
            beforeEach(() => {
                stage.watch('system:delete', { immediate: true, handler });
                stage.systems.delete(systemA);
            });

            it('should notify system:delete when a system is deleted', () => {
                assertSpyCall(handler, 0, { args: [{ system: systemA }]});
            });
        });

        describe('component:add', () => {
            beforeEach(() => {
                stage.watch('component:add', { immediate: true, handler });
                stage.components.add({ id: UUID(), entityId: UUID(), type: 'c', value: new Watchable() });
            });

            it('should notify component:add when a new component is added', () => {
                assertSpyCalls(handler, 1);
            });
        });

        describe('component:add:${entityId}:${type}', () => {
            let entityId;
            beforeEach(() => {
                entityId = UUID();
                stage.watch(`component:add:${entityId}:c`, { immediate: true, handler });
                stage.components.add({ id: UUID(), entityId, type: 'c', value: new Watchable() });
            });

            it('should notify component:add:${entityId}:${type} when a new component is added', () => {
                assertSpyCalls(handler, 1);
            });
        });

        describe('component:delete', () => {
            beforeEach(() => {
                stage.watch('component:delete', { immediate: true, handler });
                stage.components.delete({ id: componentA });
            });

            it('should notify component:delete when a component is deleted', () => {
                assertSpyCalls(handler, 1);
            });
        });

        describe('component:delete:${entityId}:${type}', () => {
            beforeEach(() => {
                stage.watch(`component:delete:${entityA}:a`, { immediate: true, handler });
                stage.components.delete({ id: componentA });
            });

            it('should notify component:delete:${entityId}:${type} when a component is deleted', () => {
                assertSpyCalls(handler, 1);
            });
        });

        describe('entity:add', () => {
            beforeEach(() => {
                stage.watch('entity:add', { immediate: true, handler });
                stage.components.add({ id: UUID(), entityId: UUID(), type: 'c', value: new Watchable() });
            });

            it('should notify entity:add when a new entity is added', () => {
                assertSpyCalls(handler, 1);
            });
        });

        describe('entity:add:${id}', () => {
            let entityId;
            beforeEach(() => {
                entityId = UUID();

                stage.watch(`entity:add:${entityId}`, { immediate: true, handler });
                stage.components.add({ id: UUID(), entityId, type: 'c', value: new Watchable() });
            });

            it('should notify entity:add:${id} when a new entity is added', () => {
                assertSpyCalls(handler, 1);
            });
        });

        describe('entity:delete', () => {
            beforeEach(() => {
                stage.watch('entity:delete', { immediate: true, handler });
                stage.components.delete({ id: componentA });
                stage.components.delete({ id: componentB });
                stage.components.delete({ id: componentC });
                stage.components.delete({ id: componentG });
            });

            it('should notify entity:delete when an entity is deleted', () => {
                assertSpyCalls(handler, 1);
            });
        });

        describe('entity:delete:${id}', () => {
            beforeEach(() => {
                stage.watch(`entity:delete:${entityA}`, { immediate: true, handler });
                stage.components.delete({ id: componentA });
                stage.components.delete({ id: componentB });
                stage.components.delete({ id: componentC });
                stage.components.delete({ id: componentG });
            });

            it('should notify entity:delete:${entityId} when an entity is deleted', () => {
                assertSpyCalls(handler, 1);
            });
        });


        it('should notify model:add when all the components for that model are registered', () => {
            systemA.watch('model:add', { immediate: true, handler: ({ model, key}) => handler(model.constructor, key) });

            stage.components.add({ id: UUID(), entityId: entityC, type: 'a', value: 'a' });
            stage.components.add({ id: UUID(), entityId: entityD, type: 'a', value: 'a' });
            stage.components.add({ id: UUID(), entityId: entityD, type: 'b', value: 123 });

            assertSpyCall(handler, 0, { args: [ModelA, 'modelA']});
            assertSpyCall(handler, 1, { args: [ModelA, 'modelA']});
            assertSpyCall(handler, 2, { args: [ModelB, 'modelB']});
        });

        it('should call onModelAdd id defined when all the components for that model are registered', () => {
            systemA.onModelAdd = (model, key) => handler(model.constructor, key);

            stage.components.add({ id: UUID(), entityId: entityC, type: 'a', value: 'a' });
            stage.components.add({ id: UUID(), entityId: entityD, type: 'a', value: 'a' });
            stage.components.add({ id: UUID(), entityId: entityD, type: 'b', value: 123 });

            assertSpyCall(handler, 0, { args: [ModelA, 'modelA'] });
            assertSpyCall(handler, 1, { args: [ModelA, 'modelA'] });
            assertSpyCall(handler, 2, { args: [ModelB, 'modelB'] });
        });

        it('should notify model:delete when all the components for that model are unregistered', () => {
            systemA.watch('model:delete', { immediate: true, handler: ({ model, key}) => handler(model.constructor, key) });

            stage.components.delete({ id: componentA });

            assertSpyCall(handler, 0, { args: [ModelA, 'modelA'] });
            assertSpyCall(handler, 1, { args: [ModelB, 'modelB'] });
        });

        it('should call onModelDelete when all the components for that model are deleted if defined', () => {
            systemA.onModelDelete = (model, key) => handler(model.constructor, key);

            stage.components.delete({ id: componentA });

            assertSpyCall(handler, 0, { args: [ModelA, 'modelA'] });
            assertSpyCall(handler, 1, { args: [ModelB, 'modelB'] });
        });
    });

    describe('new system', () => {
        class SystemC extends TypedSystem({
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

    describe('deleted system', () => {
        beforeEach(() => {
            stage.systems.delete(systemA);
        });

        it('should no longer add models to system', () => {
            const size = systemA.models.size;
            stage.components.add({ id: UUID(), entityId: UUID(), type: 'a', value: 'a' });
            assertEquals(systemA.models.size, size);
        });
    });
    
    describe('createEntity', () => {
        beforeEach(() => {
            stage = new Stage();
        })
        it('should create all the components specified sharing the same entity id', () => {
            stage.createEntity({ a: 'a', b: 123, c: new Watchable(), d: { foo: 'bar' } });
            assertEquals(stage.components.size, 4);
            assertEquals([...stage.components][0].entityId, [...stage.components][1].entityId);
            assertEquals([...stage.components][0].entityId, [...stage.components][2].entityId);
            assertEquals([...stage.components][0].entityId, [...stage.components][3].entityId);
        });

        it('should generate and return a new entity id if not specified', () => {
            assert(UUID.isUUID(stage.createEntity({ a: 'a', b: 123, c: new Watchable() })));
        });
    });


    describe('component references', () => {
        /** @type {ComponentReference<'a'>} */ 
        let refA;
        /** @type {ComponentReference<'c'>} */ 
        let refB;
        /** @type {string} */ 
        let entityC;
        beforeEach(() => {
            handler = spy();
            entityC = UUID();
            refA = stage.getComponentReference(entityA, 'a');
            refB = stage.getComponentReference(entityC, 'c');
        });

        afterEach(() => {
            refA.release();
            refB.release();
        });

        it('should resolve to an existing component immediately', () => {
            assertEquals(refA.component?.id, componentA);
        });

        it('should resolve to a non existing component async', async () => {
            const promise = refB.waitFor('resolve');
            const id = UUID();
            stage.components.add({ id, entityId: entityC, type: 'c', value: new Watchable() });
            await time.runMicrotasks();
            const component = await promise;
            assertEquals(component?.id, id);
        });

        it('should notify destroy if component removed', async () => {
            refA.watch('destroy', handler);
            stage.components.delete({ id: componentA });
            await time.runMicrotasks();
            assertSpyCalls(handler, 1);
        });

        it('should notify release if released', async () => {
            refA.watch('release', handler);
            refA.release();
            await time.runMicrotasks();
            assertSpyCalls(handler, 1);
        });

        it('should have a reference to the stage', () => {
            assertEquals(refA.stage, stage);
        });

        it('should have a reference to the entityId', () => {
            assertEquals(refA.entityId, entityA);
        });

        it('should have a reference to the type', () => {
            assertEquals(refA.type, 'a');
        });

        describe('status', () => {
            it('should return "released" if released', () => {
                refA.release();
                assertEquals(refA.status, 'released');
            });
    
            it('should return "destroyed" if component was removed', async () => {
                stage.components.delete({ id: componentA });
                await time.runMicrotasks();
                assertEquals(refA.status, 'destroyed');
            });
    
            it('should return "aborted" if ref was released before resolving', async () => {
                refB.release();
                await time.runMicrotasks();
                assertEquals(refB.status, 'aborted');
            });
    
            it('should return "resolved" if component has been resolved', async () => {
                assertEquals(refA.status, 'resolved');
                stage.components.add({ id: UUID(), entityId: entityC, type: 'c', value: new Watchable() });
                await time.runMicrotasks();
                assertEquals(refB.status, 'resolved');
            });
    
            it('should return "pending" if component has not been resolved', async () => {
                await time.runMicrotasks();
                assertEquals(refB.status, 'pending');
            });
        });

        describe('getComponentReferenceCount', () => {
            it('should return the number of references created for that specific entity and component type', () => {
                assertEquals(stage.getComponentReferenceCount(entityA, 'a'), 1);
                assertEquals(stage.getComponentReferenceCount(entityB, 'b'), 0);
                assertEquals(stage.getComponentReferenceCount(entityC, 'c'), 1);
            });

            it('should increment the number of references when creating a new reference', () => {
                assertEquals(stage.getComponentReferenceCount(entityA, 'a'), 1);
                stage.getComponentReference(entityA, 'a');
                assertEquals(stage.getComponentReferenceCount(entityA, 'a'), 2);
            });

            it('should decrement the number of references when releasing', () => {
                assertEquals(stage.getComponentReferenceCount(entityA, 'a'), 1);
                refA.release();
                assertEquals(stage.getComponentReferenceCount(entityA, 'a'), 0);
            });
        });

        describe('getEntityReferenceCount', () => {
            it('should return the number of references created for that specific entity', () => {
                assertEquals(stage.getEntityReferenceCount(entityA), 1);
                assertEquals(stage.getEntityReferenceCount(entityB), 0);
                assertEquals(stage.getEntityReferenceCount(entityC), 1);
            });

            it('should increment the number of references when creating a new reference', () => {
                assertEquals(stage.getEntityReferenceCount(entityA), 1);
                stage.getComponentReference(entityA, 'b');
                assertEquals(stage.getEntityReferenceCount(entityA), 2);
            });

            it('should decrement the number of references when releasing', () => {
                assertEquals(stage.getEntityReferenceCount(entityA), 1);
                refA.release();
                assertEquals(stage.getEntityReferenceCount(entityA), 0);
            });
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
