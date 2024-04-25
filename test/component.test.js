import { describe, it, beforeEach, afterEach } from 'https://deno.land/std@0.208.0/testing/bdd.ts';
import { spy, assertSpyCall, assertSpyCalls  } from 'https://deno.land/std@0.208.0/testing/mock.ts';
import { FakeTime                            } from 'https://deno.land/std@0.208.0/testing/time.ts';

import { assert             } from 'https://deno.land/std@0.208.0/assert/assert.ts';
import { assertEquals       } from 'https://deno.land/std@0.208.0/assert/assert_equals.ts';
import { assertThrows       } from 'https://deno.land/std@0.208.0/assert/assert_throws.ts';
import { assertFalse        } from 'https://deno.land/std@0.208.0/assert/assert_false.ts';
import { assertStrictEquals } from 'https://deno.land/std@0.208.0/assert/assert_strict_equals.ts';
import { assertObjectMatch  } from 'https://deno.land/std@0.208.0/assert/assert_object_match.ts';

import { Game, Stage, Component, ComponentSet, UUID } from '../lib/ecs.js';

/**
 * @import { Spy } from 'https://deno.land/std@0.208.0/testing/mock.ts';
 */

describe('Component', () => {
    /** @type {FakeTime} */
    let time;
    /** @type {Spy} */
    let handler;

    /** @type {Game} */
    let game;

    /** @type {Stage} */
    let stage;

    /** @type {string} */
    let entityA;

    /** @type {string} */
    let ownerA;

    /** @type {Component<'a'>} */
    let component;

    beforeEach(() => {
        time    = new FakeTime();
        game    = new Game();
        stage   = new Stage(game, 'stage');
        entityA = UUID();
        ownerA  = UUID();

        component = new Component(stage, { entity: entityA, owner: ownerA, type: 'a', value: 'a' });
    });

    afterEach(() => {
        time.restore();
    });

    it('should have reference to stage', () => {
        assertStrictEquals(component.stage, stage);
    });

    it('should have reference to entity', () => {
        assertEquals(component.entity, entityA);
    });

    it('should have reference to type', () => {
        assertEquals(component.type, 'a');
    });

    it('should have reference to owner', () => {
        assertEquals(component.owner, ownerA);
    });


    describe('value change', () => {
        beforeEach(() => {
            handler = spy();
            component.watch('value:change', handler);
        });

        it('should call watch handler when value changes', () => {
            const original = component.value;
            component.value = 'change';
            assertSpyCall(handler, 0, { args: [original]});
        });

        it('should not call watch handler when value is the same', () => {
            component.value = 'a';
            assertSpyCalls(handler, 0);
        });
    });

    describe('toJSON', () => {
        it('should serialize to a JSON object', () => {
            assertObjectMatch(component.toJSON(), { entity: entityA, type: 'a', value: 'a' });
        });
    });

    describe('ComponentSet', () => {

        /** @type {Spy} */
        let handler;

        /** @type {ComponentSet} */
        let components;

        /** @type {string} */
        let entityA;
        /** @type {string} */
        let entityB;

        /** @type {Component<'a'>} */
        let componentA;
        /** @type {Component<'b'>} */
        let componentB;
        /** @type {Component<'c'>} */
        let componentC;
        /** @type {Component<'d'>} */
        let componentD;
        /** @type {Component<'a'>} */
        let componentE;
        /** @type {Component<'b'>} */
        let componentF;
        /** @type {Component<'c'>} */
        let componentG;
        /** @type {Component<'d'>} */
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

        /** @type {Spy} */
        let registerSpy;
        /** @type {Spy} */
        let unregisterSpy;

        beforeEach(() => {
            registerSpy   = spy();
            unregisterSpy = spy();

            components = new ComponentSet({
                register:   registerSpy,
                unregister: unregisterSpy,
            });

            entityA = UUID();
            entityB = UUID();

            foobarA = new Foobar();
            foobarB = new Foobar();

            componentA = components.add(new Component(stage, { entity: entityA, type: 'a', value: 'a' }));
            componentB = components.add(new Component(stage, { entity: entityA, type: 'b', value: 123 }));
            componentC = components.add(new Component(stage, { entity: entityA, type: 'c', value: true }));
            componentD = components.add(new Component(stage, { entity: entityA, type: 'd', value: { a: 'a' } }));

            componentE = components.add(new Component(stage, { entity: entityB, type: 'a', value: 'a' }));
            componentF = components.add(new Component(stage, { entity: entityB, type: 'b', value: 123 }));
            componentG = components.add(new Component(stage, { entity: entityB, type: 'c', value: true }));
            componentH = components.add(new Component(stage, { entity: entityB, type: 'd', value: { a: 'a' } }));
        });

        describe('add', () => {
            it('should throw error if duplicate entity and type is added', () => {
                assertThrows(() => components.add(new Component(stage, { entity: entityA, type: 'a', value: 'a' })), 'Entity can only contain one component of a given type');
            });

            it('should call the registration handler', () => {
                assertSpyCall(registerSpy, 0, { args: [componentA] });
            });
        });

        describe('delete', () => {
            it('should return true if component is present', () => {
                assert(components.delete(componentA));
            });

            it('should return false if component is not present', () => {
                assertFalse(components.delete({ entity: entityA, type: 'e' }));
            });

            it('should return false if entity is not present', () => {
                assertFalse(components.delete({ entity: UUID(), type: 'e' }));
            });

            it('should call the unregistration handler', () => {
                components.delete(componentA)
                assertSpyCall(unregisterSpy, 0, { args: [componentA] });
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
                    assertEquals(components.find({ entity: entityA, type: 'a', predicate: (c) => c.value !== 'a' }), null);
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
                    assertEquals(components.count({ entity: entityA, type: 'a', predicate: () => true  }), 1);
                    assertEquals(components.count({ entity: entityA, type: 'a', predicate: () => false }), 0);
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

                    assertFalse(components.has({ entity: entityA, type: 'a', predicate: () => false }));
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
                components.add(new Component(stage, { entity: entityC, type: 'c', value: true }));
                assertSpyCalls(handler, 1);
            });

            it('should notify component:add:${entity} when a new component is added', () => {
                components.watch(`component:add:${entityC}`, handler);
                components.add(new Component(stage, { entity: entityC, type: 'c', value: true }));
                assertSpyCalls(handler, 1);
            });

            it('should notify component:add:${entity}:${type} when a new component is added', () => {
                components.watch(`component:add:${entityC}:c`, handler);
                components.add(new Component(stage, { entity: entityC, type: 'c', value: true }));
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
                components.add(new Component(stage, { entity: UUID(), type: 'c', value: true }));
                assertSpyCalls(handler, 1);
            });

            it('should notify entity:add:${entity} when a new entity is added', () => {
                components.watch(`entity:add:${entityC}`, handler);
                components.add(new Component(stage, { entity: entityC, type: 'c', value: true }));
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
    });
});
