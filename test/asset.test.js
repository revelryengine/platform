import { describe, it, beforeEach, afterEach } from 'https://deno.land/std@0.208.0/testing/bdd.ts';
import { spy, assertSpyCall, assertSpyCalls  } from 'https://deno.land/std@0.208.0/testing/mock.ts';
import { FakeTime                            } from 'https://deno.land/std@0.208.0/testing/time.ts';

import { assert             } from 'https://deno.land/std@0.208.0/assert/assert.ts';
import { assertEquals       } from 'https://deno.land/std@0.208.0/assert/assert_equals.ts';
import { assertFalse        } from 'https://deno.land/std@0.208.0/assert/assert_false.ts';
import { assertStrictEquals } from 'https://deno.land/std@0.208.0/assert/assert_strict_equals.ts';
import { assertThrows       } from 'https://deno.land/std@0.208.0/assert/assert_throws.ts';
import { assertRejects      } from 'https://deno.land/std@0.208.0/assert/assert_rejects.ts';

import { Game, Stage, UUID, AssetReference, registerLoader, unregisterLoader } from '../lib/ecs.js';

const JSON_DATA_URI_A ='data:application/json;charset=utf-8;base64,eyAiYSI6ICJhIiB9';
const JSON_DATA_URI_B ='data:application/json;charset=utf-8;base64,eyAiYiI6ICJiIiB9';
const JSON_DATA_URI_C ='data:application/json;charset=utf-8;base64,eyAiYyI6ICJjIiB9';

/**
 * @import { Spy } from 'https://deno.land/std@0.208.0/testing/mock.ts';
 */

