import { describe, it, beforeEach           } from 'https://deno.land/std@0.143.0/testing/bdd.ts';
import { spy, assertSpyCall, assertSpyCalls } from 'https://deno.land/std@0.143.0/testing/mock.ts';
import { 
    assert,
    assertEquals, 
    assertNotEquals, 
    assertInstanceOf, 
    assertThrows, 
    assertExists,
    assertFalse,
} from 'https://deno.land/std@0.143.0/testing/asserts.ts';

import { Stage    } from '../../lib/stage.js';
import { System   } from '../../lib/system.js';
import { Model    } from '../../lib/model.js';
import { UUID     } from '../../lib/utils/uuid.js';

describe('Stage', () => {
    let stage, systemA, systemB, entityA, entityB;
    let componentA, componentB, componentC, componentD, componentE, componentF;

    class ModelA extends Model {
        static get components() {
            return { a: { type: 'a' } };
        }
    }

    class ModelB extends Model {
        static get components() {
            return { 
                a: { type: 'a' },
                b: { type: 'b' } 
            };
        }
    }

    class ModelC extends Model {
        static get components() {
            return { c: { type: 'c' } };
        }
    }

    class SystemA extends System {
        static get models() {
            return {
                modelA:  { model: ModelA },
                modelB:  { model: ModelB },
                modelCs: { model: ModelC, isSet: true },
            }
        }
    }

    class SystemB extends System {
        static get models() {
            return {
                modelA:  { model: ModelA },
                modelB:  { model: ModelB },
                modelCs: { model: ModelC, isSet: true },
            }
        }
    }

    beforeEach(() => {
        stage = new Stage();

        entityA = new UUID();
        entityB = new UUID();

        componentA = { id: new UUID(), entity: entityA, type: 'a', value: 'a' };
        componentB = { id: new UUID(), entity: entityA, type: 'b', value: 'b' };
        componentC = { id: new UUID(), entity: entityA, type: 'c', value: 'c' };

        componentD = { id: new UUID(), entity: entityB, type: 'a', value: 'a' };
        componentE = { id: new UUID(), entity: entityB, type: 'b', value: 'b' };
        componentF = { id: new UUID(), entity: entityB, type: 'c', value: 'c' };


        systemA  = new SystemA('systemA');
        systemB  = new SystemB('systemB');

        stage.systems.add(systemA);
        stage.systems.add(systemB);

        stage.components.add(componentA);
        stage.components.add(componentB);
        stage.components.add(componentC);
        stage.components.add(componentD);
        stage.components.add(componentE);
        stage.components.add(componentF);
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
    
        it('should update component when updating model property', () => {
            systemA.modelA.a = 'updated';
            assertEquals(componentA.value, 'updated');
        });
    
        it('should share component between models matching the same entity', () => {
            systemA.modelA.a = 'updated';
            assertEquals(systemA.modelB.a, 'updated');
        });
        
        
        it('should have a reference for each component in each entity', () => {
            assertExists(stage.getEntityById(entityA).components.getById(componentA.id));
            assertExists(stage.getEntityById(entityA).components.getById(componentB.id));
            assertExists(stage.getEntityById(entityA).components.getById(componentC.id));
            assertExists(stage.getEntityById(entityB).components.getById(componentD.id));
            assertExists(stage.getEntityById(entityB).components.getById(componentE.id));
            assertExists(stage.getEntityById(entityB).components.getById(componentF.id));
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
            const component = { entity: new UUID(), type: 'a', value: 'valueA' }
            stage.components.add(component);
            assertInstanceOf(component.id, UUID);
        });

        it('should only create a single model across multiple systems', () => {
            assertEquals(systemA.modelA, systemB.modelA);
        });
    });

    describe('components.delete', () => {
        beforeEach(() => {
            stage.components.delete(componentB);
            stage.components.delete(componentD);
            stage.components.delete(componentE);
            stage.components.delete(componentF);
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

        it('should remove entities from system property Set when model is removed', () => {
            assertEquals(systemA.modelCs.size, 1);
        });

        it('should return false if component is not present', () => {
            assertFalse(stage.components.delete({ id: new UUID(), entity: entityA }));
        });

        it('should return false if entity is not present', () => {
            assertFalse(stage.components.delete({ id: new UUID(), entity: new UUID() }));
        });
    });

    describe('model.entity.components.add', () => {
        let componentG;
        beforeEach(() => {
            componentG = { type: 'g', value: 'g' };
            systemA.modelA.entity.components.add(componentG);
        });

        it('should add the component to the stage', () => {
            assert(stage.components.has(componentG));
        });

        it('should add the entity id to the component', () => {
            assertEquals(componentG.entity, systemA.modelA.entity.id);
        });
    });

    describe('model.entity.components.delete', () => {
        beforeEach(() => {
            systemA.modelA.entity.components.delete(componentA);
            systemA.modelA.entity.components.delete(componentF);
        });

        it('should remove the component from the stage', () => {
            assert(!stage.components.has(componentA));
        });

        it('should not remove the component from the stage if it does not belong to the entity', () => {
            assert(stage.components.has(componentF));
        });
    });

    describe('events', () => {
        let handler, entityC, entityD;

        beforeEach(() => {
            entityC = new UUID();
            entityD = new UUID();
            handler = spy();
        });

        it('should fire ModelAddEvent when all the components for that model are registered', () => {
            systemA.addEventListener('modeladd', (e) => handler(e.model.constructor));

            stage.components.add({ id: new UUID(), entity: entityC, type: 'a' });

            stage.components.add({ id: new UUID(), entity: entityD, type: 'a' });
            stage.components.add({ id: new UUID(), entity: entityD, type: 'b' });

            assertSpyCall(handler, 0, { args: [ModelA]});
            assertSpyCall(handler, 1, { args: [ModelA]});
            assertSpyCall(handler, 2, { args: [ModelB]});
        });

        it('should call onModelAdd id defined when all the components for that model are registered', () => {
            systemA.onModelAdd = (model, key) => handler(model.constructor, key);

            stage.components.add({ id: new UUID(), entity: entityC, type: 'a' });

            stage.components.add({ id: new UUID(), entity: entityD, type: 'a' });
            stage.components.add({ id: new UUID(), entity: entityD, type: 'b' });

            assertSpyCall(handler, 0, { args: [ModelA, 'modelA']});
            assertSpyCall(handler, 1, { args: [ModelA, 'modelA']});
            assertSpyCall(handler, 2, { args: [ModelB, 'modelB']});
        });

        it('should call onModelDelete when all the components for that model are deleted if defined', () => {
            systemA.onModelDelete = (model, key) => handler(model.constructor, key);

            stage.components.delete(componentA);

            assertSpyCall(handler, 0, { args: [ModelA, 'modelA']});
            assertSpyCall(handler, 1, { args: [ModelB, 'modelB']});
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
            stage.components.add({ id: new UUID(), entity: new UUID(), type: 'a', value: 'a' });
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
            assertEquals([...stage.components][0].entity, [...stage.components][1].entity);
            assertEquals([...stage.components][0].entity, [...stage.components][2].entity);
        });

        it('should generate and return a new entity id if not specified', () => {
            assertInstanceOf(stage.createEntity({ a: 'a', b: 'b', c: 'c' }), UUID);
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

        let system, entity, modelA, modelB, arrayB = ['b', 'c'], componentAdd;

        beforeEach(() => {
            stage  = new Stage();
            system = new SystemA();

            stage.systems.add(system);

            entity = new UUID();

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
            assertInstanceOf(modelB.entity.id, UUID);
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
