import { describe, it, beforeEach, afterEach } from 'std/testing/bdd.ts';
import { spy, assertSpyCall, assertSpyCalls  } from 'std/testing/mock.ts';
import { FakeTime                            } from 'std/testing/time.ts';

import { assert           } from 'std/assert/assert.ts';
import { assertEquals     } from 'std/assert/assert_equals.ts';
import { assertThrows     } from 'std/assert/assert_throws.ts';
import { assertFalse      } from 'std/assert/assert_false.ts';

import { Component, ComponentSet } from '../lib/component.js';

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
 *   d: { value: import('../lib/component.js').ComplexComponentValue, json: { foo: string } },
 *   e: { value: string },
 * }} ComponentTypes
 */

describe('Component', () => {
    /** @type {FakeTime} */
    let time;
    /** @type {Spy} */
    let handler;

    /** @type {string} */
    let entityA; 

    /** @type {Component<ComponentTypes, 'a'>} */
    let component;

    beforeEach(() => {
        time = new FakeTime();

        entityA = UUID();

        component = new Component({ entity: entityA, type: 'a', value: 'a' });
    });

    afterEach(() => {
        time.restore();
    });

    it('should have reference to entity', () => {
        assertEquals(component.entity, entityA);
    });

    it('should have reference to type', () => {
        assertEquals(component.type, 'a');
    });

    describe('value change', () => {
        beforeEach(() => {
            handler = spy();
            component.watch('value:change', handler);
        });

        it('should call watch handler when value changes', () => {
            const oldValue = component.value;
            component.value = 'change';
            assertSpyCall(handler, 0, { args: [oldValue]});
        });

        it('should not call watch handler when value is the same', () => {
            component.value = 'a';
            assertSpyCalls(handler, 0);
        });
    });

    describe('watchable value event', () => {
        /** @type {Component<ComponentTypes, 'c'>} */
        let component;
        /** @type {Watchable} */
        let watchableA; 
        /** @type {Watchable} */
        let watchableB;
        
        beforeEach(() => {
            watchableA = new Watchable();
            watchableB = new Watchable();

            handler = spy();
            component = new Component({ entity: entityA, type: 'c', value: watchableA });
            component.watch('value:notify',  handler);
        });
        

        it('should call watch handler when watchable notifies event', async () => {
            watchableA.notify('a', 'abc');
            await time.runMicrotasks();
            assertSpyCall(handler, 0, { args: [new Map([['a', 'abc']])]});
        });

        it('should call watch handler when new watchable notifies', async () => {
            component.value = watchableB;
            watchableB.notify('b', 'def');
            await time.runMicrotasks();
            assertSpyCall(handler, 0, { args: [new Map([['b', 'def']])]});
        });

        it('should not call watch handler when original watchable value has been removed', async () => {
            component.value = watchableB;
            watchableA.notify('a', 'abc');
            await time.runMicrotasks();
            assertSpyCalls(handler, 0);
        });

        it('should not call watch handler after component.cleanup has been called', async () => {
            component.cleanup();
            watchableA.notify('a', 'abc');
            await time.runMicrotasks();
            assertSpyCalls(handler, 0);
        });
    });

    describe('toJSON', () => {
        /** @type {import('../lib/component.js').ComponentData<ComponentTypes,'a'>} */
        let json;
        
        beforeEach(() => {
            json = component.toJSON();
        });

        it('should return an object containing entity, type, and value', () => {
            assertEquals(component.entity, json.entity);
            assertEquals(component.type,   json.type);
            assertEquals(component.value,  json.value);
        });
    });

    describe('getJSONValue', () => {
        /** @type {Component<ComponentTypes, 'd'>} */
        let component;
        /** @type {ComponentTypes['d']['json']} */
        let json;

        class Foobar {
            set() {
    
            }
            toJSON() {
                return { foo: 'bar' }
            }
        }
    
        /** @type {Foobar} */
        let foobar;

        beforeEach(() => {
            foobar = new Foobar();
            component = new Component({ entity: entityA, type: 'd', value: foobar });
            json = component.getJSONValue();
        });

        it('should return the value of toJSON of a complex object', () => {
            assertEquals(json, { foo: 'bar' });
        });
    });
});

