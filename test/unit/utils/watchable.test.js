/** @typedef {import('std/testing/mock.ts').Spy} Spy */

import { describe, it, beforeEach               } from 'std/testing/bdd.ts';
import { spy, assertSpyCall, assertSpyCalls     } from 'std/testing/mock.ts';
import { assertInstanceOf, assertExists, assert } from 'std/testing/asserts.ts';

import { Watchable } from '../../../lib/utils/watchable.js';

describe('Watchable', () => {
    let /** @type {Spy} */handler, /** @type {Watchable} */watchable;

    beforeEach(() => {
        handler   = spy();
        watchable = new Watchable();
        watchable.watch(handler);
    });

    it('should call the handler in the next microtask execution when notify has been called.', async () => {
        watchable.notify('test');
        await null;
        assertSpyCalls(handler, 1);
    });



    it('should not call the handler more than once in the same microtask execution.', async () => {
        watchable.notify('test');
        watchable.notify('test');
        await null;
        assertSpyCalls(handler, 1);
    });

    it('should call the handler more than once if another microtask execution has occured.', async () => {
        watchable.notify('test');
        await null;
        watchable.notify('test');
        await null;
        assertSpyCalls(handler, 2);
    });

    it('should not call the handler if unwatch has been called.', async () => {
        watchable.unwatch(handler);
        watchable.notify('test');
        await null;
        assertSpyCalls(handler, 0);
    });

    it('should not call the handler if unwatch has been called even if after notify has been called but before the next microtask execution.', async () => {
        watchable.notify('test');
        watchable.unwatch(handler);
        await null;
        assertSpyCalls(handler, 0);
    });

    it('should call the handler with a map of the notification types and arguments', async () => {
        watchable.notify('a', 1, 2, 3);
        watchable.notify('b', 4, 5, 6);
        await null;
        assertSpyCall(handler, 0, { args: [new Map([['a', [1, 2, 3]], ['b', [4, 5, 6]]])] });
    });

    it('should not error when calling unwatch on a watchable that has not been watched', () => {
        watchable = new Watchable();
        watchable.unwatch(handler); 
    });


    describe('Watcher object', () => {
        let /** @type  {import('../../../lib/utils/watchable.js').WatchOptions} */options;
        beforeEach(() => {
            handler   = spy();
            watchable = new Watchable();
            options   = { handler };
            watchable.watch(options);
        });

        it('should accept an object containing a handler method', async () => {
            watchable.notify('test');
            await null;
            assertSpyCalls(handler, 1);
        });

        it('should not call the handler if unwatch has been called.', async () => {
            watchable.unwatch(options);
            watchable.notify('test');
            assertSpyCalls(handler, 0);
        });


        describe('type', () => {
            beforeEach(() => {
                handler   = spy();
                watchable = new Watchable();
                options   = { handler, type: 'a' };
                watchable.watch(options);
            });

            it('should call the handler if type matches.', async () => {
                watchable.notify('a');
                await null;
                assertSpyCalls(handler, 1);
            });

            it('should not call the handler if type does not match.', async () => {
                watchable.notify('b');
                await null;
                assertSpyCalls(handler, 0);
            });
        });

        describe('immediate=true', () => {
            beforeEach(() => {
                handler   = spy();
                watchable = new Watchable();
                options   = { handler, immediate: true };
                watchable.watch(options);
            });

            it('should call the handler immediately when notify has been called.', async () => {
                watchable.notify('test');
                assertSpyCalls(handler, 1);
            });

            it('should not call the handler if unwatch has been called.', async () => {
                watchable.unwatch(options);
                watchable.notify('test');
                assertSpyCalls(handler, 0);
            });
        });

        describe('signal', () => {
            let /** @type {AbortController} */abortCtl;

            beforeEach(() => {
                handler   = spy();
                watchable = new Watchable();
                abortCtl  = new AbortController();
                options   = { handler, signal: abortCtl.signal };
                watchable.watch(options);
            });

            it('should not call handler if aborted', async () => {
                abortCtl.abort();
                watchable.notify('test');
                await null;
                assertSpyCalls(handler, 0);
            });
        });
    });

    describe('mixin', () => {
        class ExtendedFloat extends Watchable.mixin(Float32Array) {

        }

        let /** @type {ExtendedFloat} */ float;
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

            await null;
            assertSpyCalls(handler, 1);
        });

        it('should add the watch method and support type', async () => {
            assertExists(float.watch);

            float.watch({ handler, type: 'a' });
            float.notify('a');
            float.notify('b');
            await null;
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
            await null;
            assertSpyCalls(handler, 0);
        });

        it('should add the unwatch method', async () => {
            assertExists(float.unwatch);

            float.watch(handler);
            float.unwatch(handler);
            float.notify('test');
            await null;
            assertSpyCalls(handler, 0);
        });

        it('should add the unwatch method and support type', async () => {
            assertExists(float.unwatch);
            const options = { handler, type: 'a' };
            float.watch(options);
            float.unwatch(options);
            float.notify('a');
            float.notify('b');
            await null;
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
            await null;
            assertSpyCalls(handler, 0);
        });

        it('should not error when calling unwatch on a watchable that has not been watched', () => {
            float = new ExtendedFloat();
            float.unwatch(handler); 
        });
    });

    describe('isWatchable', () => {
        class ExtendedWatchable extends Watchable {

        }

        class MixinWatchable extends Watchable.mixin(Float32Array) {
            
        }

        let /** @type {ExtendedWatchable} */extended,/** @type {MixinWatchable} */ mixin, /** @type {Float32Array} */nonWatchable;
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
