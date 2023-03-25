import { describe, it, beforeEach, afterEach } from 'https://deno.land/std@0.143.0/testing/bdd.ts';
import { spy, assertSpyCalls                 } from 'https://deno.land/std@0.143.0/testing/mock.ts';
import { FakeTime                            } from "https://deno.land/std@0.180.0/testing/time.ts";
import { assertInstanceOf, assertExists      } from 'https://deno.land/std@0.143.0/testing/asserts.ts';

import { Watchable } from '../../../lib/utils/watchable.js';

describe('Watchable', () => {
    let handler, watchable, time;

    beforeEach(() => {
        time      = new FakeTime();
        handler   = spy();
        watchable = new Watchable();
        watchable.watch(handler);
    });

    afterEach(() => {        
        time.restore();
    });

    it('should call the handler in the next microtask execution when notify has been called.', async () => {
        watchable.notify();
        await time.runMicrotasks();
        assertSpyCalls(handler, 1);
    });

    it('should not call the handler more than once in the same microtask execution.', async () => {
        watchable.notify();
        watchable.notify();
        await time.runMicrotasks();
        assertSpyCalls(handler, 1);
    });

    it('should call the handler more than once if another microtask execution has occured.', async () => {
        watchable.notify();
        await time.runMicrotasks();
        watchable.notify();
        await time.runMicrotasks();
        assertSpyCalls(handler, 2);
    });

    it('should not call the handler if unwatch has been called.', async () => {
        watchable.unwatch(handler);
        watchable.notify();
        await time.runMicrotasks();
        assertSpyCalls(handler, 0);
    });

    it('should not call the handler if unwatch has been called even if after notify has been called but before the next microtask execution.', async () => {
        watchable.notify();
        watchable.unwatch(handler);
        await time.runMicrotasks();
        assertSpyCalls(handler, 0);
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

            await time.runMicrotasks();
            assertSpyCalls(handler, 1);
        });

        it('should add the unwatch method', async () => {
            assertExists(float.unwatch);

            float.watch(handler);
            float.unwatch(handler);
            float.notify();
            await time.runMicrotasks();
            assertSpyCalls(handler, 0);
        });
    });
});
