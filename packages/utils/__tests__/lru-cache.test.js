import { describe, it, expect, beforeEach, sinon, browserOnly } from 'bdd';

import { LRUCache } from '../lru-cache.js';

describe('LRUCache', () => {
    /** @type {LRUCache<number>} */
    let cache;

    /** @type {{ get: sinon.SinonSpy; put: sinon.SinonSpy; delete: sinon.SinonSpy }} */
    let persist;

    beforeEach(() => {
        const getSpy = sinon.spy(async () => {});
        const putSpy = sinon.spy(async () => {});
        const deleteSpy = sinon.spy(async () => {});

        persist = { get: getSpy, put: putSpy, delete: deleteSpy };
        cache = new LRUCache({ capacity: 2, persist });
    });

    it('returns null for missing keys without touching persistence', () => {
        expect(cache.get('missing')).to.equal(null);
        expect(persist.get).to.have.callCount(0);
    });

    it('initialises from provided entries', () => {
        const entriesCache = new LRUCache({
            capacity: 3,
            entries: [['a', 1], ['b', 2]],
        });

        expect(entriesCache.get('a')).to.equal(1);
        expect(entriesCache.get('b')).to.equal(2);
        expect(entriesCache.getLeastRecent()[0]).to.equal('a');
        expect(entriesCache.getMostRecent()[0]).to.equal('b');
    });

    it('updates recency ordering on get', () => {
        cache.put('a', 1);
        cache.put('b', 2);

        expect(cache.getLeastRecent()[0]).to.equal('a');

        expect(cache.get('a')).to.equal(1);
        expect(persist.get).to.have.callCount(1);
        expect(cache.getLeastRecent()[0]).to.equal('b');
        expect(cache.getMostRecent()[0]).to.equal('a');
    });

    it('evicts the least recent item when capacity is reached', () => {
        cache.put('a', 1);
        cache.put('b', 2);
        expect(persist.delete).to.have.callCount(0);

        cache.put('c', 3);

        expect(cache.has('a')).to.be.false;
        expect(cache.get('a')).to.equal(null);
        expect(persist.delete).to.have.callCount(1);
        expect(persist.put).to.have.callCount(3);
        expect(persist.delete).to.have.been.calledWith('a');
        expect(cache.getMostRecent()[0]).to.equal('c');
        expect(cache.getLeastRecent()[0]).to.equal('b');
    });

    it('deletes existing keys and mirrors to persistence', () => {
        cache.put('a', 1);
        cache.delete('a');

        expect(cache.has('a')).to.be.false;
        expect(persist.delete).to.have.callCount(1);
        expect(persist.delete).to.have.been.calledWith('a');
    });

    it('allows overwriting existing keys without increasing size', () => {
        cache.put('a', 1);
        cache.put('b', 2);
        cache.put('a', 42);

        expect(cache.get('a')).to.equal(42);
        expect(cache.getMostRecent()[0]).to.equal('a');
        expect([...cache.cache.keys()]).to.deep.equal(['b', 'a']);
        expect(persist.put).to.have.callCount(3);
    });

    browserOnly('fromIndexedDB', () => {
        it('creates a new cache and persists operations to IndexedDB', async () => {
            const dbCache = await LRUCache.fromIndexedDB(3, 'test-cache-db', 1);

            dbCache.put('key1', { data: 'value1' });
            dbCache.put('key2', { data: 'value2' });
            dbCache.put('key3', { data: 'value3' });

            expect(dbCache.get('key1')).to.deep.equal({ data: 'value1' });
            expect(dbCache.get('key2')).to.deep.equal({ data: 'value2' });
            expect(dbCache.get('key3')).to.deep.equal({ data: 'value3' });

            const dbCache2 = await LRUCache.fromIndexedDB(3, 'test-cache-db', 1);

            expect(dbCache2.get('key1')).to.deep.equal({ data: 'value1' });
            expect(dbCache2.get('key2')).to.deep.equal({ data: 'value2' });
            expect(dbCache2.get('key3')).to.deep.equal({ data: 'value3' });
        });

        it('handles eviction and persists deletions to IndexedDB', async () => {
            const dbCache = await LRUCache.fromIndexedDB(2, 'test-eviction-db', 1);

            dbCache.put('a', 100);
            dbCache.put('b', 200);
            dbCache.put('c', 300);

            expect(dbCache.get('a')).to.equal(null);
            expect(dbCache.get('b')).to.equal(200);
            expect(dbCache.get('c')).to.equal(300);

            const dbCache2 = await LRUCache.fromIndexedDB(2, 'test-eviction-db', 1);

            expect(dbCache2.get('a')).to.equal(null);
            expect(dbCache2.get('b')).to.equal(200);
            expect(dbCache2.get('c')).to.equal(300);
        });

        it('updates accessed timestamp in IndexedDB on get', async () => {
            const dbCache = await LRUCache.fromIndexedDB(2, 'test-access-db', 1);

            dbCache.put('key1', 'value1');

            dbCache.get('key1');

            const dbCache2 = await LRUCache.fromIndexedDB(2, 'test-access-db', 1);
            expect(dbCache2.get('key1')).to.equal('value1');
        });

        it('handles explicit deletions', async () => {
            const dbCache = await LRUCache.fromIndexedDB(2, 'test-delete-db', 1);

            dbCache.put('key1', 'value1');
            dbCache.put('key2', 'value2');

            dbCache.delete('key1');

            expect(dbCache.get('key1')).to.equal(null);
            expect(dbCache.get('key2')).to.equal('value2');

            const dbCache2 = await LRUCache.fromIndexedDB(2, 'test-delete-db', 1);
            expect(dbCache2.get('key1')).to.equal(null);
            expect(dbCache2.get('key2')).to.equal('value2');
        });

        it('loads entries in order of access time', async () => {
            const dbCache = await LRUCache.fromIndexedDB(3, 'test-order-db', 1);

            dbCache.put('first', 1);
            dbCache.put('second', 2);
            dbCache.put('third', 3);

            const dbCache2 = await LRUCache.fromIndexedDB(3, 'test-order-db', 1);

            expect(dbCache2.get('first')).to.equal(1);
            expect(dbCache2.get('second')).to.equal(2);
            expect(dbCache2.get('third')).to.equal(3);
        });

        it('creates object store on first use', async () => {
            const dbCache = await LRUCache.fromIndexedDB(2, 'test-new-db', 1);

            dbCache.put('initial', 'value');
            expect(dbCache.get('initial')).to.equal('value');
        });

        it('handles empty database', async () => {
            const dbCache = await LRUCache.fromIndexedDB(5, 'test-empty-db', 1);

            expect(dbCache.get('nonexistent')).to.equal(null);

            dbCache.put('new', 'data');
            expect(dbCache.get('new')).to.equal('data');
        });
    });
});
