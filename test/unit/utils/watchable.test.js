import { describe, it, beforeEach                     } from 'std/testing/bdd.ts';
import { spy, assertSpyCalls                          } from 'std/testing/mock.ts';
import { assertInstanceOf, assertExists, assertEquals } from 'std/testing/asserts.ts';

import { Watchable } from '../../../lib/utils/watchable.js';

describe('Watchable', () => {
    let handler, watchable, result;

    beforeEach(() => {
        handler   = spy();
        watchable = new Watchable();
        result    = watchable.watch(handler);
    });

    it('should call the handler in the next microtask execution when notify has been called.', async () => {
        watchable.notify();
        await null;
        assertSpyCalls(handler, 1);
    });

    it('should not call the handler more than once in the same microtask execution.', async () => {
        watchable.notify();
        watchable.notify();
        await null;
        assertSpyCalls(handler, 1);
    });

    it('should call the handler more than once if another microtask execution has occured.', async () => {
        watchable.notify();
        await null;
        watchable.notify();
        await null;
        assertSpyCalls(handler, 2);
    });

    it('should not call the handler if unwatch has been called.', async () => {
        watchable.unwatch(handler);
        watchable.notify();
        await null;
        assertSpyCalls(handler, 0);
    });

    it('should not call the handler if unwatch has been called even if after notify has been called but before the next microtask execution.', async () => {
        watchable.notify();
        watchable.unwatch(handler);
        await null;
        assertSpyCalls(handler, 0);
    });

    it('should return a result object containing original handler and an unwatch method.', async () => {
        assertEquals(result.handler, handler);
        result.unwatch();
        watchable.notify();
        await null;
        assertSpyCalls(handler, 0);
    });

    describe('Watcher object', () => {
        beforeEach(() => {
            handler   = spy();
            watchable = new Watchable();
            watchable.watch({ handler });
        });

        it('should accept an object containing a handler method', async () => {
            watchable.notify();
            await null;
            assertSpyCalls(handler, 1);
        });

        describe('immediate=true', () => {
            beforeEach(() => {
                handler   = spy();
                watchable = new Watchable();
                watchable.watch({ handler, immediate: true });
            });

            it('should call the handler immediately when notify has been called.', async () => {
                watchable.notify();
                assertSpyCalls(handler, 1);
            });

            it('should not call the handler if unwatch has been called.', async () => {
                watchable.unwatch(handler);
                watchable.notify();
                assertSpyCalls(handler, 0);
            });
        })
    });

    describe('mixin', () => {
        let ExtendedFloat, float;
        beforeEach(() => {
            ExtendedFloat = class extends Watchable.mixin(Float32Array) {}
            float = new ExtendedFloat(4);
        });

        it('should maintain specified super class', () => {
            assertInstanceOf(float, Float32Array);
            assertExists(ExtendedFloat.BYTES_PER_ELEMENT);
        });

        it('should add the notify method', () => {
            assertExists(float.notify);
        });

        it('should add the watch method', async () => {
            assertExists(float.watch);

            float.watch(handler);
            float.notify();

            await null;
            assertSpyCalls(handler, 1);
        });

        it('should add the watch method and support immediate=true', async () => {
            assertExists(float.watch);

            float.watch({ handler, immediate: true });
            float.notify();
            assertSpyCalls(handler, 1);
        });

        it('should add the unwatch method', async () => {
            assertExists(float.unwatch);

            float.watch(handler);
            float.unwatch(handler);
            float.notify();
            await null;
            assertSpyCalls(handler, 0);
        });

        it('should add the unwatch method and support immediate=true', async () => {
            assertExists(float.unwatch);

            float.watch({ handler, immediate: true });
            float.unwatch(handler);
            float.notify();
            assertSpyCalls(handler, 0);
        });

        it('should return an object containing original handler, an unwatch method, and immediate boolean.', async () => {
            const result = float.watch(handler);
            assertEquals(result.handler, handler);
            assertExists(result.immediate);
            result.unwatch();
            float.notify();
            await null;
            assertSpyCalls(handler, 0);
        });
    });
});
