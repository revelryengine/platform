import { describe, it, beforeEach, afterEach    } from 'std/testing/bdd.ts';
import { spy, assertSpyCall, assertSpyCalls     } from 'std/testing/mock.ts';
import { assertInstanceOf, assertExists, assert } from 'std/testing/asserts.ts';
import { FakeTime                               } from 'std/testing/time.ts';

import { Watchable } from '../../lib/utils/watchable.js';

/** @typedef {import('std/testing/mock.ts').Spy} Spy */

describe('Watchable', () => {
    /** @type {FakeTime}*/
    let time;
    /** @type {Spy} */
    let handler;
    /** @type {Spy} */
    let rejectHandler;
    /** @type {Watchable} */
    let watchable;
    /** @type {AbortController} */
    let abortCtl;

    beforeEach(() => {
        time = new FakeTime();
        handler       = spy();
        rejectHandler = spy();
        watchable = new Watchable();
        watchable.watch(handler);
    });

    afterEach(() => {
        time.restore();
    });

    it('should call the handler in the next microtask execution when notify has been called.', async () => {
        watchable.notify('test');
        await time.runMicrotasks();
        assertSpyCalls(handler, 1);
    });


    it('should not call the handler more than once in the same microtask execution.', async () => {
        watchable.notify('test');
        watchable.notify('test');
        await time.runMicrotasks();
        assertSpyCalls(handler, 1);
    });

    it('should call the handler more than once if another microtask execution has occured.', async () => {
        watchable.notify('test');
        await time.runMicrotasks();
        watchable.notify('test');
        await time.runMicrotasks();
        assertSpyCalls(handler, 2);
    });

    it('should not call the handler if unwatch has been called.', async () => {
        watchable.unwatch(handler);
        watchable.notify('test');
        await time.runMicrotasks();
        assertSpyCalls(handler, 0);
    });

    it('should not call the handler if unwatch has been called even if after notify has been called but before the next microtask execution.', async () => {
        watchable.notify('test');
        watchable.unwatch(handler);
        await time.runMicrotasks();
        assertSpyCalls(handler, 0);
    });

    it('should call the handler with a map of the notification types and arguments', async () => {
        watchable.notify('a', 1, 2, 3);
        watchable.notify('b', 4, 5, 6);
        await time.runMicrotasks();
        assertSpyCall(handler, 0, { args: [new Map([['a', [1, 2, 3]], ['b', [4, 5, 6]]])] });
    });

    it('should not error when calling unwatch on a watchable that has not been watched', () => {
        watchable = new Watchable();
        watchable.unwatch(handler); 
    });


    describe('Watcher object', () => {
        beforeEach(() => {
            handler   = spy();
            watchable = new Watchable();
            watchable.watch({ handler });
        });

        it('should accept an object containing a handler method', async () => {
            watchable.notify('test');
            await time.runMicrotasks();
            assertSpyCalls(handler, 1);
        });

        it('should not call the handler if unwatch has been called.', async () => {
            watchable.unwatch({ handler });
            watchable.notify('test');
            assertSpyCalls(handler, 0);
        });


        describe('type', () => {
            beforeEach(() => {
                handler   = spy();
                watchable = new Watchable();
                watchable.watch({ handler, type: 'a' });
            });

            it('should call the handler if type matches.', async () => {
                watchable.notify('a');
                await time.runMicrotasks();
                assertSpyCalls(handler, 1);
            });

            it('should not call the handler if type does not match.', async () => {
                watchable.notify('b');
                await time.runMicrotasks();
                assertSpyCalls(handler, 0);
            });
        });

        describe('immediate=true', () => {
            beforeEach(() => {
                handler   = spy();
                watchable = new Watchable();
                watchable.watch({ handler, immediate: true });
            });

            it('should call the handler immediately when notify has been called.', async () => {
                watchable.notify('test');
                assertSpyCalls(handler, 1);
            });

            it('should not call the handler if unwatch has been called.', async () => {
                watchable.unwatch({ handler, immediate: true });
                watchable.notify('test');
                assertSpyCalls(handler, 0);
            });
        });

        describe('signal', () => {
            /** @type {AbortController} */
            let abortCtl;

            beforeEach(() => {
                handler   = spy();
                watchable = new Watchable();
                abortCtl  = new AbortController();
                watchable.watch({ handler, signal: abortCtl.signal });
            });

            it('should not call handler if aborted', async () => {
                abortCtl.abort();
                watchable.notify('test');
                await time.runMicrotasks();
                assertSpyCalls(handler, 0);
            });
        });
    });

    describe('waitFor', () => {
        beforeEach(() => {
            handler   = spy();
            watchable = new Watchable();
            abortCtl  = new AbortController();
            watchable.waitFor('test', abortCtl.signal).then(handler);
        });
    
        it('should call the handler in the next microtask execution when notify has been called.', async () => {
            watchable.notify('test', 1, 2, 3);
            await time.runMicrotasks();
            assertSpyCall(handler, 0, { args: [[1, 2, 3]]});
        });

        it('should not call the handler more than once.', async () => {
            watchable.notify('test', 1, 2, 3);
            await time.runMicrotasks();
            watchable.notify('test', 4, 5, 6);
            await time.runMicrotasks();
            assertSpyCall(handler, 0, { args: [[1, 2, 3]]});
            assertSpyCalls(handler, 1);
        });

        describe('signal', () => {
            beforeEach(() => {
                handler       = spy();
                rejectHandler = spy();
                watchable = new Watchable();
                abortCtl  = new AbortController();
                watchable.waitFor('test', abortCtl.signal).then(handler).catch(rejectHandler);
            });

            it('should not call handler if aborted', async () => {
                abortCtl.abort();
                watchable.notify('test');
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
        class ExtendedFloat extends Watchable.mixin(Float32Array) {

        }

        /** @type {ExtendedFloat} */ 
        let float;

        beforeEach(() => {
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
            float.notify('test');

            await time.runMicrotasks();
            assertSpyCalls(handler, 1);
        });

        it('should add the watch method and support type', async () => {
            assertExists(float.watch);

            float.watch({ handler, type: 'a' });
            float.notify('a');
            float.notify('b');
            await time.runMicrotasks();
            assertSpyCalls(handler, 1);
        });

        it('should add the watch method and support immediate=true', async () => {
            assertExists(float.watch);

            float.watch({ handler, immediate: true });
            float.notify('test');
            assertSpyCalls(handler, 1);

            float.unwatch({ handler, immediate: true });
            float.notify('test');
            assertSpyCalls(handler, 1);

            float.watch({ type: "a", handler, immediate: true });
            float.notify('a');
            float.notify('b');
            assertSpyCalls(handler, 2);
        });

        it('should add the watch method and support signal', async () => {
            assertExists(float.watch);
            const abortCtl = new AbortController();

            float.watch({ handler, signal: abortCtl.signal });
            abortCtl.abort();
            float.notify('test');
            await time.runMicrotasks();
            assertSpyCalls(handler, 0);
        });

        it('should add the unwatch method', async () => {
            assertExists(float.unwatch);

            float.watch(handler);
            float.unwatch(handler);
            float.notify('test');
            await time.runMicrotasks();
            assertSpyCalls(handler, 0);
        });

        it('should add the unwatch method and support type', async () => {
            assertExists(float.unwatch);
            const options = { handler, type: 'a' };
            float.watch(options);
            float.unwatch(options);
            float.notify('a');
            float.notify('b');
            await time.runMicrotasks();
            assertSpyCalls(handler, 0);
        });

        it('should add the unwatch method and support immediate=true', async () => {
            assertExists(float.unwatch);
            const options = { handler, immediate: true };
            float.watch(options);
            float.unwatch(options);
            float.notify('test');
            assertSpyCalls(handler, 0);
        });

        it('should add the unwatch method and support signal', async () => {
            assertExists(float.unwatch);
            const abortCtl = new AbortController();
            const options = { handler, signal: abortCtl.signal };
            float.watch(options);
            abortCtl.abort();
            float.notify('test');
            await time.runMicrotasks();
            assertSpyCalls(handler, 0);
        });

        it('should not error when calling unwatch on a watchable that has not been watched', () => {
            float = new ExtendedFloat();
            float.unwatch(handler); 
        });

        it('should add the waitFor method', async () => {
            assertExists(float.waitFor);

            float.waitFor('test').then(handler);
            float.notify('test');

            await time.runMicrotasks();
            assertSpyCalls(handler, 1);
        });

        it('should add the waitFor method and support signal', async () => {
            assertExists(float.watch);
            const abortCtl = new AbortController();

            float.waitFor('test', abortCtl.signal).then(handler).catch(rejectHandler);
            abortCtl.abort();
            float.notify('test');
            await time.runMicrotasks();
            assertSpyCalls(handler, 0);
        });
    });

    describe('isWatchable', () => {
        class ExtendedWatchable extends Watchable {

        }

        class MixinWatchable extends Watchable.mixin(Float32Array) {
            
        }

        /** @type {ExtendedWatchable} */
        let extended;
        /** @type {MixinWatchable} */ 
        let mixin;
        /** @type {Float32Array} */
        let nonWatchable;

        beforeEach(() => {
            watchable    = new Watchable();
            extended     = new ExtendedWatchable();
            mixin        = new MixinWatchable();
            nonWatchable = new Float32Array();
        });

        it('should return true for watchable instance', () => {
            assert(Watchable.isWatchable(watchable));
        });

        it('should return true for extended watchable intance', () => {
            assert(Watchable.isWatchable(extended));
        });

        it('should return true for extended mixin watchable intance', () => {
            assert(Watchable.isWatchable(mixin));
        });

        it('should return false non watchable', () => {
            assert(!Watchable.isWatchable(nonWatchable));
        });
    })
});
