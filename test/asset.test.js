import { describe, it, beforeEach, afterEach } from 'std/testing/bdd.ts';
import { spy, assertSpyCalls                 } from 'std/testing/mock.ts';
import { FakeTime                            } from 'std/testing/time.ts';

import { assertEquals          } from 'std/assert/assert_equals.ts';
import { assertNotEquals       } from 'std/assert/assert_not_equals.ts';
import { assertStrictEquals    } from 'std/assert/assert_strict_equals.ts';
import { assertNotStrictEquals } from 'std/assert/assert_not_strict_equals.ts';
import { assertExists          } from 'std/assert/assert_exists.ts';
import { assertThrows          } from 'std/assert/assert_throws.ts';
import { assertInstanceOf      } from 'std/assert/assert_instance_of.ts';

import { Asset } from '../lib/asset.js';



/** @typedef {import('std/testing/mock.ts').Spy} Spy */
/** @typedef {import('std/testing/mock.ts').Stub} Stub */

/**
 * @typedef {import('../lib/prefab.js').ComponentTypes} ComponentTypes
*/

describe('Asset', () => {
    /** @type {FakeTime} */
    let time;

    /** @type {string} */
    const pathA = import.meta.resolve('./fixtures/assetA.json');
    /** @type {string} */
    const pathB = import.meta.resolve('./fixtures/assetB.json');
    /** @type {string} */
    const pathC = import.meta.resolve('./fixtures/assetC.json');

    /** @type {Asset} */
    let assetA;

    /** @type {Asset} */
    let assetB;

    /** @type {Spy} */
    let fetchSpy;

    beforeEach(() => {
        time = new FakeTime();

        fetchSpy = spy(globalThis, 'fetch');

        assetA = new Asset({ entity: 'entityA', value: { path: pathA } });
        assetB = new Asset({ entity: 'entityB', value: { path: pathB } }, [assetA]);
    });

    afterEach(() => {
        time.restore();

        fetchSpy.restore();
        Asset.clearCache();
    });

    describe('constructor', () => {
        it('should initialize the asset with the correct entity and path', () => {
            assertEquals(assetA.entity, 'entityA');
            assertEquals(assetA.path, pathA);

            assertEquals(assetB.entity, 'entityB');
            assertEquals(assetB.path, pathB);
            assertEquals(assetB.referer, [assetA]);
        });

        it('should initiate the loading process automatically', () => {
            assertEquals(fetchSpy.calls[0].args[0].toString(), pathA);
            assertEquals(fetchSpy.calls[1].args[0].toString(), pathB);
        });
    });

    describe('data', () => {
        it('should be undefined until data:load event', async () => {
            assertEquals(assetA.data, undefined);
            assertEquals(assetB.data, undefined);

            await Promise.all([assetA.waitFor('data:load'), assetB.waitFor('data:load')]);

            assertExists(assetA.data);
            assertExists(assetB.data);
        })

        it('should have a reference to the fetched response json', async () => {
            await Promise.all([assetA.waitFor('data:load'), assetB.waitFor('data:load')]);

            assertEquals(assetA.data, { test: 'assetA' });
            assertEquals(assetB.data, { test: 'assetB' });
        });
    });

    describe('instance', () => {
        it('should be undefined until instance:create event', async () => {
            assertEquals(assetA.instance, undefined);
            assertEquals(assetB.instance, undefined);

            await Promise.all([assetA.waitFor('instance:create'), assetB.waitFor('instance:create')]);

            assertExists(assetA.instance);
            assertExists(assetB.instance);
        });
    });

    describe('referer', () => {
        it('should throw error on recursive loop', () => {
            assertThrows(() => new Asset({ entity: 'entityC', value: { path: pathA } }, [assetA]), 'Asset recursion loop');
            assertThrows(() => new Asset({ entity: 'entityC', value: { path: pathA } }, [assetA, assetB]), 'Asset recursion loop');
        });
    });

    describe('state', () => {
        it('should start in loading state', () => {
            assertEquals(assetA.state, 'loading');
            assertEquals(assetB.state, 'loading');
        });

        it('should move to creating state after data:load', async () => {
            await assetA.waitFor('data:load');
            assertEquals(assetA.state, 'creating');
        });

        it('should move to ready state after instance:create', async () => {
            await Promise.all([assetA.waitFor('instance:create'), assetB.waitFor('instance:create')]);

            assertEquals(assetA.state, 'ready');
            assertEquals(assetB.state, 'ready');
        });

        it('should move back to loading state if path has changed', async () => {
            await assetA.waitFor('instance:create');

            assetA.set({ path: pathB });

            assertEquals(assetA.state, 'loading');
        });

        it('should move to error state if asset failed to load', async () => {
            const assetC = new Asset({ entity: 'entityC', value: { path: 'nonexistentpath.json' } }); 
            await assetC.waitFor('error');
            assertEquals(assetC.state, 'error');
        });

        it('should move to unloaded state if asset is unloaded', () => {
            assetA.unload()
            assertEquals(assetA.state, 'unloaded');
        })
    });

    describe('fetch', () => {
        it('should fetch the asset and return a Response object', async () => {
            const responseA = await assetA.fetch();
            assertInstanceOf(responseA, Response);
            assertEquals(await responseA.json(), { test: 'assetA' });

            const responseB = await assetB.fetch();
            assertInstanceOf(responseB, Response);
            assertEquals(await responseB.json(), { test: 'assetB' });
        });
    });

    describe('caching', () => {
        it('should only call fetch once per path', () => {
            new Asset({ entity: 'entityC', value: { path: pathA } });
            assertEquals(fetchSpy.calls[0].args[0].toString(), pathA);
            assertEquals(fetchSpy.calls[1].args[0].toString(), pathB);
            assertSpyCalls(fetchSpy, 2);
        });

        it('should once again call fetch on a path where all assets were unloaded', () => {
            assetA.unload();
            new Asset({ entity: 'entityC', value: { path: pathA } });
            assertEquals(fetchSpy.calls[0].args[0].toString(), pathA);
            assertEquals(fetchSpy.calls[1].args[0].toString(), pathB);
            assertEquals(fetchSpy.calls[2].args[0].toString(), pathA);
            assertSpyCalls(fetchSpy, 3);
        });

        it('should have the same data reference for all assets of the same path', async () => {
            await assetA.waitFor('data:load');
            const assetC = new Asset({ entity: 'entityC', value: { path: pathA } });
            await assetC.waitFor('data:load');
            assertStrictEquals(assetA.data, assetC.data);
        });
    });    


    describe('set', () => {
        it('should set the path', () => {
            assetA.set({ path: pathB });
            assertEquals(assetA.path, pathB);
        });

        it('should initialize the load process again if the path has changed', async () => {
            const resultA = await assetA.waitFor('data:load');
            assertNotEquals(assetA.state, 'loading');
            assetA.set({ path: pathC });
            assertEquals(assetA.state, 'loading');
            const resultB = await assetA.waitFor('data:load');
            assertNotEquals(resultA, resultB);
        });

        it('should not initialize the load process again if the path has not changed', async () => {
            await assetA.waitFor('data:load');
            assertNotEquals(assetA.state, 'loading');
            assetA.set({ path: pathA });
            assertNotEquals(assetA.state, 'loading');
        });
    });

    describe('toJSON', () => {
        it('should return a { path: string } object', () => {
            assertEquals(assetA.toJSON(), { path: pathA });
            assertEquals(assetB.toJSON(), { path: pathB });
        });
    });

    describe('static abortAll', () => {
        it('should abort all assets', async () => {
            Asset.abortAll();

            await time.runMicrotasks();

            assertEquals(assetA.error, 'Aborted');
            assertEquals(assetB.error, 'Aborted');
        });
    });

    describe('static clearCache', () => {
        it('should abort all assets', async () => {
            Asset.clearCache();
            
            await time.runMicrotasks();

            assertEquals(assetA.error, 'Aborted');
            assertEquals(assetB.error, 'Aborted');
        });

        it('should clear cache for asset', async () => {
            const resultA = await assetA.waitFor('data:load');

            Asset.clearCache();

            const assetC = new Asset({ entity: 'entityC', value: { path: pathA } });

            const resultC = await assetC.waitFor('data:load');

            assertNotStrictEquals(resultA, resultC);
        });
    });

    describe('static getReferenceCount', () => {
        it('should return the number of references for each path', () => {
            new Asset({ entity: 'entityC', value: { path: pathA } });
            assertEquals(Asset.getReferenceCount(pathA), 2);
            assertEquals(Asset.getReferenceCount(pathB), 1);
        });

        it('should reduce the count when asset is unloaded', () => {
            assertEquals(Asset.getReferenceCount(pathA), 1);
            assertEquals(Asset.getReferenceCount(pathB), 1);

            assetA.unload();
            assetB.unload();

            assertEquals(Asset.getReferenceCount(pathA), 0);
            assertEquals(Asset.getReferenceCount(pathB), 0);
        });

        it('should reduce the count of a child asset when a referer is unloaded', async () => {
            new Asset({ entity: 'entityC', value: { path: pathA } }, [assetB]);

            assertEquals(Asset.getReferenceCount(pathA), 2);

            assetB.unload();

            await time.runMicrotasks();

            assertEquals(Asset.getReferenceCount(pathA), 1);
        });
    })
});
