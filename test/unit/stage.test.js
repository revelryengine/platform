import { describe, it, beforeEach                                      } from 'https://deno.land/std@0.143.0/testing/bdd.ts';
import { assertEquals, assertNotEquals, assertInstanceOf, assertThrows } from 'https://deno.land/std@0.143.0/testing/asserts.ts';
import { spy, stub, assertSpyCall, assertSpyCalls                      } from 'https://deno.land/std@0.143.0/testing/mock.ts';

import { Stage    } from '../../lib/stage.js';
import { System   } from '../../lib/system.js';
import { Model    } from '../../lib/model.js';
import { UUID     } from '../../lib/utils/uuid.js';

describe('Stage', () => {
    let stage, systemA, systemB, componentA, componentB;
    let registerSystem, unregisterSystem, registerComponent, unregisterComponent;

    beforeEach(() => {
        stage = new Stage();
        
        systemA = { id: new UUID() };
        systemB = { id: new UUID() };

        componentA = { id: new UUID(), entity: new UUID(), type: 'a', value: 'valueA' };
        componentB = { id: new UUID(), entity: new UUID(), type: 'b', value: 'valueB' };

        registerSystem   = stub(stage.registry, 'registerSystem');
        unregisterSystem = stub(stage.registry, 'unregisterSystem');

        registerComponent   = stub(stage.registry, 'registerComponent');
        unregisterComponent = stub(stage.registry, 'unregisterComponent');

        stage.systems.add(systemA);
        stage.systems.add(systemB);
        stage.components.add(componentA);
        stage.components.add(componentB);
    });

    describe('systems', () => {
        it('should be a reference to the stage children', () => {
            assertEquals(stage.systems, stage.children);
        });

        describe('add system', () => {    
            it('should register the system with the registry', () => {
                assertSpyCall(registerSystem, 0, { args: [systemA] });
                assertSpyCall(registerSystem, 1, { args: [systemB] });
            });
        });

        describe('delete system', () => {    
            it('should unregister the system with the registry', () => {
                stage.systems.delete(systemB);
                assertSpyCall(unregisterSystem, 0, { args: [systemB] });
            });
        });
    });

    describe('components', () => {
        describe('add component', () => {    
            it('should register the component with the registry', () => {
                assertSpyCall(registerComponent, 0, { args: [componentA] });
                assertSpyCall(registerComponent, 1, { args: [componentB] });
            });
        });

        describe('delete system', () => {    
            it('should unregister the component with the registry', () => {
                stage.components.delete(componentB);
                assertSpyCall(unregisterComponent, 0, { args: [componentB] });
            });
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

    describe('game', () => {
        it('should be a reference to the parent game', () => {
            stage.parent = {};
            assertEquals(stage.game, stage.parent);
        });
    });

    describe('entities', () => {
        it('should be a reference to the registry entities', () => {
            assertEquals(stage.entities, stage.registry.entities);
        });
    });
});
