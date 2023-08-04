import { describe, it, beforeEach, afterEach } from 'std/testing/bdd.ts';
import { spy, assertSpyCall, assertSpyCalls  } from 'std/testing/mock.ts';
import { FakeTime                            } from 'std/testing/time.ts';
import { 
    assert,
    assertEquals, 
    assertNotEquals, 
    assertInstanceOf, 
    assertThrows, 
    assertExists,
    assertFalse,
} from 'https://deno.land/std@0.143.0/testing/asserts.ts';

import { Stage     } from '../../lib/stage.js';
import { System    } from '../../lib/system.js';
import { Model     } from '../../lib/model.js';
import { UUID      } from '../../lib/utils/uuid.js';
import { Watchable } from '../../lib/utils/watchable.js';

describe('Stage', () => {
    let time;
    let stage, systemA, systemB, entityA, entityB;
    let componentA, componentB, componentC, componentD, componentE, componentF;
    let cleanupSpy;

    class Initializer {

    }

    class ModelA extends Model {
        static components = {
            a: { type: 'a' },
        }
    }

    class ModelB extends Model {
        static components = {
            a: { type: 'a' },
            b: { type: 'b' },
        }

        cleanup() {
            cleanupSpy(this.entity.id);
        }
    }

    class ModelC extends Model {
        static components = {
            c: { type: 'c' },
        }
    }

    class SystemA extends System {
        static models = {
            modelA:  { model: ModelA },
            modelB:  { model: ModelB },
            modelCs: { model: ModelC, isSet: true },
        }
    }

    class SystemB extends System {
        static models = {
            modelA:  { model: ModelA },
            modelB:  { model: ModelB },
            modelCs: { model: ModelC, isSet: true },
        }
    }

    beforeEach(() => {
        time = new FakeTime();
        stage = new Stage();

        stage.initializers.set('c', Initializer);

        entityA = UUID();
        entityB = UUID();

        componentA = UUID();
        componentB = UUID();
        componentC = UUID();
        componentD = UUID();
        componentE = UUID();
        componentF = UUID();

        systemA  = new SystemA('systemA');
        systemB  = new SystemB('systemB');

        stage.systems.add(systemA);
        stage.systems.add(systemB);

        stage.components.add({ id: componentA, entityId: entityA, type: 'a', value: 'a' });
        stage.components.add({ id: componentB, entityId: entityA, type: 'b', value: 'b' });
        stage.components.add({ id: componentC, entityId: entityA, type: 'c', value: 'c' });

        stage.components.add({ id: componentD, entityId: entityB, type: 'a', value: 'a' });
        stage.components.add({ id: componentE, entityId: entityB, type: 'b', value: 'b' });
        stage.components.add({ id: componentF, entityId: entityB, type: 'c', value: 'c' });
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
            assertExists(systemA.modelA);
            assertExists(systemA.modelB);
            assertExists(systemA.modelCs);
    
            assertExists(systemB.modelA);
            assertExists(systemB.modelB);
            assertExists(systemB.modelCs);
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
            assertEquals(systemA.modelA.components.get('a'), systemA.modelB.components.get('a'));
        });
        
        
        it('should have a reference for each component in each entity', () => {
            assertExists(stage.getEntityById(entityA).components.getById(componentA));
            assertExists(stage.getEntityById(entityA).components.getById(componentB));
            assertExists(stage.getEntityById(entityA).components.getById(componentC));
            assertExists(stage.getEntityById(entityB).components.getById(componentD));
            assertExists(stage.getEntityById(entityB).components.getById(componentE));
            assertExists(stage.getEntityById(entityB).components.getById(componentF));
        });
    
        it('should have a reference for each model in each entity', () => {
            const modelsA = stage.getEntityById(entityA).models;
            const modelsB = stage.getEntityById(entityB).models;
    
            assertExists(modelsA.getByClass(ModelA));
            assertExists(modelsA.getByClass(ModelB));
            assertExists(modelsB.getByClass(ModelA));
            assertExists(modelsB.getByClass(ModelB));
        });

        it('should generate a uuid for a component if it is not provided', () => {
            const component = { entityId: UUID(), type: 'a', value: 'valueA' }
            stage.components.add(component);
            assert(UUID.isUUID(component.id));
        });

        it('should only create a single model across multiple systems', () => {
            assertEquals(systemA.modelA, systemB.modelA);
        });

        it('should initialize the component value if an initializer is specified', () => {
            assertInstanceOf([...systemA.modelCs][0].c, Initializer);
        });

        it('should not initialize a component instance', () => {
            const component = stage.components.getById(componentC);
            stage.components.delete(component);

            component.value = 'test';

            stage.components.add(component);
            assertEquals(stage.components.getById(componentC).value, 'test');

        });
    });

    describe('components.delete', () => {
        beforeEach(() => {
            cleanupSpy = spy();
            stage.components.delete({ id: componentB });
            stage.components.delete({ id: componentD });
            stage.components.delete({ id: componentE });
            stage.components.delete({ id: componentF });
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
            assertFalse(stage.components.delete({ id: UUID(), entityId: entityA }));
        });

        it('should return false if entity is not present', () => {
            assertFalse(stage.components.delete({ id: UUID(), entityId: UUID() }));
        });
    });

    describe('component value change', () => {
        let handler, component;
        beforeEach(() => {
            handler = spy();
            component = stage.components.getById(componentA);
            component.watch({ type: 'value', handler });
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

    describe('component watchable value change', () => {
        let handler, componentW, component, watchableA, watchableB;
        beforeEach(() => {
            componentW = UUID();
            watchableA = new Watchable();
            watchableB = new Watchable();

            stage.components.add({ id: componentW, entityId: entityB, type: 'w', value: watchableA });

            handler = spy();
            component = stage.components.getById(componentW);
            component.watch({ type: 'value', handler });
        });

        it('should call watch handler when watchable notifies change', async () => {
            watchableA.notify('test', 'oldValue');
            await time.runMicrotasks();
            assertSpyCall(handler, 0, { args: [new Map([['test', ['oldValue']]])]});
        });

        it('should call watch handler when watchable value changes', async () => {
            component.value = watchableB;
            await time.runMicrotasks();
            assertSpyCall(handler, 0, { args: [watchableA]});
        });

        it('should call watch handler when new watchable notifies', async () => {
            component.value = watchableB;
            await time.runMicrotasks();
            assertSpyCall(handler, 0, { args: [watchableA]});

            watchableB.notify('test', 'oldValue');
            await time.runMicrotasks();
            assertSpyCall(handler, 1, { args: [new Map([['test', ['oldValue']]])]});
        });

        it('should not call watch handler when original watchable value has been removed', async () => {
            component.value = watchableB;
            await time.runMicrotasks();
            assertSpyCall(handler, 0, { args: [watchableA]});

            watchableA.notify('test', 'oldValue');
            await time.runMicrotasks();
            assertSpyCalls(handler, 1);
        });

        it('should not call watch handler after component has been removed', async () => {
            stage.components.delete(component);
            watchableA.notify('oldValue');
            await time.runMicrotasks();
            assertSpyCalls(handler, 0);
        });
    });

    describe('component.stage', () => {
        it('should have a reference to the stage', () => {
            const component = stage.components.getById(componentA);
            assertEquals(component.stage, stage);
        });
    });

    describe('model.entity.components.add', () => {
        let componentG;
        beforeEach(() => {
            componentG = UUID();
            systemA.modelA.entity.components.add({ id: componentG, type: 'g', value: 'g' });
        });

        it('should add the component to the stage', () => {
            assert(stage.components.getById(componentG));
        });

        it('should add the entity id to the component', () => {
            assertEquals(stage.components.getById(componentG).entityId, systemA.modelA.entity.id);
        });
    });

    describe('model.entity.components.delete', () => {
        beforeEach(() => {
            systemA.modelA.entity.components.delete({ id: componentA });
            systemA.modelA.entity.components.delete({ id: componentF });
        });

        it('should remove the component from the stage', () => {
            assert(!stage.components.getById(componentA));
        });

        it('should not remove the component from the stage if it does not belong to the entity', () => {
            assert(stage.components.getById(componentF));
        });
    });

    describe('events', () => {
        let handler, entityC, entityD;

        beforeEach(() => {
            entityC = UUID();
            entityD = UUID();
            handler = spy();
        });

        it('should fire ModelAddEvent when all the components for that model are registered', () => {
            systemA.addEventListener('modeladd', (e) => handler(e.model.constructor));

            stage.components.add({ id: UUID(), entityId: entityC, type: 'a' });

            stage.components.add({ id: UUID(), entityId: entityD, type: 'a' });
            stage.components.add({ id: UUID(), entityId: entityD, type: 'b' });

            assertSpyCall(handler, 0, { args: [ModelA]});
            assertSpyCall(handler, 1, { args: [ModelA]});
            assertSpyCall(handler, 2, { args: [ModelB]});
        });

        it('should call onModelAdd id defined when all the components for that model are registered', () => {
            systemA.onModelAdd = (model, key) => handler(model.constructor, key);

            stage.components.add({ id: UUID(), entityId: entityC, type: 'a' });

            stage.components.add({ id: UUID(), entityId: entityD, type: 'a' });
            stage.components.add({ id: UUID(), entityId: entityD, type: 'b' });

            assertSpyCall(handler, 0, { args: [ModelA, 'modelA'] });
            assertSpyCall(handler, 1, { args: [ModelA, 'modelA'] });
            assertSpyCall(handler, 2, { args: [ModelB, 'modelB'] });
        });

        it('should call onModelDelete when all the components for that model are deleted if defined', () => {
            systemA.onModelDelete = (model, key) => handler(model.constructor, key);

            stage.components.delete({ id: componentA });

            assertSpyCall(handler, 0, { args: [ModelA, 'modelA'] });
            assertSpyCall(handler, 1, { args: [ModelB, 'modelB'] });
        });
    });

    describe('new system', () => {
        let systemC;

        class SystemC extends System {
            static get models() {
                return {
                    modelA: { model: ModelA }
                }
            }
        }
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
            stage.createEntity({ a: 'a', b: 'b', c: 'c' });
            assertEquals(stage.components.size, 3);
            assertEquals([...stage.components][0].entityId, [...stage.components][1].entityId);
            assertEquals([...stage.components][0].entityId, [...stage.components][2].entityId);
        });

        it('should generate and return a new entity id if not specified', () => {
            assert(UUID.isUUID(stage.createEntity({ a: 'a', b: 'b', c: 'c' })));
        });
    });

    describe('spawn', () => {
        class ModelA extends Model {
            static get components() {
                return { 
                    a: { type: 'a' }, 
                    b: { type: 'b' }, 
                };
            }
        }

        class SystemA extends System {
            static get models() {
                return {
                    modelA: { model: ModelA },
                }
            }
        }

        let system, entity, modelA, modelB, arrayB, componentAdd;

        beforeEach(() => {
            arrayB = ['b', 'c'];

            stage  = new Stage();
            system = new SystemA();

            stage.systems.add(system);

            entity = UUID();

            componentAdd = spy(stage.components, 'add');
            
            modelA = stage.spawn(ModelA, { entity , a: 'valueA', b: 'valueB' });
            modelB = stage.spawn(ModelA, { a: 'valueA', b: arrayB });
        });

        it('should spawn an entity by adding all the required components to the stage', () => {
            assertSpyCalls(componentAdd, 4);
        });

        it('should return instance of model', () => {
            assertInstanceOf(modelA, ModelA);
            assertInstanceOf(modelB, ModelA);
        });

        it('should create new entity uuid if not specified', () => {
            assert(UUID.isUUID(modelB.entity.id));
            assertNotEquals(modelB.entity.id, entity);
        });

        it('should set add component with the specified type and value', () => {
            assertEquals(componentAdd.calls[0].args[0].value, 'valueA');
            assertEquals(componentAdd.calls[0].args[0].type, 'a');

            assertEquals(componentAdd.calls[1].args[0].value, 'valueB');
            assertEquals(componentAdd.calls[1].args[0].type, 'b');

            assertEquals(componentAdd.calls[2].args[0].value, 'valueA');
            assertEquals(componentAdd.calls[2].args[0].type, 'a');

            assertEquals(componentAdd.calls[3].args[0].value, arrayB);
            assertEquals(componentAdd.calls[3].args[0].type, 'b');
        });

        it('should throw if missing component', () => {
            assertThrows(() => stage.spawn(ModelA, { }), 'Missing component');
        })
    });

    describe('systems', () => {
        it('should be a reference to the stage children', () => {
            assertEquals(stage.systems, stage.children);
        });
    });

    describe('game', () => {
        it('should be a reference to the parent game', () => {
            stage.parent = {};
            assertEquals(stage.game, stage.parent);
        });
    });
});