describe('ComponentSet', () => {
    /** @type {FakeTime} */
    let time;
    /** @type {Spy} */
    let handler;

    /** @type {ComponentSet<ComponentTypes>} */
    let components;

    /** @type {string} */
    let entityA; 
    /** @type {string} */
    let entityB;

    /** @type {Watchable} */
    let watchableA; 
    /** @type {Watchable} */
    let watchableB;

    /** @type {Component<ComponentTypes, 'a'>} */
    let componentA;
    /** @type {Component<ComponentTypes, 'b'>} */
    let componentB;
    /** @type {Component<ComponentTypes, 'c'>} */
    let componentC;
    /** @type {Component<ComponentTypes, 'd'>} */
    let componentD;
    /** @type {Component<ComponentTypes, 'a'>} */
    let componentE;
    /** @type {Component<ComponentTypes, 'b'>} */
    let componentF;
    /** @type {Component<ComponentTypes, 'c'>} */
    let componentG;
    /** @type {Component<ComponentTypes, 'd'>} */
    let componentH;

    class Foobar {
        set() {

        }
        toJSON() {
            return { foo: 'bar' }
        }
    }

    /** @type {Foobar} */
    let foobarA;
    /** @type {Foobar} */
    let foobarB;

    beforeEach(() => {
        time = new FakeTime();

        components = new ComponentSet();

        entityA = UUID();
        entityB = UUID();

        watchableA = new Watchable();
        watchableB = new Watchable();

        foobarA = new Foobar();
        foobarB = new Foobar();
        
        componentA = components.add({ entity: entityA, type: 'a', value: 'a' });
        componentB = components.add({ entity: entityA, type: 'b', value: 123 });
        componentC = components.add({ entity: entityA, type: 'c', value: watchableA });
        componentD = components.add({ entity: entityA, type: 'd', value: foobarA });

        componentE = components.add({ entity: entityB, type: 'a', value: 'a' });
        componentF = components.add({ entity: entityB, type: 'b', value: 123 });
        componentG = components.add({ entity: entityB, type: 'c', value: watchableB });
        componentH = components.add({ entity: entityB, type: 'd', value: foobarB });
    });

    afterEach(() => {
        time.restore();
    });

    

    describe('add', () => {
        it('should throw error if duplicate entity and type is added', () => {
            assertThrows(() => components.add({ entity: entityA, type: 'a', value: 'a' }), 'Entity can only contain one component of a given type');
        });
    });

    describe('delete', () => {
        it('should return false if component is not present', () => {
            assertFalse(components.delete({ entity: entityA, type: 'e' }));
        });

        it('should return false if entity is not present', () => {
            assertFalse(components.delete({ entity: UUID(), type: 'e' }));
        });
    });
    
    describe('find', () => {
        it('should find a single component when specifying entity and type', () => {
            assertEquals(components.find({ entity: entityA, type: 'a' }), componentA);
            assertEquals(components.find({ entity: entityA, type: 'b' }), componentB);
            assertEquals(components.find({ entity: entityA, type: 'c' }), componentC);
            assertEquals(components.find({ entity: entityA, type: 'd' }), componentD);
            assertEquals(components.find({ entity: entityB, type: 'a' }), componentE);
            assertEquals(components.find({ entity: entityB, type: 'b' }), componentF);
            assertEquals(components.find({ entity: entityB, type: 'c' }), componentG);
            assertEquals(components.find({ entity: entityB, type: 'd' }), componentH);
        });
        it('should iterate over all components of entity when specifying entity', () => {
            assertEquals([...components.find({ entity: entityA })], [componentA, componentB, componentC, componentD]);
        });

        it('should not error when iterating over a non existent entity', () => {
            assertEquals([...components.find({ entity: 'z' })], []);
        });

        it('should iterate over all components of type when specifying type', () => {
            assertEquals([...components.find({ type: 'a' })], [componentA, componentE]);
        });

        it('should not error when iterating over a non existent type', () => {
            assertEquals([...components.find({ type: 'e' })], []);
        });

        describe('predicate', () => {
            it('should only return the components where the predicate is true', () => {
                assertEquals(components.find({ entity: entityA, type: 'a', predicate: (c) => c.value !== 'a' }), undefined);
                assertEquals([...components.find({ entity: entityA, predicate: (c) => c.type === 'c' })], [componentC]);
                assertEquals([...components.find({ type: 'c', predicate: (c) => c.entity === entityB })], [componentG]);
                assertEquals([...components.find({ predicate: (c) => c.entity === entityB })], [componentE, componentF, componentG, componentH]);
            });
        });
    });

    describe('count', () => {
        it('should return the count of all components when not specifying entity or type', () => {
            assertEquals(components.count(), 8);
        });

        it('should return the count of all components of entity when specifying entity', () => {
            assertEquals(components.count({ entity: entityA }), 4);
        });

        it('should return 0 when there are no components of a given entity', () => {
            assertEquals(components.count({ entity: 'z' }), 0);
        });

        it('should return the count of all components of type when specifying type', () => {
            assertEquals(components.count({ type: 'a' }), 2);
        });

        it('should return 0 when there are no components of a given type', () => {
            assertEquals(components.count({ type: 'e' }), 0);
        });

        it('should return 1 when entity and type are both specified', () => {
            assertEquals(components.count({ entity: entityA, type: 'a' }), 1);
        });

        describe('predicate', () => {
            it('should only count the components where the predicate is true', () => {
                assertEquals(components.count({ entity: entityA, predicate: (c) => c.value === 'a' || c.value === 123 }), 2);
                assertEquals(components.count({ type: 'c', predicate: (c) => c.entity === entityB }), 1);
                assertEquals(components.count({ predicate: (c) => c.type === 'a' || c.type === 'b' }), 4);
                assertEquals(components.count({ entity: entityA, type: 'a', predicate: (c) => c.type === 'a' }), 1);
                assertEquals(components.count({ entity: entityA, type: 'a', predicate: (c) => c.type === 'b' }), 0);
            });
        });
    });

    describe('has', () => {
        it('should return true if there are any components for the specified entity', () => {
            assert(components.has({ entity: entityA }));
        });

        it('should return false if there are not any components for the specified entity', () => {
            assertFalse(components.has({ entity: UUID() }));
        });

        it('should return true if there are any components for the specified type', () => {
            assert(components.has({ type: 'a' }));
        });

        it('should return false if there are not any components for the specified type', () => {
            assertFalse(components.has({ type: 'e' }));
        });

        it('should return true when entity and type are both specified', () => {
            assert(components.has({ entity: entityA, type: 'a' }));
        });

        it('should not return true if there are no components when entity and type are both specified', () => {
            assertFalse(components.has({ entity: entityA, type: 'e' }));
        });

        describe('predicate', () => {
            it('should only return true if the predicate is true', () => {
                assert(components.has({ entity: entityA, predicate: (c) => c.value === 'a' || c.value === 123 }));
                assertFalse(components.has({ entity: entityA, predicate: (c) => c.type === 'e' }));

                assertFalse(components.has({ entity: entityA, type: 'a', predicate: (c) => c.type === 'b' }));
                assert(components.has({ predicate: (c) => c.value === 'a' }));
            });
        });
    });

    describe('events', () => {
        
        /** @type {string} */
        let entityC;
        
        beforeEach(() => {
            entityC = UUID();
            handler = spy();
        });

        it('should notify component:add when a new component is added', () => {
            components.watch('component:add', handler);
            components.add({ entity: entityC, type: 'c', value: new Watchable() });
            assertSpyCalls(handler, 1);
        });

        it('should notify component:add:${entity} when a new component is added', () => {
            components.watch(`component:add:${entityC}`, handler);
            components.add({ entity: entityC, type: 'c', value: new Watchable() });
            assertSpyCalls(handler, 1);
        });

        it('should notify component:add:${entity}:${type} when a new component is added', () => {
            components.watch(`component:add:${entityC}:c`, handler);
            components.add({ entity: entityC, type: 'c', value: new Watchable() });
            assertSpyCalls(handler, 1);
        });
        
        it('should notify component:delete when a component is deleted', () => {
            components.watch('component:delete', handler);
            components.delete({ entity: entityA, type: 'a' });
            assertSpyCalls(handler, 1);
        });

        it('should notify component:delete:${entity} when a component is deleted', () => {
            components.watch(`component:delete:${entityA}`, handler);
            components.delete({ entity: entityA, type: 'a' });
            assertSpyCalls(handler, 1);
        });

        it('should notify component:delete:${entity}:${type} when a component is deleted', () => {
            components.watch(`component:delete:${entityA}:a`, handler);
            components.delete({ entity: entityA, type: 'a' });
            assertSpyCalls(handler, 1);
        });

        it('should notify entity:add when a new entity is added', () => {
            components.watch('entity:add', handler);
            components.add({ entity: UUID(), type: 'c', value: new Watchable() });
            assertSpyCalls(handler, 1);
        });

        it('should notify entity:add:${entity} when a new entity is added', () => {
            components.watch(`entity:add:${entityC}`, handler);
            components.add({ entity: entityC, type: 'c', value: new Watchable() });
            assertSpyCalls(handler, 1);
        });

        it('should notify entity:delete when an entity is deleted', () => {
            components.watch('entity:delete', handler);
            components.delete({ entity: entityA, type: 'a' });
            components.delete({ entity: entityA, type: 'b' });
            components.delete({ entity: entityA, type: 'c' });
            components.delete({ entity: entityA, type: 'd' });
            assertSpyCalls(handler, 1);
        });

        it('should notify entity:delete:${entity} when an entity is deleted', () => {
            components.watch(`entity:delete:${entityA}`, { handler });
            components.delete({ entity: entityA, type: 'a' });
            components.delete({ entity: entityA, type: 'b' });
            components.delete({ entity: entityA, type: 'c' });
            components.delete({ entity: entityA, type: 'd' });
            assertSpyCalls(handler, 1);
        });
    });

    describe('[Symbol.iterator]', () => {
        it('should iterate over entire set of components', () => {
            assertEquals([...components], [componentA, componentB, componentC, componentD, componentE, componentF, componentG, componentH]);
        });
    });

    describe('references', () => {
    
        /** @type {import('../lib/component.js').ComponentReference<ComponentTypes, 'a'>} */ 
        let refA;
        /** @type {import('../lib/component.js').ComponentReference<ComponentTypes, 'b'>} */ 
        let refB;
        /** @type {import('../lib/component.js').ComponentReference<ComponentTypes, 'c'>} */ 
        let refC;
        /** @type {import('../lib/component.js').ComponentReference<ComponentTypes, 'd'>} */ 
        let refD;
        /** @type {import('../lib/component.js').ComponentReference<ComponentTypes, 'a'>} */ 
        let refE;
        /** @type {import('../lib/component.js').ComponentReference<ComponentTypes, 'b'>} */ 
        let refF;
        /** @type {import('../lib/component.js').ComponentReference<ComponentTypes, 'c'>} */ 
        let refG;
        /** @type {import('../lib/component.js').ComponentReference<ComponentTypes, 'd'>} */ 
        let refH;
        /** @type {import('../lib/component.js').ComponentReference<ComponentTypes, 'e'>} */ 
        let refI;

        /** @type {string} */
        let entityC = UUID();
    
        beforeEach(() => {
            handler = spy();

            components.add({ entity: entityC, type: 'a', value: 'a' })
    
            refA = components.references.add(entityC, { entity: entityA, type: 'a' });
            refB = components.references.add(entityC, { entity: entityA, type: 'b' });
            refC = components.references.add(entityC, { entity: entityA, type: 'c' });
            refD = components.references.add(entityC, { entity: entityA, type: 'd' });
            refE = components.references.add(entityC, { entity: entityB, type: 'a' });
            refF = components.references.add(entityC, { entity: entityB, type: 'b' });
            refG = components.references.add(entityC, { entity: entityB, type: 'c' });
            refH = components.references.add(entityC, { entity: entityB, type: 'd' });

            refI = components.references.add(entityC, { entity: entityA, type: 'e' });
        });
    
        afterEach(() => {
            refA.release();
            refB.release();
            refC.release();
            refD.release();
            refE.release();
            refF.release();
            refG.release();
            refH.release();
            refI.release();
        });

        it('should resolve to an existing component immediately', () => {
            assertEquals(refA.component?.entity, entityA);
            assertEquals(refA.component?.type, 'a');
        });
    
        it('should resolve to a non existing component async', async () => {
            const promise = refI.waitFor('resolve');
            components.add({ entity: entityA, type: 'e', value: 'e' });
            await time.runMicrotasks();
            const component = await promise;
            assertEquals(component.entity, entityA);
            assertEquals(component.type, 'e');
        });
    
        it('should notify destroy if component removed', async () => {
            refA.watch('destroy', handler);
            components.delete({ entity: entityA, type: 'a' });
            await time.runMicrotasks();
            assertSpyCalls(handler, 1);
        });
    
        it('should notify release if released', async () => {
            refA.watch('release', handler);
            refA.release();
            await time.runMicrotasks();
            assertSpyCalls(handler, 1);
        });

        it('should have a reference to the referer', () => {
            assertEquals(refA.referer, entityC);
        });
    
        it('should have a reference to the entity', () => {
            assertEquals(refA.entity, entityA);
        });
    
        it('should have a reference to the type', () => {
            assertEquals(refA.type, 'a');
        });

        
    
        describe('state', () => {
            it('should return "released" if released', () => {
                refA.release();
                assertEquals(refA.state, 'released');
            });
    
            it('should return "destroyed" if component was removed', async () => {
                components.delete({ entity: entityA, type: 'a' });
                await time.runMicrotasks();
                assertEquals(refA.state, 'destroyed');
            });
    
            it('should return "aborted" if ref was released before resolving', async () => {
                refI.release();
                await time.runMicrotasks();
                assertEquals(refI.state, 'aborted');
            });
    
            it('should return "resolved" if component has been resolved', async () => {
                assertEquals(refA.state, 'resolved');
                components.add({ entity: entityA, type: 'e', value: 'e' });
                await time.runMicrotasks();
                assertEquals(refI.state, 'resolved');
            });
    
            it('should return "pending" if component has not been resolved', async () => {
                await time.runMicrotasks();
                assertEquals(refI.state, 'pending');
            });
        });

        it('should destroy the reference if the referer is removed from the set of components', async () => {
            components.delete({ entity: entityC, type: 'a' });

            await time.runMicrotasks();

            assertEquals(refA.state, 'destroyed');
            assertEquals(refB.state, 'destroyed');
            assertEquals(refC.state, 'destroyed');
            assertEquals(refD.state, 'destroyed');
            assertEquals(refE.state, 'destroyed');
            assertEquals(refF.state, 'destroyed');
            assertEquals(refG.state, 'destroyed');
            assertEquals(refH.state, 'destroyed');
            assertEquals(refI.state, 'destroyed');

        })

        describe('find', () => {
            it('should iterate over all references of specified entity and type', () => {
                const refZ = components.references.add(entityC, { entity: entityB, type: 'b' });

                assertEquals([...components.references.find({ entity: entityA, type: 'a' })], [refA]);
                assertEquals([...components.references.find({ entity: entityA, type: 'b' })], [refB]);
                assertEquals([...components.references.find({ entity: entityB, type: 'b' })], [refB, refZ]);
            });
            it('should iterate over all references of specified entity', () => {
                assertEquals([...components.references.find({ entity: entityA })], [refA, refB, refC, refD, refI]);
                assertEquals([...components.references.find({ entity: entityB })], [refE, refF, refG, refH]);
            });
    
            it('should not error when iterating over a non existent entity', () => {
                assertEquals([...components.references.find({ entity: 'z' })], []);
            });

            it('should not error when iterating over a non existent type', () => {
                assertEquals([...components.references.find({ entity: 'a', type: 'e' })], []);
            });
    
            describe('predicate', () => {
                it('should only return the references where the predicate is true', () => {
                    const refZ = components.references.add(UUID(), { entity: entityB, type: 'b' });

                    assertEquals([...components.references.find({ entity: entityB, type: 'b', predicate: (c) => c.referer !== entityC })], [refZ]);
                    assertEquals([...components.references.find({ entity: entityA, predicate: (c) => c.type === 'a' })], [refA]);
                    assertEquals([...components.references.find({ predicate: (c) => c.type === 'a' })], [refA, refE]);
                });
            });
        });
    
        describe('count', () => {
            it('should return the number of references created for that specific entity', () => {
                assertEquals(components.references.count({ entity: entityA }), 5);
                assertEquals(components.references.count({ entity: entityB }), 4);
                assertEquals(components.references.count({ entity: entityC }), 0);
            });

            it('should increment the number of references when creating a new reference', () => {
                assertEquals(components.references.count({ entity: entityA }), 5);
                components.references.add(entityC, { entity: entityA, type: 'b' });
                assertEquals(components.references.count({ entity: entityA }), 6);
            });
    
        
            it('should decrement the number of references when releasing', async () => {
                assertEquals(components.references.count({ entity: entityA }), 5);
                refA.release();
                await time.runMicrotasks();
                assertEquals(components.references.count({ entity: entityA }), 4);
            });
    
            it('should return the number of references created for that specific entity and component type', () => {
                components.references.add(UUID(), { entity: entityB, type: 'b' });

                assertEquals(components.references.count({ entity: entityA, type: 'a' }), 1);
                assertEquals(components.references.count({ entity: entityB, type: 'a' }), 1);
                assertEquals(components.references.count({ entity: entityB, type: 'b' }), 2);
                
            });

            describe('predicate', () => {
                it('should only count the references where the predicate is true', () => {
                    components.references.add(UUID(), { entity: entityB, type: 'b' });

                    assertEquals(components.references.count({ entity: entityB, type: 'b', predicate: (c) => c.referer !== entityC }), 1);
                    assertEquals(components.references.count({ entity: entityA, predicate: (c) => c.type === 'a' }), 1);
                    assertEquals(components.references.count({ predicate: (c) => c.type === 'a' }), 2);
                });
            });
        });

        describe('has', () => {
            it('should return true if there are any references for the specified entity and type', () => {
                assert(components.references.has({ entity: entityA, type: 'a' }));
            });
    
            it('should return false if there are not any references for the specified entity and type', () => {
                assertFalse(components.references.has({ entity: entityB, type: 'e' }));
            });
    
            it('should return true if there are any references for the specified entity', () => {
                assert(components.has({ entity: entityA }));
            });
    
            it('should return false if there are not any references for the specified entity', () => {
                assertFalse(components.has({ entity: UUID() }));
            });
    
            describe('predicate', () => {
                it('should only return true if the predicate is true', () => {
                    assert(components.references.has({ entity: entityA, type: 'a', predicate: (c) => c.referer === entityC }));
                    assertFalse(components.references.has({ entity: entityA, type: 'a', predicate: (c) => c.referer !== entityC }));

                    assert(components.references.has({ entity: entityB, predicate: (c) => c.type === 'a' }));
                    assertFalse(components.references.has({ entity: entityB, predicate: (c) => c.type === 'e' }));
                    
                    assert(components.references.has({ predicate: (c) => c.entity === entityA && c.type === 'e' }));
                    assertFalse(components.references.has({ predicate: (c) => c.entity === entityB && c.type === 'e' }));
                });
            });
        });

        describe('events', () => {
            /** @type {string} */
            let referer;
            beforeEach(() => {
                handler = spy();
                referer = UUID();
            });

            it('should notify reference:add when a new reference is added', () => {
                components.references.watch('reference:add', handler);
                components.references.add(referer, { entity: entityC, type: 'c' });
                assertSpyCall(handler, 0, { args: [{ referer, count: 10 }]});
            });

            it('should notify reference:add:${entity} when a new reference is added', () => {
                components.references.watch(`reference:add:${entityC}`, handler);
                components.references.add(referer, { entity: entityC, type: 'c' });
                assertSpyCall(handler, 0, { args: [{ referer, count: 1 }]});
            });

            it('should notify reference:add:${entity}:${type} when a new reference is added', () => {
                components.references.watch(`reference:add:${entityC}:c`, handler);
                components.references.add(referer, { entity: entityC, type: 'c' });
                assertSpyCall(handler, 0, { args: [{ referer, count: 1 }]});
            });


            it('should notify reference:release when reference is released', async () => {
                components.references.watch('reference:release', handler);
                refA.release();
                await time.runMicrotasks();
                assertSpyCall(handler, 0, { args: [{ referer: entityC, count: 8 }]});
            });

            it('should notify reference:release:${entity} when reference is released', async () => {
                components.references.watch(`reference:release:${entityA}`, handler);
                refA.release();
                await time.runMicrotasks();
                assertSpyCall(handler, 0, { args: [{ referer: entityC, count: 4 }]});
            });

            it('should notify reference:release:${entity}:${type} when reference is released', async () => {
                components.references.watch(`reference:release:${entityA}:a`, handler);
                refA.release();
                await time.runMicrotasks();
                assertSpyCall(handler, 0, { args: [{ referer: entityC, count: 0 }]});
            });
        });

        describe('[Symbol.iterator]', () => {
            it('should iterate over entire set of components', () => {
                assertEquals([...components.references], [refA, refB, refC, refD, refE, refF, refG, refH, refI]);
            });
        });
    });
});


