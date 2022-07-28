import { describe, it, beforeEach   } from 'https://deno.land/std@0.143.0/testing/bdd.ts';
import { assertEquals, assertExists } from 'https://deno.land/std@0.143.0/testing/asserts.ts';
import { spy, assertSpyCall         } from 'https://deno.land/std@0.143.0/testing/mock.ts';

import { Model } from '../../lib/model.js';
import { UUID  } from '../../lib/utils/uuid.js';

describe('Model', () => {
    let componentA, componentB, entity, stage, model;

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
            model.addEventListener('componentchange', (e) => handler(e.propName, e.newValue, e.oldValue, e.component));
            model.a = 'updatedA';
            model.b = 'updatedB';
            assertSpyCall(handler, 0, { args: ['a', 'updatedA', 'valueA', componentA]});
            assertSpyCall(handler, 1, { args: ['b', 'updatedB', 'valueB', componentB]});
        });

        it('should call onComponentChange when a component properties change', () => {
            model.onComponentChange = spy();
            model.a = 'updatedA';
            model.b = 'updatedB';
            assertSpyCall(model.onComponentChange, 0, { args: ['a', 'updatedA', 'valueA', componentA]});
            assertSpyCall(model.onComponentChange, 1, { args: ['b', 'updatedB', 'valueB', componentB]});
        });
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
