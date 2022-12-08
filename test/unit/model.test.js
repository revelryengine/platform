import { describe, it, beforeEach   } from 'https://deno.land/std@0.143.0/testing/bdd.ts';
import { assertEquals, assertExists } from 'https://deno.land/std@0.143.0/testing/asserts.ts';
import { spy, assertSpyCall         } from 'https://deno.land/std@0.143.0/testing/mock.ts';

import { Model } from '../../lib/model.js';
import { UUID  } from '../../lib/utils/uuid.js';

describe('Model', () => {
    let componentA, componentB, entity, stage, modelA, modelB;

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

    beforeEach(() => {
        componentA = { id: new UUID(), type: 'a', value: 'valueA' };
        componentB = { id: new UUID(), type: 'b', value: 'valueB' };

        entity    = { id: new UUID(), components: new Set([componentA, componentB]), models: new Set() };
        stage     = { components: new Set() };
        
        modelA     = new ModelA(new UUID(), entity);
        modelB     = new ModelB(new UUID(), entity);

        entity.models.add(modelA).add(modelB);
    });

    describe('components', () => {
        it('should have model property references to the component values', () => {
            assertEquals(modelA.a, componentA.value);
            assertEquals(modelA.b, componentB.value);
        });

        it('should have update the component values when updating the model properties', () => {
            modelA.a = 'updatedA';
            modelA.b = 'updatedB';
            assertEquals(componentA.value, 'updatedA');
            assertEquals(componentB.value, 'updatedB');
        });

        it('should call onComponentChange when a component value changes', () => {
            modelA.onComponentChange = spy();
            modelA.a = 'updatedA';
            modelA.b = 'updatedB';
            assertSpyCall(modelA.onComponentChange, 0, { args: ['a', 'updatedA', 'valueA', componentA]});
            assertSpyCall(modelA.onComponentChange, 1, { args: ['b', 'updatedB', 'valueB', componentB]});
        });

        it('should call onComponentChange when a component value change on a different model', () => {
            modelA.onComponentChange = spy();
            modelB.a = 'updatedA';
            assertSpyCall(modelA.onComponentChange, 0, { args: ['a', 'updatedA', 'valueA', componentA]});
        });
    });


    describe('stage', () => {
        it('should be a reference to the entity stage', () => {
            modelA.entity = { stage: {} };
            assertEquals(modelA.stage, modelA.entity.stage);
        });
    });

    describe('game', () => {
        it('should be a reference to the entity stage game', () => {
            modelA.entity = { stage: { game: {} } };
            assertEquals(modelA.game, modelA.entity.stage.game);
        });
    });

    describe('default components', () => {
        it('should not error when not defining a subclass', () => {
            assertExists(new Model());
        })
    });
});
