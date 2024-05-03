import { describe, it, beforeEach, afterEach       } from 'https://deno.land/std@0.208.0/testing/bdd.ts';
import { spy, stub, assertSpyCall, assertSpyCalls  } from 'https://deno.land/std@0.208.0/testing/mock.ts';
import { FakeTime                                  } from 'https://deno.land/std@0.208.0/testing/time.ts';

import { assert           } from 'https://deno.land/std@0.208.0/assert/assert.ts';
import { assertEquals     } from 'https://deno.land/std@0.208.0/assert/assert_equals.ts';
import { assertExists     } from 'https://deno.land/std@0.208.0/assert/assert_exists.ts';
import { assertInstanceOf } from 'https://deno.land/std@0.208.0/assert/assert_instance_of.ts';

import { Watchable } from '../lib/watchable.js';

/**
 * @import { Spy, Stub } from 'https://deno.land/std@0.208.0/testing/mock.ts'
 */

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

    describe('WildcardImmediateHandler', () => {
        beforeEach(() => {
            handler   = spy();
            watchable = new ExtendedWatchable();
            watchable.watch(handler);
        });

        it('should call the handler immediately when notify has been called.', () => {
            watchable.notify('c');
            assertSpyCalls(handler, 1);
        });

        it('should not call the handler if unwatch has been called.', () => {
            watchable.unwatch(handler);
            watchable.notify('c');
            assertSpyCalls(handler, 0);
        });

        it('should call the handler with the type and data', () => {
            watchable.notify('a', 'abc');
            watchable.notify('b', 123);

            assertSpyCall(handler, 0, { args: ['a', 'abc']});
            assertSpyCall(handler, 1, { args: ['b', 123]});
        });
    });

    describe('WildcardImmediateOptions', () => {
        describe('handler', () => {
            beforeEach(() => {
                handler   = spy();
                watchable = new ExtendedWatchable();
                watchable.watch({ handler });
            });

            it('should call the handler immediately when notify has been called.', () => {
                watchable.notify('c');
                assertSpyCalls(handler, 1);
            });

            it('should not call the handler if unwatch has been called.', () => {
                watchable.unwatch({ handler });
                watchable.notify('c');
                assertSpyCalls(handler, 0);
            });

            it('should call the handler with the type and data', () => {
                watchable.notify('a', 'abc');
                watchable.notify('b', 123);

                assertSpyCall(handler, 0, { args: ['a', 'abc']});
                assertSpyCall(handler, 1, { args: ['b', 123]});
            });
        });

        describe('signal', () => {
            /** @type {AbortController} */
            let abortCtl;

            beforeEach(() => {
                handler   = spy();
                watchable = new ExtendedWatchable();
                abortCtl  = new AbortController();
                watchable.watch({ handler, signal: abortCtl.signal });
                watchable.watch({ handler, signal: abortCtl.signal, deferred: true });
            });

            it('should not call handler if aborted', () => {
                abortCtl.abort();
                watchable.notify('c');
                assertSpyCalls(handler, 0);
            });
        });

        describe('once=true', () => {
            beforeEach(() => {
                handler   = spy();
                watchable = new ExtendedWatchable();
                watchable.watch({ handler, once: true });
            });

            it('should not call handler more than once', () => {
                watchable.notify('c');
                assertSpyCalls(handler, 1);
                watchable.notify('c');
                assertSpyCalls(handler, 1);
            });

            it('should not call handler if unwatch has been called', () => {
                watchable.unwatch({ handler  });
                watchable.notify('a', 'abc');
                assertSpyCalls(handler, 0);
            });
        });
    });

    describe('WildCardDeferredOptions', () => {
        beforeEach(() => {
            handler   = spy();
            watchable = new ExtendedWatchable();
            watchable.watch({ handler, deferred: true });
        });

        it('should call the handler in the next microtask execution when notify has been called.', async () => {
            watchable.notify('a', 'abc');
            await time.runMicrotasks();
            assertSpyCalls(handler, 1);
        });

        it('should not call the handler more than once in the same microtask execution.', async () => {
            watchable.notify('b', 123);
            watchable.notify('c');
            await time.runMicrotasks();
            assertSpyCalls(handler, 1);
        });

        it('should call the handler with a map of the notification types and arguments', async () => {
            watchable.notify('a', 'abc');
            watchable.notify('b', 123);
            await time.runMicrotasks();
            assertEquals(handler.calls[0].args[0].get('a'), 'abc');
            assertEquals(handler.calls[0].args[0].get('b'), 123);
        });

        describe('signal', () => {
            /** @type {AbortController} */
            let abortCtl;

            beforeEach(() => {
                handler   = spy();
                watchable = new ExtendedWatchable();
                abortCtl  = new AbortController();
                watchable.watch({ handler, deferred: true, signal: abortCtl.signal });
            });

            it('should not error when abort has been called after the unwatch method', async () => {
                watchable.unwatch({ handler, deferred: true });
                abortCtl.abort();
                await time.runMicrotasks();
                assertSpyCalls(handler, 0);
            })
        });

        describe('once=true', () => {
            beforeEach(() => {
                handler   = spy();
                watchable = new ExtendedWatchable();
                watchable.watch({ handler, deferred: true, once: true });
            });

            it('should not call handler more than once', async () => {
                watchable.notify('c');
                await time.runMicrotasks();
                assertSpyCalls(handler, 1);
                watchable.notify('c');
                await time.runMicrotasks();
                assertSpyCalls(handler, 1);
            });

            it('should not call handler if unwatch has been called', async () => {
                watchable.unwatch({ handler, deferred: true  });
                watchable.notify('a', 'abc');
                await time.runMicrotasks();
                assertSpyCalls(handler, 0);
            });
        });
    })

    describe('type, Handler', () => {
        beforeEach(() => {
            handler   = spy();
            watchable = new ExtendedWatchable();
            watchable.watch('a', handler);
        });

        it('should call the handler if type matches.', () => {
            watchable.notify('a', 'abc');
            assertSpyCalls(handler, 1);
        });

        it('should not call the handler if unwatch has been called', () => {
            watchable.unwatch('a', handler);
            watchable.notify('a', 'abc');
            assertSpyCalls(handler, 0);
        });

        it('should not call the handler if type does not match.', () => {
            watchable.notify('b', 123);
            assertSpyCalls(handler, 0);
        });

        it('should call the handler with the data', () => {
            watchable.notify('a', 'abc');
            watchable.notify('a', 'def');
            assertSpyCall(handler, 0, { args: ['abc']});
            assertSpyCall(handler, 1, { args: ['def']});
        });
    });

    describe('type, Options', () => {
        describe('handler', () => {
            beforeEach(() => {
                handler   = spy();
                watchable = new ExtendedWatchable();
                watchable.watch('a', { handler });
            });

            it('should call the handler if type matches.', () => {
                watchable.notify('a', 'abc');
                assertSpyCalls(handler, 1);
            });

            it('should not call the handler if unwatch has been called', () => {
                watchable.unwatch('a', { handler });
                watchable.notify('a', 'abc');
                assertSpyCalls(handler, 0);
            });

            it('should not call the handler if type does not match.', () => {
                watchable.notify('b', 123);
                assertSpyCalls(handler, 0);
            });

            it('should call the handler with the data', () => {
                watchable.notify('a', 'abc');
                watchable.notify('a', 'def');
                assertSpyCall(handler, 0, { args: ['abc']});
                assertSpyCall(handler, 1, { args: ['def']});
            });
        });

        describe('signal', () => {
            /** @type {AbortController} */
            let abortCtl;

            beforeEach(() => {
                handler   = spy();
                watchable = new ExtendedWatchable();
                abortCtl  = new AbortController();
                watchable.watch('a', { handler, signal: abortCtl.signal });
            });

            it('should not call handler if aborted', () => {
                abortCtl.abort();
                watchable.notify('a', 'abc');
                assertSpyCalls(handler, 0);
            });
        });

        describe('deferred=true', () => {
            beforeEach(() => {
                handler   = spy();
                watchable = new ExtendedWatchable();
                watchable.watch('a', { handler, deferred: true });
            });

            it('should call the handler in the next microtask execution when notify has been called.', async () => {
                watchable.notify('a', 'abc');
                await time.runMicrotasks();
                assertSpyCalls(handler, 1);
            });

            it('should not call the handler more than once in the same microtask execution.', async () => {
                watchable.notify('a', 'abc');
                watchable.notify('a', 'def');
                await time.runMicrotasks();
                assertSpyCalls(handler, 1);
            });

            it('should not call the handler in the next microtask execution if unwatch has been called.', async () => {
                watchable.unwatch('a', { handler, deferred: true });
                watchable.notify('a', 'abc');
                await time.runMicrotasks();
                assertSpyCalls(handler, 0);
            });

            it('should call the handler with the first notify data', async () => {
                watchable.notify('a', 'abc');
                watchable.notify('a', 'def');
                await time.runMicrotasks();
                assertSpyCall(handler, 0, { args: ['abc'] });
            });
        });

        describe('signal, deferred=true', () => {
            /** @type {AbortController} */
            let abortCtl;

            beforeEach(() => {
                handler   = spy();
                watchable = new ExtendedWatchable();
                abortCtl  = new AbortController();
                watchable.watch('a', { handler, deferred: true, signal: abortCtl.signal });
            });

            it('should not error when abort has been called after the unwatch method', async () => {
                watchable.unwatch('a', { handler, deferred: true });
                abortCtl.abort();
                await time.runMicrotasks();
                assertSpyCalls(handler, 0);
            });
        });

        describe('once=true', () => {
            beforeEach(() => {
                handler   = spy();
                watchable = new ExtendedWatchable();
                watchable.watch('a', { handler, once: true });
            });

            it('should not call handler more than once', () => {
                watchable.notify('a', 'abc');
                assertSpyCalls(handler, 1);
                watchable.notify('a', 'abc');
                assertSpyCalls(handler, 1);
            });

            it('should not call handler if unwatch has been called', () => {
                watchable.unwatch('a', { handler });
                watchable.notify('a', 'abc');
                assertSpyCalls(handler, 0);
            });
        });

        describe('once=true, deferred=true', () => {
            beforeEach(() => {
                handler   = spy();
                watchable = new ExtendedWatchable();
                watchable.watch('a', { handler, deferred: true, once: true });
            });

            it('should not call handler more than once', async () => {
                watchable.notify('a', 'abc');
                await time.runMicrotasks();
                assertSpyCalls(handler, 1);
                watchable.notify('a', 'abc');
                await time.runMicrotasks();
                assertSpyCalls(handler, 1);
            });

            it('should not call handler if unwatch has been called', async () => {
                watchable.unwatch('a', { handler, deferred: true });
                watchable.notify('a', 'abc');
                await time.runMicrotasks();
                assertSpyCalls(handler, 0);
            });
        });
    });

    describe('unwatch', () => {
        it('should not error if no watchers have been added yet', () => {
            watchable = new ExtendedWatchable();
            watchable.unwatch(() => {});
        })
    });

    describe('mixin', () => {
        /** @typedef {{ a: string, b: number, c: void, d: void }} EventMap */

        class ExtendedFloat extends Watchable.mixin(Float32Array, /** @type {EventMap} */ ({})) { }

        /** @type {ExtendedFloat} */
        let float;

        /** @type {Stub} */
        let notifyStub;

        /** @type {Stub} */
        let watchStub;

        /** @type {Stub} */
        let unwatchStub;

        /** @type {Stub} */
        let waitForStub;

        /** @type {Stub} */
        let isWatchedStub;

        /** @type {Stub} */
        let isQueuedStub;

        beforeEach(() => {
            notifyStub    = stub(Watchable.prototype, 'notify');
            watchStub     = stub(Watchable.prototype, 'watch');
            unwatchStub   = stub(Watchable.prototype, 'unwatch');
            waitForStub   = stub(Watchable.prototype, 'waitFor');
            isWatchedStub = stub(Watchable.prototype, 'isWatched');
            isQueuedStub  = stub(Watchable.prototype, 'isQueued');

            float = new ExtendedFloat(4);
        });

        afterEach(() => {
            notifyStub.restore();
            watchStub.restore();
            unwatchStub.restore();
            waitForStub.restore();
            isWatchedStub.restore();
            isQueuedStub.restore();
        })

        it('should maintain specified super class', () => {
            assertInstanceOf(float, Float32Array);
            assertExists(ExtendedFloat.BYTES_PER_ELEMENT);
        });

        it('should add the notify method', () => {
            float.notify('a', 'abc');
            assertSpyCalls(notifyStub, 1);
        });

        it('should add the watch method', async () => {
            float.watch('a', () => {});
            assertSpyCalls(watchStub, 1);
        });

        it('should add the unwatch method', async () => {
            float.unwatch('a', () => {});
            assertSpyCalls(unwatchStub, 1);
        });

        it('should add the waitFor method', async () => {
            float.waitFor('a');
            assertSpyCalls(waitForStub, 1);
        });

        it('should add the isWatched method', async () => {
            float.isWatched('a');
            assertSpyCalls(isWatchedStub, 1);
        });

        it('should add the isQueued method', async () => {
            float.isQueued('a');
            assertSpyCalls(isQueuedStub, 1);
        });
    });

    describe('isWatchable', () => {
        /** @type {Float32Array} */
        let nonWatchable;

        class ExtendedFloat extends Watchable.mixin(Float32Array) { }

        /** @type {ExtendedFloat} */
        let float;

        beforeEach(() => {
            watchable    = new Watchable();
            float        = new ExtendedFloat();
            nonWatchable = new Float32Array();
        });

        it('should return true for watchable instance', () => {
            assert(Watchable.isWatchable(watchable));
        });

        it('should return true for extended watchable instance', () => {
            assert(Watchable.isWatchable(float));
        });

        it('should return false non watchable', () => {
            assert(!Watchable.isWatchable(nonWatchable));
        });
    });

    describe('[Symbol.hasInstance]', () => {
        /** @type {Float32Array} */
        let nonWatchable;

        class ExtendedFloat extends Watchable.mixin(Float32Array) { }

        /** @type {ExtendedFloat} */
        let float;

        beforeEach(() => {
            watchable    = new Watchable();
            float        = new ExtendedFloat();
            nonWatchable = new Float32Array();
        });

        it('should return true for watchable instance', () => {
            assert(watchable instanceof Watchable);
        });

        it('should return true for extended watchable instance', () => {
            assert(float instanceof Watchable);
        });

        it('should return false non watchable', () => {
            assert(!(nonWatchable instanceof Watchable));
        });
    });

    describe('waitFor', () => {
        beforeEach(() => {
            handler   = spy();
            watchable = new ExtendedWatchable();
            watchable.waitFor('a').then(handler);
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

    describe('isWatched', () => {
        beforeEach(() => {
            handler   = spy();
            watchable = new ExtendedWatchable();
            watchable.watch('a', { handler });
        });

        it('should return true if the watchable has a watcher', async () => {
            assertEquals(watchable.isWatched('a'), true);
        });

        it('should return false if the watchable does not have a watcher of that type', async () => {
            assertEquals(watchable.isWatched('b'), false);
        });

        it('should return true if the watchable has a wildcard watcher', async () => {
            watchable.watch({ handler });
            assertEquals(watchable.isWatched('b'), true);
        });

        it('should return false if the watchable does not have any watchers at all', async () => {
            assertEquals( new ExtendedWatchable().isWatched('b'), false);
        });
    });

    describe('isQueued', () => {
        beforeEach(() => {
            handler   = spy();
            watchable = new ExtendedWatchable();
            watchable.watch('a', { handler, deferred: true });
        });

        it('should return true if the a notification is queued', async () => {
            watchable.notify('a', 'a');
            assertEquals(watchable.isQueued('a'), true);
            assertEquals(watchable.isQueued('b'), false);
        });

        it('should return false if the a notification is no longer queued', async () => {
            watchable.notify('a', 'a');
            await time.runMicrotasks();
            assertEquals(watchable.isQueued('a'), false);
            assertEquals(watchable.isQueued('b'), false);
        });
    });
});
