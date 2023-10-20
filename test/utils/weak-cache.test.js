import { describe, it, beforeEach } from 'std/testing/bdd.ts';

import { assert                } from 'std/assert/assert.ts';
import { assertFalse           } from 'std/assert/assert_false.ts';
import { assertEquals          } from 'std/assert/assert_equals.ts';
import { assertStrictEquals    } from 'std/assert/assert_strict_equals.ts';
import { assertNotStrictEquals } from 'std/assert/assert_not_strict_equals.ts';
import { assertInstanceOf      } from 'std/assert/assert_instance_of.ts';

import { WeakCache } from '../../lib/utils/weak-cache.js';

describe('WeakCache', () => {
    /** @type {WeakCache<{ foo: string }>} */
    let cache;

    /** @type {WeakKey} */
    let keyA;
    /** @type {WeakKey} */
    let keyB;

    /** @type {{ foo?: string }} */
    let fooA;
    /** @type {{ foo?: string }} */
    let fooB;
    /** @type {{ foo?: string }} */
    let fooC;
    /** @type {{ foo?: string }} */
    let fooD;

    beforeEach(() => {
        keyA = {};
        keyB = {};

        cache = new WeakCache();

        fooA = cache.ensure(keyA);
        fooB = cache.ensure(keyB);
        fooC = cache.ensure(keyA, keyB);
        fooD = cache.ensure(keyB, keyA);
    });

    describe('ensure', () => {
        it('should return an object for the given key', () => {
            assertInstanceOf(fooA, Object);
            assertInstanceOf(fooB, Object);
        });
    
        it('should return an object for the given key sequence', () => {
            assertInstanceOf(fooC, Object);
            assertInstanceOf(fooD, Object);
        });

        it('should return the same object for the given key each time', () => {
            assertStrictEquals(fooA, cache.ensure(keyA));
            assertStrictEquals(fooB, cache.ensure(keyB));
        });

        it('should return the same object for the given key sequence each time', () => {
            assertStrictEquals(fooC, cache.ensure(keyA, keyB));
            assertStrictEquals(fooD, cache.ensure(keyB, keyA));
        });
    });

    describe('get', () => {
        it('should return the object for the given key', () => {
            assertStrictEquals(fooA, cache.get(keyA));
            assertStrictEquals(fooB, cache.get(keyB));
            assertStrictEquals(fooC, cache.get(keyA, keyB));
            assertStrictEquals(fooD, cache.get(keyB, keyA));
        });

        it('should return undefined if key does not exist', () => {
            assertEquals(cache.get({}), undefined);
            assertEquals(cache.get({}, {}), undefined);
            assertEquals(cache.get(keyA, {}), undefined);
            assertEquals(cache.get({}, keyA), undefined);
        });
    });

    describe('has', () => {
        it('should return true for the given key', () => {
            assert(cache.has(keyA));
            assert(cache.has(keyB));
            assert(cache.has(keyA, keyB));
            assert(cache.has(keyB, keyA));
        });

        it('should return false if key does not exist', () => {
            assertFalse(cache.has({}));
            assertFalse(cache.has({}, {}));
            assertFalse(cache.has(keyA, {}));
            assertFalse(cache.has({}, keyA));
        });
    });

    describe('delete', () => {
        it('should delete the object for the given key', () => {
            cache.delete(keyA);
            cache.delete(keyB);
            assertNotStrictEquals(fooA, cache.get(keyA));
            assertNotStrictEquals(fooB, cache.get(keyB));
        });
    
        it('should delete the object for the given key sequence', () => {
            cache.delete(keyA, keyB);
            cache.delete(keyB, keyA);
            assertNotStrictEquals(fooC, cache.get(keyA, keyB));
            assertNotStrictEquals(fooD, cache.get(keyB, keyA));
        });

        it('should return false if key does not exist', () => {
            assertFalse(cache.delete({}))
            assertFalse(cache.delete({}, {}));
            assertFalse(cache.delete(keyA, {}));
        });
    });


    describe('set', () => {
        /** @type {WeakKey} */
        let keyC;

        /** @type {object} */
        let fooC;
        
        beforeEach(() => {
            keyC = {};
            fooC = {};
        });
        it('should set the cache object for the given key', () => {
            cache.set(keyA, fooC);
            cache.set(keyB, fooC);
            cache.set(keyA, keyB, fooC);
            cache.set(keyB, keyA, fooC);
            assertStrictEquals(cache.get(keyA), fooC);
            assertStrictEquals(cache.get(keyB), fooC);
            assertStrictEquals(cache.get(keyA, keyB), fooC);
            assertStrictEquals(cache.get(keyB, keyA), fooC);
        });
    
        it('should create a new cache object if it does not exist', () => {
            cache.set(keyC, fooC);
            cache.set(keyA, keyC, fooC);

            assertStrictEquals(cache.get(keyC), fooC);
            assertStrictEquals(cache.get(keyA, keyC), fooC);
        });

        it('should return the object value provided', () => {
            assertStrictEquals(cache.set(keyC, fooC), fooC);
            assertStrictEquals(cache.set(keyA, keyC, fooC), fooC);
        })
    });
});