describe('assets', () => {
    /** @type {FakeTime} */
    let time;

    /** @type {Spy} */
    let handler;

    /** @type {Spy} */
    let loaderA;

    /** @type {Spy} */
    let loaderB;

    /** @type {Spy} */
    let loaderC;

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

    /** @type {AssetReference} */
    let refA;
    /** @type {AssetReference} */
    let refB;
    /** @type {AssetReference} */
    let refC;

    /** @type {AssetReference} */
    let refD;
    /** @type {AssetReference} */
    let refE;
    /** @type {AssetReference} */
    let refF;

    /** @type {AssetReference} */
    let refG;
    /** @type {AssetReference} */
    let refH;
    /** @type {AssetReference} */
    let refI;

    beforeEach(() => {
        time    = new FakeTime();

        handler = spy();

        loaderA = spy((uri, { signal }) => fetch(uri, { signal }).then(res => res.json()));
        loaderB = spy((uri, { signal }) => fetch(uri, { signal }).then(res => res.json()));
        loaderC = spy((uri, { signal }) => fetch(uri, { signal }).then(res => res.json()));

        registerLoader('a', loaderA);
        registerLoader('b', loaderB);
        registerLoader('c', loaderC);

        game  = new Game();
        stage = new Stage(game, 'stage');

        entityA = UUID();
        entityB = UUID();
        entityC = UUID();

        stage.createComponent({ entity: entityA, type: 'a' });
        stage.createComponent({ entity: entityB, type: 'b' });
        stage.createComponent({ entity: entityC, type: 'c' });

        refA = stage.references.assets.create({ entity: entityA, type: 'a' }, { uri: JSON_DATA_URI_A, type: 'a' });
        refB = stage.references.assets.create({ entity: entityA, type: 'b' }, { uri: JSON_DATA_URI_B, type: 'b' });
        refC = stage.references.assets.create({ entity: entityA, type: 'c' }, { uri: JSON_DATA_URI_C, type: 'c' });

        refD = stage.references.assets.create({ entity: entityB, type: 'a' }, { uri: JSON_DATA_URI_A, type: 'a' });
        refE = stage.references.assets.create({ entity: entityB, type: 'b' }, { uri: JSON_DATA_URI_B, type: 'b' });
        refF = stage.references.assets.create({ entity: entityB, type: 'c' }, { uri: JSON_DATA_URI_C, type: 'c' });

        refG = stage.references.assets.create({ entity: entityC, type: 'a' }, { uri: JSON_DATA_URI_A, type: 'a' });
        refH = stage.references.assets.create({ entity: entityC, type: 'b' }, { uri: JSON_DATA_URI_B, type: 'b' });
        refI = stage.references.assets.create({ entity: entityC, type: 'c' }, { uri: JSON_DATA_URI_C, type: 'c' });

    });

    afterEach(() => {
        unregisterLoader('a');
        unregisterLoader('b');
        unregisterLoader('c');

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

    it('should call the loader exactly once for each active reference', () => {
        assertSpyCalls(loaderA, 1);
        assertSpyCalls(loaderB, 1);
        assertSpyCalls(loaderC, 1);
    });

    it('should resolve each reference to the same data reference', async () => {
        await Promise.all([
            refA.waitFor('resolve'),
            refB.waitFor('resolve'),
            refC.waitFor('resolve'),
            refD.waitFor('resolve'),
            refE.waitFor('resolve'),
            refF.waitFor('resolve'),
            refG.waitFor('resolve'),
            refH.waitFor('resolve'),
            refI.waitFor('resolve'),
        ]);

        assertStrictEquals(refA.data, refD.data);
        assertStrictEquals(refB.data, refE.data);
        assertStrictEquals(refC.data, refF.data);

        assertStrictEquals(refA.data, refG.data);
        assertStrictEquals(refB.data, refH.data);
        assertStrictEquals(refC.data, refI.data);
    });

    it('should throw if asset loader is not registered', () => {
        assertThrows(() => stage.references.assets.create({ entity: entityA, type: 'a' }, { uri: JSON_DATA_URI_A, type: 'z' }), 'No asset loader registered for type z');
    });

    it('should not error when registering the same loader twice', () => {
        registerLoader('a', loaderA);
    });

    it('should notify release if referer removed', () => {
        refA.watch('release', handler);
        stage.components.delete({ entity: entityA, type: 'a' });
        assertSpyCalls(handler, 1);
    });

    it('should notify release if released', () => {
        refA.watch('release', handler);
        refA.release();
        assertSpyCalls(handler, 1);
    });

    it('should remove reference from reference set when released', () => {
        refA.release();
        refD.release();
        refG.release();
        assertEquals([...stage.references.assets.find({ uri: JSON_DATA_URI_A, type: 'a' })].length, 0);
    });

    it('should have a reference to the referer', () => {
        assertEquals(refA.referer, { entity: entityA, type: 'a' });
    });

    it('should have a reference to the uri', () => {
        assertEquals(refA.uri, JSON_DATA_URI_A);
    });

    it('should have a reference to the type', () => {
        assertEquals(refA.type, 'a');
    });

    describe('get', () => {
        it('should resolve the data if it exists', async () => {
            await refA.waitFor('resolve');
            assertEquals(await refA.get(), { a: 'a' });
        });

        it('should resolve the data if is finished fetching later', async () => {
            assertEquals(await refA.get(), { a: 'a' });
        });

        it('should reject if reference is released before resolving', async () => {
            const promise = assertRejects(() => refI.get());
            refI.release();
            await promise;
        });

        it('should reject if reference is not in a state of pending', async () => {
            refI.release();
            await assertRejects(() => refI.get());
        });
    });

    describe('state', () => {
        it('should return "released" if released', async () => {
            await time.runMicrotasks();
            refA.release();
            assertEquals(refA.state, 'released');
        });


        it('should return "aborted" if ref was released before resolving', async () => {
            refI.release();
            await time.runMicrotasks();
            assertEquals(refI.state, 'aborted');
        });

        it('should return "resolved" if data has been resolved', async () => {
            await time.runMicrotasks();
            assertEquals(refA.state, 'resolved');
        });

        it('should return "pending" if component has not been resolved', async () => {
            assertEquals(refA.state, 'pending');
        });
    });


    describe('find', () => {
        it('should iterate over all references of specified uri and type', () => {
            assertEquals([...stage.references.assets.find({ uri: JSON_DATA_URI_A, type: 'a' })], [refA, refD, refG]);
            assertEquals([...stage.references.assets.find({ uri: JSON_DATA_URI_B, type: 'b' })], [refB, refE, refH]);
            assertEquals([...stage.references.assets.find({ uri: JSON_DATA_URI_C, type: 'c' })], [refC, refF, refI]);
        });

        it('should iterate over all references of specified type', () => {
            assertEquals([...stage.references.assets.find({ type: 'a' })], [refA, refD, refG]);
            assertEquals([...stage.references.assets.find({ type: 'b' })], [refB, refE, refH]);
            assertEquals([...stage.references.assets.find({ type: 'c' })], [refC, refF, refI]);
        });

        it('should not error when iterating over a non existent type', () => {
            assertEquals([...stage.references.assets.find({ type: 'z' })], []);
        });

        it('should not error when iterating over a non existent uri and type', () => {
            assertEquals([...stage.references.assets.find({ uri: 'a', type: 'e' })], []);
        });

        describe('predicate', () => {
            it('should only return the references where the predicate is true', () => {
                assertEquals([...stage.references.assets.find({ uri: JSON_DATA_URI_A, type: 'a', predicate: (a) => a.referer.entity !== entityA })], [refD, refG]);
                assertEquals([...stage.references.assets.find({ uri: JSON_DATA_URI_A, type: 'a', predicate: (a) => a.referer.entity !== entityA })], [refA, refG]);
                assertEquals([...stage.references.assets.find({ predicate: (c) => c.type === 'a' })], [refA, refD, refG]);
            });
        });
    });

    describe('count', () => {
        it('should return the number of references created for that specific type', () => {
            assertEquals(stage.references.assets.count({ type: 'a' }), 3);
            assertEquals(stage.references.assets.count({ type: 'b' }), 3);
            assertEquals(stage.references.assets.count({ type: 'c' }), 3);
        });

        it('should increment the number of references when creating a new reference', () => {
            assertEquals(stage.references.assets.count({ type: 'a' }), 3);
            stage.references.assets.create({ entity: entityC, type: 'd' }, { uri: JSON_DATA_URI_A, type: 'a' });
            assertEquals(stage.references.assets.count({ type: 'a' }), 4);
        });

        it('should decrement the number of references when releasing', async () => {
            assertEquals(stage.references.assets.count({ type: 'a' }), 3);
            refA.release();
            assertEquals(stage.references.assets.count({ type: 'a' }), 2);
        });

        it('should return the number of references created for that specific uri and type', () => {
            assertEquals(stage.references.assets.count({ uri: JSON_DATA_URI_A, type: 'a' }), 3);
            assertEquals(stage.references.assets.count({ uri: JSON_DATA_URI_B, type: 'b' }), 3);
            assertEquals(stage.references.assets.count({ uri: JSON_DATA_URI_C, type: 'c' }), 3);

        });

        describe('predicate', () => {
            it('should only count the references where the predicate is true', () => {
                assertEquals(stage.references.assets.count({ uri: JSON_DATA_URI_A, type: 'a', predicate: (c) => c.referer.entity !== entityC }), 2);
                assertEquals(stage.references.assets.count({ type: 'a', predicate: (c) => c.referer.entity !== entityC }), 2);
                assertEquals(stage.references.assets.count({ predicate: (c) => c.type === 'a' }), 3);
            });
        });
    });

    describe('has', () => {
        it('should return true if there are any references for the specified uri and type', () => {
            assert(stage.references.assets.has({ uri: JSON_DATA_URI_A, type: 'a' }));
        });

        it('should return false if there are not any references for the specified uri and type', () => {
            assertFalse(stage.references.assets.has({ uri: JSON_DATA_URI_A, type: 'e' }));
        });

        it('should return true if there are any references for the specified type', () => {
            assert(stage.references.assets.has({ type: 'a' }));
        });

        it('should return false if there are not any references for the specified type', () => {
            assertFalse(stage.references.assets.has({ type: 'e' }));
        });

        describe('predicate', () => {
            it('should only return true if the predicate is true', () => {
                assert(stage.references.assets.has({ uri: JSON_DATA_URI_A, type: 'a', predicate: (c) => c.referer.entity === entityC }));
                assertFalse(stage.references.assets.has({ uri: JSON_DATA_URI_A, type: 'a', predicate: (c) => c.referer.entity === UUID() }));

                assert(stage.references.assets.has({ type: 'b', predicate: (c) => c.uri === JSON_DATA_URI_B }));
                assertFalse(stage.references.assets.has({ type: 'b', predicate: (c) => c.uri === JSON_DATA_URI_A }));

                assert(stage.references.assets.has({ predicate: (c) => c.uri === JSON_DATA_URI_A && c.type === 'a' }));
                assertFalse(stage.references.assets.has({ predicate: (c) => c.uri === JSON_DATA_URI_B && c.type === 'a' }));
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
            stage.references.assets.watch('reference:add', handler);
            stage.references.assets.create(referer, { uri: JSON_DATA_URI_C, type: 'c' });
            assertSpyCall(handler, 0, { args: [{ referer, count: 10 }]});
        });

        it('should notify reference:add:${type} when a new reference is added', () => {
            stage.references.assets.watch(`reference:add:c`, handler);
            stage.references.assets.create(referer, { uri: JSON_DATA_URI_C, type: 'c' });
            assertSpyCall(handler, 0, { args: [{ referer, count: 4 }]});
        });

        it('should notify reference:add:${type}:${uri} when a new reference is added', () => {
            stage.references.assets.watch(`reference:add:c:${JSON_DATA_URI_C}`, handler);
            stage.references.assets.create(referer, { uri: JSON_DATA_URI_C, type: 'c' });
            assertSpyCall(handler, 0, { args: [{ referer, count: 4 }]});
        });


        it('should notify reference:release when reference is released', () => {
            stage.references.assets.watch('reference:release', handler);
            refA.release();
            assertSpyCall(handler, 0, { args: [{ referer: { entity: entityA, type: 'a' }, count: 8 }]});
        });

        it('should notify reference:release:${type} when reference is released', () => {
            stage.references.assets.watch(`reference:release:a`, handler);
            refA.release();
            assertSpyCall(handler, 0, { args: [{ referer: { entity: entityA, type: 'a' }, count: 2 }]});
        });

        it('should notify reference:release:${type}:${uri} when reference is released', () => {
            stage.references.assets.watch(`reference:release:a:${JSON_DATA_URI_A}`, handler);
            refA.release();
            assertSpyCall(handler, 0, { args: [{ referer: { entity: entityA, type: 'a' }, count: 2 }]});
        });
    });

    describe('[Symbol.iterator]', () => {
        it('should iterate over entire set of assets', () => {
            assertEquals([...stage.references.assets], [refA, refB, refC, refD, refE, refF, refG, refH, refI]);
        });
    });
});
