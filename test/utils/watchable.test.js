import { describe, it, beforeEach, afterEach                  } from 'std/testing/bdd.ts';
import { spy, assertSpyCall, assertSpyCalls                   } from 'std/testing/mock.ts';
import { assertInstanceOf, assertExists, assert, assertEquals } from 'std/testing/asserts.ts';
import { FakeTime                                             } from 'std/testing/time.ts';

import { Watchable } from '../../lib/utils/watchable.js';

/** @typedef {import('std/testing/mock.ts').Spy} Spy */


describe('Watchable', () => {

    /** @extends {Watchable<{ a: string, b: number , c: void, d: void }>} */
    class ExtendedWatchable extends Watchable { }

    /** @type {FakeTime}*/
    let time;
    /** @type {Spy} */
    let handler;
    /** @type {Spy} */
    let rejectHandler;
    /** @type {ExtendedWatchable} */
    let watchable;
    /** @type {AbortController} */
    let abortCtl;

    
    beforeEach(() => {
        time = new FakeTime();
        handler       = spy();
        rejectHandler = spy();
        watchable     = new ExtendedWatchable();
        watchable.watch(handler);
    });

    afterEach(() => {
        time.restore();
    });

    it('should call the handler in the next microtask execution when notify has been called.', async () => {
        watchable.notify('a', '123');
        await time.runMicrotasks();
        assertSpyCalls(handler, 1);
    });


    it('should not call the handler more than once in the same microtask execution.', async () => {
        watchable.notify('b', 123);
        watchable.notify('c');
        await time.runMicrotasks();
        assertSpyCalls(handler, 1);
    });

    it('should call the handler more than once if another microtask execution has occured.', async () => {
        watchable.notify('c');
        await time.runMicrotasks();
        watchable.notify('c');
        await time.runMicrotasks();
        assertSpyCalls(handler, 2);
    });

    it('should not call the handler if unwatch has been called.', async () => {
        watchable.unwatch(handler);
        watchable.notify('c');
        await time.runMicrotasks();
        assertSpyCalls(handler, 0);
    });

    it('should not call the handler if unwatch has been called even if after notify has been called but before the next microtask execution.', async () => {
        watchable.notify('c');
        watchable.unwatch(handler);
        await time.runMicrotasks();
        assertSpyCalls(handler, 0);
    });

    it('should call the handler with a map of the notification types and arguments', async () => {
        watchable.notify('a', 'abc');
        watchable.notify('b', 123);
        await time.runMicrotasks();
        assertEquals(handler.calls[0].args[0].get('a'), 'abc');
        assertEquals(handler.calls[0].args[0].get('b'), 123);
    });

    it('should not error when calling unwatch on a watchable that has not been watched', () => {
        watchable = new ExtendedWatchable();
        watchable.unwatch(handler); 
    });

    describe('Watcher object', () => {
        beforeEach(() => {
            handler   = spy();
            watchable = new ExtendedWatchable();
            watchable.watch({ handler });
        });

        it('should accept an object containing a handler method', async () => {
            watchable.notify('c');
            await time.runMicrotasks();
            assertSpyCalls(handler, 1);
        });

        it('should not call the handler if unwatch has been called.', async () => {
            watchable.unwatch({ handler });
            watchable.notify('c');
            await time.runMicrotasks();
            assertSpyCalls(handler, 0);
        });


        describe('type', () => {
            beforeEach(() => {
                handler   = spy();
                watchable = new ExtendedWatchable();
                watchable.watch('a', { handler });
            });

            it('should call the handler if type matches.', async () => {
                watchable.notify('a', 'abc');
                await time.runMicrotasks();
                assertSpyCalls(handler, 1);
            });

            it('should not call the handler if type does not match.', async () => {
                watchable.notify('b', 123);
                await time.runMicrotasks();
                assertSpyCalls(handler, 0);
            });
        });

        describe('immediate=true', () => {
            beforeEach(() => {
                handler   = spy();
                watchable = new ExtendedWatchable();
                watchable.watch({ handler, immediate: true });
            });

            it('should call the handler immediately when notify has been called.', async () => {
                watchable.notify('c');
                assertSpyCalls(handler, 1);
            });

            it('should not call the handler if unwatch has been called.', async () => {
                watchable.unwatch({ handler, immediate: true });
                watchable.notify('c');
                assertSpyCalls(handler, 0);
            });
        });

        describe('signal', () => {
            /** @type {AbortController} */
            let abortCtl;

            beforeEach(() => {
                handler   = spy();
                watchable = new ExtendedWatchable();
                abortCtl  = new AbortController();
                watchable.watch('c', { handler, signal: abortCtl.signal });
            });

            it('should not call handler if aborted', async () => {
                abortCtl.abort();
                watchable.notify('c');
                await time.runMicrotasks();
                assertSpyCalls(handler, 0);
            });

            it('should not error when abort has been called after the unwatch method', async() => {
                watchable.unwatch('c', { handler });
                abortCtl.abort();
                await time.runMicrotasks();
                assertSpyCalls(handler, 0);
            })
        });
    });

    describe('waitFor', () => {
        beforeEach(() => {
            handler   = spy();
            watchable = new ExtendedWatchable();
            abortCtl  = new AbortController();
            watchable.waitFor('a', abortCtl.signal).then(handler);
        });
    
        it('should call the handler in the next microtask execution when notify has been called.', async () => {
            watchable.notify('a', 'abc');
            await time.runMicrotasks();
            assertSpyCall(handler, 0, { args: ['abc']});
        });

        it('should not call the handler more than once.', async () => {
            watchable.notify('a', 'abc');
            await time.runMicrotasks();
            watchable.notify('a', 'abc');
            await time.runMicrotasks();
            assertSpyCall(handler, 0, { args: ['abc']});
            assertSpyCalls(handler, 1);
        });

        describe('signal', () => {
            beforeEach(() => {
                handler       = spy();
                rejectHandler = spy();
                watchable = new ExtendedWatchable();
                abortCtl  = new AbortController();
                watchable.waitFor('c', abortCtl.signal).then(handler).catch(rejectHandler);
            });

            it('should not call handler if aborted', async () => {
                abortCtl.abort();
                watchable.notify('c');
                await time.runMicrotasks();
                assertSpyCalls(handler, 0);
            });

            it('should not reject with aborted', async () => {
                abortCtl.abort();
                await time.runMicrotasks();
                assertSpyCall(rejectHandler, 0, { args: ['aborted']});
            });
        });
    });


    describe('mixin', () => {
        /** @typedef {{ a: string, b: number, c: void, d: void }} EventMap */

        class ExtendedFloat extends Watchable.mixin(Float32Array, /** @type {EventMap} */ ({})) { }

        /** @type {ExtendedFloat} */ 
        let float;

        beforeEach(() => {
            float = new ExtendedFloat(4);
            float.notify('c');
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
            float.notify('a', 'abc');

            await time.runMicrotasks();
            assertSpyCalls(handler, 1);
        });

        it('should add the watch method and support type', async () => {
            assertExists(float.watch);

            float.watch('a', handler);
            float.notify('a', 'abc');
            float.notify('b', 123);
            await time.runMicrotasks();
            assertSpyCalls(handler, 1);
        });

        it('should add the watch method and support immediate=true', async () => {
            assertExists(float.watch);

            float.watch({ handler, immediate: true });
            float.notify('c');
            assertSpyCalls(handler, 1);

            float.unwatch({ handler, immediate: true });
            float.notify('c');
            assertSpyCalls(handler, 1);

            float.watch('a', { handler, immediate: true });
            float.notify('a', 'abc');
            float.notify('c');
            assertSpyCalls(handler, 2);
        });

        it('should add the watch method and support signal', async () => {
            assertExists(float.watch);
            const abortCtl = new AbortController();

            float.watch({ handler, signal: abortCtl.signal });
            abortCtl.abort();
            float.notify('c');
            await time.runMicrotasks();
            assertSpyCalls(handler, 0);
        });

        it('should add the unwatch method', async () => {
            assertExists(float.unwatch);

            float.watch(handler);
            float.unwatch(handler);
            float.notify('c');
            await time.runMicrotasks();
            assertSpyCalls(handler, 0);
        });

        it('should add the unwatch method and support type', async () => {
            assertExists(float.unwatch);

            float.watch('a', handler);
            float.unwatch('a', handler);
            float.notify('a', 'abc');
            float.notify('b', 123);
            await time.runMicrotasks();
            assertSpyCalls(handler, 0);
        });

        it('should add the unwatch method and support immediate=true', async () => {
            assertExists(float.unwatch);
            float.watch({ handler, immediate: true });
            float.unwatch({ handler, immediate: true });
            float.notify('c');
            assertSpyCalls(handler, 0);
        });

        it('should add the unwatch method and support signal', async () => {
            assertExists(float.unwatch);
            const abortCtl = new AbortController();
            float.watch({ handler, signal: abortCtl.signal });
            abortCtl.abort();
            float.notify('c');
            await time.runMicrotasks();
            assertSpyCalls(handler, 0);
        });

        it('should not error when calling unwatch on a watchable that has not been watched', () => {
            float = new ExtendedFloat();
            float.unwatch(handler); 
        });

        it('should add the waitFor method', async () => {
            assertExists(float.waitFor);

            float.waitFor('c').then(handler);
            float.notify('c');

            await time.runMicrotasks();
            assertSpyCalls(handler, 1);
        });

        it('should add the waitFor method and support signal', async () => {
            assertExists(float.watch);
            const abortCtl = new AbortController();

            float.waitFor('c', abortCtl.signal).then(handler).catch(rejectHandler);
            abortCtl.abort();
            float.notify('c');
            await time.runMicrotasks();
            assertSpyCalls(handler, 0);
        });
    });

    describe('isWatchable', () => {
        /** @type {Float32Array} */
        let nonWatchable;

        beforeEach(() => {
            watchable    = new Watchable();
            nonWatchable = new Float32Array();
        });

        it('should return true for watchable instance', () => {
            assert(Watchable.isWatchable(watchable));
        });

        it('should return false non watchable', () => {
            assert(!Watchable.isWatchable(nonWatchable));
        });
    });
});
