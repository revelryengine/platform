import { describe, it, beforeEach, afterEach } from 'https://deno.land/std@0.208.0/testing/bdd.ts';
import { spy, assertSpyCall, assertSpyCalls  } from 'https://deno.land/std@0.208.0/testing/mock.ts';
import { FakeTime                            } from 'https://deno.land/std@0.208.0/testing/time.ts';

import { assert       } from 'https://deno.land/std@0.208.0/assert/assert.ts';
import { assertEquals } from 'https://deno.land/std@0.208.0/assert/assert_equals.ts';
import { assertFalse  } from 'https://deno.land/std@0.208.0/assert/assert_false.ts';

import { Game, Stage, Component, UUID } from '../lib/ecs.js';

/**
 * @import { Spy } from 'https://deno.land/std@0.208.0/testing/mock.ts';
 *
 * @import { ComponentReference } from '../lib/reference.js';
 */
describe('references', () => {
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
    let entityB;

    /** @type {string} */
    let entityC;

    /** @type {ComponentReference<'a'>} */
    let refA;
    /** @type {ComponentReference<'b'>} */
    let refB;
    /** @type {ComponentReference<'c'>} */
    let refC;
    /** @type {ComponentReference<'d'>} */
    let refD;
    /** @type {ComponentReference<'a'>} */
    let refE;
    /** @type {ComponentReference<'b'>} */
    let refF;
    /** @type {ComponentReference<'c'>} */
    let refG;
    /** @type {ComponentReference<'d'>} */
    let refH;
    /** @type {ComponentReference<'e'>} */
    let refI;

    beforeEach(() => {
        time    = new FakeTime();

        handler = spy();

        game  = new Game();
        stage = new Stage(game, 'stage');

        entityA = UUID();
        entityB = UUID();
        entityC = UUID();

        stage.components.add(new Component(stage, { entity: entityA, type: 'a', value: 'a' }));
        stage.components.add(new Component(stage, { entity: entityA, type: 'b', value: 123 }));
        stage.components.add(new Component(stage, { entity: entityA, type: 'c', value: true }));
        stage.components.add(new Component(stage, { entity: entityA, type: 'd', value: { a: 'a' } }));

        stage.components.add(new Component(stage, { entity: entityB, type: 'a', value: 'a' }));
        stage.components.add(new Component(stage, { entity: entityB, type: 'b', value: 123 }));
        stage.components.add(new Component(stage, { entity: entityB, type: 'c', value: true }));
        stage.components.add(new Component(stage, { entity: entityB, type: 'd', value: { a: 'a' } }));

        stage.components.add(new Component(stage, { entity: entityC, type: 'a', value: 'a' }))

        refA = stage.references.components.create({ entity: entityC, type: 'a' }, { entity: entityA, type: 'a' });
        refB = stage.references.components.create({ entity: entityC, type: 'a' }, { entity: entityA, type: 'b' });
        refC = stage.references.components.create({ entity: entityC, type: 'a' }, { entity: entityA, type: 'c' });
        refD = stage.references.components.create({ entity: entityC, type: 'a' }, { entity: entityA, type: 'd' });
        refE = stage.references.components.create({ entity: entityC, type: 'a' }, { entity: entityB, type: 'a' });
        refF = stage.references.components.create({ entity: entityC, type: 'a' }, { entity: entityB, type: 'b' });
        refG = stage.references.components.create({ entity: entityC, type: 'a' }, { entity: entityB, type: 'c' });
        refH = stage.references.components.create({ entity: entityC, type: 'a' }, { entity: entityB, type: 'd' });

        refI = stage.references.components.create({ entity: entityC, type: 'a' }, { entity: entityA, type: 'e' });
    });

    afterEach(() => {
        time.restore();

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
        stage.components.add(new Component(stage, { entity: entityA, type: 'e', value: { a: { b: 'b', c: 1 } } }));
        await time.runMicrotasks();
        const component = await promise;
        assertEquals(component.entity, entityA);
        assertEquals(component.type, 'e');
    });

    it('should notify destroy if component removed', async () => {
        refA.watch('destroy', handler);
        stage.components.delete({ entity: entityA, type: 'a' });
        await time.runMicrotasks();
        assertSpyCalls(handler, 1);
    });

    it('should notify release if released', async () => {
        refA.watch('release', handler);
        refA.release();
        await time.runMicrotasks();
        assertSpyCalls(handler, 1);
    });

    it('should remove reference from reference set when released', async () => {
        refA.release();
        assertEquals([...stage.references.components.find(refA)].length, 0);
    });

    it('should have a reference to the referer', () => {
        assertEquals(refA.referer, { entity: entityC, type: 'a' });
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
            stage.components.delete({ entity: entityA, type: 'a' });
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
            stage.components.add(new Component(stage, { entity: entityA, type: 'e', value: { a: { b: 'b', c: 1 } } }));
            await time.runMicrotasks();
            assertEquals(refI.state, 'resolved');
        });

        it('should return "pending" if component has not been resolved', async () => {
            await time.runMicrotasks();
            assertEquals(refI.state, 'pending');
        });
    });

    it('should release the reference if the referer is removed from the set of components', async () => {
        stage.components.delete({ entity: entityC, type: 'a' });

        await time.runMicrotasks();

        assertEquals(refA.state, 'released');
        assertEquals(refB.state, 'released');
        assertEquals(refC.state, 'released');
        assertEquals(refD.state, 'released');
        assertEquals(refE.state, 'released');
        assertEquals(refF.state, 'released');
        assertEquals(refG.state, 'released');
        assertEquals(refH.state, 'released');
        assertEquals(refI.state, 'aborted');

    })

    describe('find', () => {
        it('should iterate over all references of specified entity and type', () => {
            const refZ = stage.references.components.create({ entity: entityC, type: 'a' }, { entity: entityB, type: 'b' });

            assertEquals([...stage.references.components.find({ entity: entityA, type: 'a' })], [refA]);
            assertEquals([...stage.references.components.find({ entity: entityA, type: 'b' })], [refB]);
            assertEquals([...stage.references.components.find({ entity: entityB, type: 'b' })], [refB, refZ]);
        });
        it('should iterate over all references of specified entity', () => {
            assertEquals([...stage.references.components.find({ entity: entityA })], [refA, refB, refC, refD, refI]);
            assertEquals([...stage.references.components.find({ entity: entityB })], [refE, refF, refG, refH]);
        });

        it('should not error when iterating over a non existent entity', () => {
            assertEquals([...stage.references.components.find({ entity: 'z' })], []);
        });

        it('should not error when iterating over a non existent type', () => {
            assertEquals([...stage.references.components.find({ entity: 'a', type: 'e' })], []);
        });

        describe('predicate', () => {
            it('should only return the references where the predicate is true', () => {
                const refZ = stage.references.components.create({ entity: UUID(), type: 'a' }, { entity: entityB, type: 'b' });

                assertEquals([...stage.references.components.find({ entity: entityB, type: 'b', predicate: (c) => c.referer.entity !== entityC })], [refZ]);
                assertEquals([...stage.references.components.find({ entity: entityA, predicate: (c) => c.type === 'a' })], [refA]);
                assertEquals([...stage.references.components.find({ predicate: (c) => c.type === 'a' })], [refA, refE]);
            });
        });
    });

    describe('count', () => {
        it('should return the number of references created for that specific entity', () => {
            assertEquals(stage.references.components.count({ entity: entityA }), 5);
            assertEquals(stage.references.components.count({ entity: entityB }), 4);
            assertEquals(stage.references.components.count({ entity: entityC }), 0);
        });

        it('should increment the number of references when creating a new reference', () => {
            assertEquals(stage.references.components.count({ entity: entityA }), 5);
            stage.references.components.create({ entity: entityC, type: 'a' }, { entity: entityA, type: 'b' });
            assertEquals(stage.references.components.count({ entity: entityA }), 6);
        });


        it('should decrement the number of references when releasing', async () => {
            assertEquals(stage.references.components.count({ entity: entityA }), 5);
            refA.release();
            assertEquals(stage.references.components.count({ entity: entityA }), 4);
        });

        it('should return the number of references created for that specific entity and component type', () => {
            stage.references.components.create({ entity: UUID(), type: 'a' }, { entity: entityB, type: 'b' });

            assertEquals(stage.references.components.count({ entity: entityA, type: 'a' }), 1);
            assertEquals(stage.references.components.count({ entity: entityB, type: 'a' }), 1);
            assertEquals(stage.references.components.count({ entity: entityB, type: 'b' }), 2);

        });

        describe('predicate', () => {
            it('should only count the references where the predicate is true', () => {
                stage.references.components.create({ entity: UUID(), type: 'a' }, { entity: entityB, type: 'b' });

                assertEquals(stage.references.components.count({ entity: entityB, type: 'b', predicate: (c) => c.referer.entity !== entityC }), 1);
                assertEquals(stage.references.components.count({ entity: entityA, predicate: (c) => c.type === 'a' }), 1);
                assertEquals(stage.references.components.count({ predicate: (c) => c.type === 'a' }), 2);
            });
        });
    });

    describe('has', () => {
        it('should return true if there are any references for the specified entity and type', () => {
            assert(stage.references.components.has({ entity: entityA, type: 'a' }));
        });

        it('should return false if there are not any references for the specified entity and type', () => {
            assertFalse(stage.references.components.has({ entity: entityB, type: 'e' }));
        });

        it('should return true if there are any references for the specified entity', () => {
            assert(stage.components.has({ entity: entityA }));
        });

        it('should return false if there are not any references for the specified entity', () => {
            assertFalse(stage.components.has({ entity: UUID() }));
        });

        describe('predicate', () => {
            it('should only return true if the predicate is true', () => {
                assert(stage.references.components.has({ entity: entityA, type: 'a', predicate: (c) => c.referer.entity === entityC }));
                assertFalse(stage.references.components.has({ entity: entityA, type: 'a', predicate: (c) => c.referer.entity !== entityC }));

                assert(stage.references.components.has({ entity: entityB, predicate: (c) => c.type === 'a' }));
                assertFalse(stage.references.components.has({ entity: entityB, predicate: (c) => c.type === 'e' }));

                assert(stage.references.components.has({ predicate: (c) => c.entity === entityA && c.type === 'e' }));
                assertFalse(stage.references.components.has({ predicate: (c) => c.entity === entityB && c.type === 'e' }));
            });
        });
    });

    describe('events', () => {
        /** @type {{ entity: string, type: string }} */
        let referer;
        beforeEach(() => {
            handler = spy();
            referer = { entity: UUID(), type: 'a' };
        });

        it('should notify reference:add when a new reference is added', () => {
            stage.references.components.watch('reference:add', handler);
            stage.references.components.create(referer, { entity: entityC, type: 'c' });
            assertSpyCall(handler, 0, { args: [{ referer, count: 10 }]});
        });

        it('should notify reference:add:${entity} when a new reference is added', () => {
            stage.references.components.watch(`reference:add:${entityC}`, handler);
            stage.references.components.create(referer, { entity: entityC, type: 'c' });
            assertSpyCall(handler, 0, { args: [{ referer, count: 1 }]});
        });

        it('should notify reference:add:${entity}:${type} when a new reference is added', () => {
            stage.references.components.watch(`reference:add:${entityC}:c`, handler);
            stage.references.components.create(referer, { entity: entityC, type: 'c' });
            assertSpyCall(handler, 0, { args: [{ referer, count: 1 }]});
        });


        it('should notify reference:release when reference is released', () => {
            stage.references.components.watch('reference:release', handler);
            refA.release();
            assertSpyCall(handler, 0, { args: [{ referer: { entity: entityC, type: 'a' }, count: 8 }]});
        });

        it('should notify reference:release:${entity} when reference is released', () => {
            stage.references.components.watch(`reference:release:${entityA}`, handler);
            refA.release();
            assertSpyCall(handler, 0, { args: [{ referer: { entity: entityC, type: 'a' }, count: 4 }]});
        });

        it('should notify reference:release:${entity}:${type} when reference is released', () => {
            stage.references.components.watch(`reference:release:${entityA}:a`, handler);
            refA.release();
            assertSpyCall(handler, 0, { args: [{ referer: { entity: entityC, type: 'a' }, count: 0 }]});
        });
    });

    describe('[Symbol.iterator]', () => {
        it('should iterate over entire set of components', () => {
            assertEquals([...stage.references.components], [refA, refB, refC, refD, refE, refF, refG, refH, refI]);
        });
    });
});
