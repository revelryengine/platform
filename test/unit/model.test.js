import { describe, it, beforeEach                                                    } from 'https://deno.land/std@0.143.0/testing/bdd.ts';
import { assertEquals, assertNotEquals, assertInstanceOf, assertThrows, assertExists } from 'https://deno.land/std@0.143.0/testing/asserts.ts';
import { spy, assertSpyCall, assertSpyCalls                                          } from 'https://deno.land/std@0.143.0/testing/mock.ts';

import { Model } from '../../lib/model.js';
import { UUID  } from '../../lib/utils/uuid.js';

describe('Model', () => {
    let componentA, componentB, entity, stage, model, componentAdd;

    class ModelA extends Model {
        static get components() {
            return { 
                a: { type: 'a' }, 
                b: { type: 'b' }, 
            };
        }
    }

    beforeEach(() => {
        componentA = { id: new UUID(), type: 'a', value: 'valueA' };
        componentB = { id: new UUID(), type: 'b', value: 'valueB' };

        entity    = { id: new UUID(), components: new Set([componentA, componentB]) };
        stage     = { components: new Set() };
        model     = new ModelA(new UUID(), entity);

        componentAdd = spy(stage.components, 'add');
    });

    describe('components', () => {
        it('should have model property references to the component values', () => {
            assertEquals(model.a, componentA.value);
            assertEquals(model.b, componentB.value);
        });

        it('should have update the component values when updating the model properties', () => {
            model.a = 'updatedA';
            model.b = 'updatedB';
            assertEquals(componentA.value, 'updatedA');
            assertEquals(componentB.value, 'updatedB');
        });

        it('should fire ComponentChangeEvent when a component properties change', () => {
            const handler = spy();
            model.addEventListener('componentchange', (e) => handler(e.component, e.newValue, e.oldValue));
            model.a = 'updatedA';
            model.b = 'updatedB';
            assertSpyCall(handler, 0, { args: [componentA, 'updatedA', 'valueA']});
            assertSpyCall(handler, 1, { args: [componentB, 'updatedB', 'valueB']});
        });

        
    });

    describe('spawn', () => {
        let entityA, entityB, arrayB = ['b', 'c'];

        beforeEach(() => {
            entityA = ModelA.spawn(stage, { entity: entity.id , a: 'valueA', b: 'valueB' });
            entityB = ModelA.spawn(stage, { a: 'valueA', b: arrayB });
        });

        it('should spawn an entity by adding all the required components to the stage', () => {
            assertSpyCalls(componentAdd, 4);
        });

        it('should return entity uuid', () => {
            assertEquals(entityA, entity.id);
        });

        it('should create and return new entity uuid if not specified', () => {
            assertInstanceOf(entityB, UUID);
            assertNotEquals(entityB, entity.id);
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
            assertThrows(() => ModelA.spawn(stage, { }), 'Missing component');
        })
    });

    describe('system', () => {
        it('should be a reference to the parent system', () => {
            model.parent = {};
            assertEquals(model.system, model.parent);
        });
    });

    describe('stage', () => {
        it('should be a reference to the system parent stage', () => {
            model.parent = { parent: {} };
            assertEquals(model.stage, model.system.parent);
        });
    });

    describe('game', () => {
        it('should be a reference to the stage parent game', () => {
            model.parent = { parent: { parent: {} } };
            assertEquals(model.game, model.stage.parent);
        });
    });

    describe('default components', () => {
        it('should not error when not defining a subclass', () => {
            assertExists(new Model());
        })
    });
});
