import { describe, it, beforeEach       } from 'https://deno.land/std@0.143.0/testing/bdd.ts';
import { assertEquals, assertInstanceOf } from 'https://deno.land/std@0.143.0/testing/asserts.ts';
import { stub, assertSpyCall            } from 'https://deno.land/std@0.143.0/testing/mock.ts';

import { Stage    } from '../../lib/stage.js';
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
