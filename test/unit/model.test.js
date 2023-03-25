import { describe, it, beforeEach   } from 'https://deno.land/std@0.143.0/testing/bdd.ts';
import { assertEquals, assertExists } from 'https://deno.land/std@0.143.0/testing/asserts.ts';
import { spy, assertSpyCalls        } from 'https://deno.land/std@0.143.0/testing/mock.ts';

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
        componentA = { id: UUID(), type: 'a', value: 'valueA' };
        componentB = { id: UUID(), type: 'b', value: 'valueB' };

        entity    = { id: UUID(), components: new Set([componentA, componentB]), models: new Set() };
        stage     = { components: new Set() };
        
        modelA     = new ModelA(UUID(), entity);
        modelB     = new ModelB(UUID(), entity);

        entity.models.add(modelA).add(modelB);
    });

    describe('components', () => {
        it('should have model property references to the component values', () => {
            assertEquals(modelA.a, componentA.value);
            assertEquals(modelA.b, componentB.value);
        });

        it('should update the component values when updating the model properties', () => {
            modelA.a = 'updatedA';
            modelA.b = 'updatedB';
            assertEquals(componentA.value, 'updatedA');
            assertEquals(componentB.value, 'updatedB');
        });
    });

    describe('watch', () => {
        let handler;
        beforeEach(() => {
            handler = spy();
            componentA.watch   = spy();
            componentA.unwatch = spy();
            componentA.notify  = spy();
        });

        it('should call watch on the component', () => {
            modelA.watch('a', handler);
            assertSpyCalls(componentA.watch, 1);
        });

        it('should call unwatch on the component', () => {
            modelA.unwatch('a', handler);
            assertSpyCalls(componentA.unwatch, 1);
        });

        it('should call watch on the component', () => {
            modelA.notify('a');
            assertSpyCalls(componentA.notify, 1);
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
