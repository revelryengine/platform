import { describe, it, beforeEach                                  } from 'https://deno.land/std@0.143.0/testing/bdd.ts';
import { assertFalse, assertEquals, assertExists, assertInstanceOf } from 'https://deno.land/std@0.143.0/testing/asserts.ts';
import { spy, assertSpyCall                                        } from 'https://deno.land/std@0.143.0/testing/mock.ts';

import { Registry } from '../../lib/registry.js';
import { System   } from '../../lib/system.js';
import { Model    } from '../../lib/model.js';
import { UUID     } from '../../lib/utils/uuid.js';

describe('EntityRegistry', () => {
    let registry, systemA, systemB, entityA, entityB;
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
        entityA = new UUID();
        entityB = new UUID();

        componentA = { id: new UUID(), entity: entityA, type: 'a', value: 'a' };
        componentB = { id: new UUID(), entity: entityA, type: 'b', value: 'b' };
        componentC = { id: new UUID(), entity: entityA, type: 'c', value: 'c' };

        componentD = { id: new UUID(), entity: entityB, type: 'a', value: 'a' };
        componentE = { id: new UUID(), entity: entityB, type: 'b', value: 'b' };
        componentF = { id: new UUID(), entity: entityB, type: 'c', value: 'c' };

        registry = new Registry();

        systemA  = new SystemA('systemA');
        systemB  = new SystemB('systemB');

        registry.registerSystem(systemA);
        registry.registerSystem(systemB);

        registry.registerComponent(componentA);
        registry.registerComponent(componentB);
        registry.registerComponent(componentC);
        registry.registerComponent(componentD);
        registry.registerComponent(componentE);
        registry.registerComponent(componentF);
    });

    describe('registerSystem', () => {
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
            registry.registerSystem(systemC);
        });

        it('should add existing components to new system', () => {
            assertExists(systemC.modelA);
        });
    });

    describe('unregisterSystem', () => {
        beforeEach(() => {
            registry.unregisterSystem(systemA);
        });

        it('should no longer add models to system', () => {
            const size = systemA.models.size;
            registry.registerComponent({ id: new UUID(), entity: new UUID(), type: 'a', value: 'a' });
            assertEquals(systemA.models.size, size);
        });
    });

    describe('registerComponent', () => {
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
        
    
        it('should have a reference for each entity in registry.entities', () => {
            assertExists(registry.entities.getById(entityA));
            assertExists(registry.entities.getById(entityB));
        });
    
        it('should have a reference for each component in each entity', () => {
            assertExists(registry.entities.getById(entityA).components.getById(componentA.id));
            assertExists(registry.entities.getById(entityA).components.getById(componentB.id));
            assertExists(registry.entities.getById(entityA).components.getById(componentC.id));
            assertExists(registry.entities.getById(entityB).components.getById(componentD.id));
            assertExists(registry.entities.getById(entityB).components.getById(componentE.id));
            assertExists(registry.entities.getById(entityB).components.getById(componentF.id));
        });
    
        it('should have a reference for each model in each entity', () => {
            const modelsA = registry.entities.getById(entityA).models;
            const modelsB = registry.entities.getById(entityB).models;
    
            assertExists(modelsA.getByClass(ModelA));
            assertExists(modelsA.getByClass(ModelB));
            assertExists(modelsB.getByClass(ModelA));
            assertExists(modelsB.getByClass(ModelB));
        });

        it('should generate a uuid for a component if it is not provided', () => {
            const component = registry.registerComponent({ entity: new UUID(), type: 'a', value: 'valueA' });
            assertInstanceOf(component.id, UUID);
        });

        it('should only create a single model across multiple systems', () => {
            assertEquals(systemA.modelA, systemB.modelA);
        })
    });

    describe('unregisterComponent', () => {
        beforeEach(() => {
            registry.unregisterComponent(componentB);
            registry.unregisterComponent(componentE);
            registry.unregisterComponent(componentF);
        });

        it('should delete system property when model no longer matches', () => {
            assertEquals(systemA.modelB, undefined);
            assertEquals(systemB.modelB, undefined);
        });

        it('should remove entities from system property Set when model is removed', () => {
            assertEquals(systemA.modelCs.size, 1);
        });

        it('should return false if component is not present', () => {
            assertFalse(registry.unregisterComponent({ id: new UUID(), entity: entityA }));
        });

        it('should return false if entity is not present', () => {
            assertFalse(registry.unregisterComponent({ id: new UUID(), entity: new UUID() }));
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

            registry.registerComponent({ id: new UUID(), entity: entityC, type: 'a' });

            registry.registerComponent({ id: new UUID(), entity: entityD, type: 'a' });
            registry.registerComponent({ id: new UUID(), entity: entityD, type: 'b' });

            assertSpyCall(handler, 0, { args: [ModelA]});
            assertSpyCall(handler, 1, { args: [ModelA]});
            assertSpyCall(handler, 2, { args: [ModelB]});
        });

        it('should call onModelAdd id defined when all the components for that model are registered', () => {
            systemA.onModelAdd = (model) => handler(model.constructor);

            registry.registerComponent({ id: new UUID(), entity: entityC, type: 'a' });

            registry.registerComponent({ id: new UUID(), entity: entityD, type: 'a' });
            registry.registerComponent({ id: new UUID(), entity: entityD, type: 'b' });

            assertSpyCall(handler, 0, { args: [ModelA]});
            assertSpyCall(handler, 1, { args: [ModelA]});
            assertSpyCall(handler, 2, { args: [ModelB]});
        });

        it('should call onModelDelete when all the components for that model are deleted if defined', () => {
            systemA.onModelDelete = (model) => handler(model.constructor);

            registry.unregisterComponent(componentA);

            assertSpyCall(handler, 0, { args: [ModelA]});
            assertSpyCall(handler, 1, { args: [ModelB]});
        });
    });
});
