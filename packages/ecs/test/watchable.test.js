import { describe, it, expect, sinon, beforeEach, afterEach } from 'bdd';

import { Watchable } from '../lib/watchable.js';

describe('Watchable', () => {

    /** @extends {Watchable<{ a: string, b: number , c: void, d: void }>} */
    class ExtendedWatchable extends Watchable { }

    /** @type {sinon.SinonFakeTimers}*/
    let time;
    /** @type {sinon.SinonSpy} */
    let handler;
    /** @type {sinon.SinonSpy} */
    let rejectHandler;
    /** @type {ExtendedWatchable} */
    let watchable;
    /** @type {AbortController} */
    let abortCtl;


    beforeEach(() => {
        time          = sinon.useFakeTimers();
        time.runMicrotasks();
        handler       = sinon.spy();
        rejectHandler = sinon.spy();
        watchable     = new ExtendedWatchable();
        watchable.watch(handler);
    });

    afterEach(() => {
        time.restore();
    });

    describe('WildcardImmediateHandler', () => {
        beforeEach(() => {
            handler   = sinon.spy();
            watchable = new ExtendedWatchable();
            watchable.watch(handler);
        });

        it('should call the handler immediately when notify has been called.', () => {
            watchable.notify('c');
            expect(handler).to.have.been.calledOnce;
        });

        it('should not call the handler if unwatch has been called.', () => {
            watchable.unwatch(handler);
            watchable.notify('c');
            expect(handler).not.to.have.been.called;
        });

        it('should call the handler with the type and data', () => {
            watchable.notify('a', 'abc');
            watchable.notify('b', 123);

            expect(handler).to.have.been.calledWith('a', 'abc');
            expect(handler).to.have.been.calledWith('b', 123);
        });
    });

    describe('WildcardImmediateOptions', () => {
        describe('handler', () => {
            beforeEach(() => {
                handler   = sinon.spy();
                watchable = new ExtendedWatchable();
                watchable.watch({ handler });
            });

            it('should call the handler immediately when notify has been called.', () => {
                watchable.notify('c');
                expect(handler).to.have.been.calledOnce;
            });

            it('should not call the handler if unwatch has been called.', () => {
                watchable.unwatch({ handler });
                watchable.notify('c');
                expect(handler).not.to.have.been.called;
            });

            it('should call the handler with the type and data', () => {
                watchable.notify('a', 'abc');
                watchable.notify('b', 123);

                expect(handler).to.have.been.calledWith('a', 'abc');
                expect(handler).to.have.been.calledWith('b', 123);
            });
        });

        describe('signal', () => {
            /** @type {AbortController} */
            let abortCtl;

            beforeEach(() => {
                handler   = sinon.spy();
                watchable = new ExtendedWatchable();
                abortCtl  = new AbortController();
                watchable.watch({ handler, signal: abortCtl.signal });
                watchable.watch({ handler, signal: abortCtl.signal, deferred: true });
            });

            it('should not call handler if aborted', () => {
                abortCtl.abort();
                watchable.notify('c');
                expect(handler).not.to.have.been.called;
            });
        });

        describe('once=true', () => {
            beforeEach(() => {
                handler   = sinon.spy();
                watchable = new ExtendedWatchable();
                watchable.watch({ handler, once: true });
            });

            it('should not call handler more than once', () => {
                watchable.notify('c');
                expect(handler).to.have.been.calledOnce;
                watchable.notify('c');
                expect(handler).to.have.been.calledOnce;
            });

            it('should not call handler if unwatch has been called', () => {
                watchable.unwatch({ handler  });
                watchable.notify('a', 'abc');
                expect(handler).not.to.have.been.called;
            });
        });
    });

    describe('WildCardDeferredOptions', () => {
        beforeEach(() => {
            handler   = sinon.spy();
            watchable = new ExtendedWatchable();
            watchable.watch({ handler, deferred: true });
        });

        it('should call the handler in the next microtask execution when notify has been called.', async () => {
            watchable.notify('a', 'abc');
            time.runMicrotasks();
            expect(handler).to.have.been.calledOnce;
        });

        it('should not call the handler more than once in the same microtask execution.', async () => {
            watchable.notify('b', 123);
            watchable.notify('c');
            time.runMicrotasks();
            expect(handler).to.have.been.calledOnce;
        });

        it('should call the handler with a map of the notification types and arguments', async () => {
            watchable.notify('a', 'abc');
            watchable.notify('b', 123);
            time.runMicrotasks();

            const map = handler.getCall(0).args[0];
            expect(map.get('a')).to.equal('abc');
            expect(map.get('b')).to.equal(123);
        });

        describe('signal', () => {
            /** @type {AbortController} */
            let abortCtl;

            beforeEach(() => {
                handler   = sinon.spy();
                watchable = new ExtendedWatchable();
                abortCtl  = new AbortController();
                watchable.watch({ handler, deferred: true, signal: abortCtl.signal });
            });

            it('should not error when abort has been called after the unwatch method', async () => {
                watchable.unwatch({ handler, deferred: true });
                abortCtl.abort();
                time.runMicrotasks();
                expect(handler).not.to.have.been.called;
            })
        });

        describe('once=true', () => {
            beforeEach(() => {
                handler   = sinon.spy();
                watchable = new ExtendedWatchable();
                watchable.watch({ handler, deferred: true, once: true });
            });

            it('should not call handler more than once', async () => {
                watchable.notify('c');
                time.runMicrotasks();
                expect(handler).to.have.been.calledOnce;
                watchable.notify('c');
                time.runMicrotasks();
                expect(handler).to.have.been.calledOnce;
            });

            it('should not call handler if unwatch has been called', async () => {
                watchable.unwatch({ handler, deferred: true  });
                watchable.notify('a', 'abc');
                time.runMicrotasks();
                expect(handler).not.to.have.been.called;
            });
        });
    })

    describe('type, Handler', () => {
        beforeEach(() => {
            handler   = sinon.spy();
            watchable = new ExtendedWatchable();
            watchable.watch('a', handler);
        });

        it('should call the handler if type matches.', () => {
            watchable.notify('a', 'abc');
            expect(handler).to.have.been.calledOnce;
        });

        it('should not call the handler if unwatch has been called', () => {
            watchable.unwatch('a', handler);
            watchable.notify('a', 'abc');
            expect(handler).not.to.have.been.called;
        });

        it('should not call the handler if type does not match.', () => {
            watchable.notify('b', 123);
            expect(handler).not.to.have.been.called;
        });

        it('should call the handler with the data', () => {
            watchable.notify('a', 'abc');
            watchable.notify('a', 'def');
            expect(handler).to.have.been.calledWith('abc');
            expect(handler).to.have.been.calledWith('def');
        });
    });

    describe('type, Options', () => {
        describe('handler', () => {
            beforeEach(() => {
                handler   = sinon.spy();
                watchable = new ExtendedWatchable();
                watchable.watch('a', { handler });
            });

            it('should call the handler if type matches.', () => {
                watchable.notify('a', 'abc');
                expect(handler).to.have.been.calledOnce;
            });

            it('should not call the handler if unwatch has been called', () => {
                watchable.unwatch('a', { handler });
                watchable.notify('a', 'abc');
                expect(handler).not.to.have.been.called;
            });

            it('should not call the handler if type does not match.', () => {
                watchable.notify('b', 123);
                expect(handler).not.to.have.been.called;
            });

            it('should call the handler with the data', () => {
                watchable.notify('a', 'abc');
                watchable.notify('a', 'def');
                expect(handler).to.have.been.calledWith('abc');
                expect(handler).to.have.been.calledWith('def');
            });
        });

        describe('signal', () => {
            /** @type {AbortController} */
            let abortCtl;

            beforeEach(() => {
                handler   = sinon.spy();
                watchable = new ExtendedWatchable();
                abortCtl  = new AbortController();
                watchable.watch('a', { handler, signal: abortCtl.signal });
            });

            it('should not call handler if aborted', () => {
                abortCtl.abort();
                watchable.notify('a', 'abc');
                expect(handler).not.to.have.been.called;
            });
        });

        describe('deferred=true', () => {
            beforeEach(() => {
                handler   = sinon.spy();
                watchable = new ExtendedWatchable();
                watchable.watch('a', { handler, deferred: true });
            });

            it('should call the handler in the next microtask execution when notify has been called.', async () => {
                watchable.notify('a', 'abc');
                time.runMicrotasks();
                expect(handler).to.have.been.calledOnce;
            });

            it('should not call the handler more than once in the same microtask execution.', async () => {
                watchable.notify('a', 'abc');
                watchable.notify('a', 'def');
                time.runMicrotasks();
                expect(handler).to.have.been.calledOnce;
            });

            it('should not call the handler in the next microtask execution if unwatch has been called.', async () => {
                watchable.unwatch('a', { handler, deferred: true });
                watchable.notify('a', 'abc');
                time.runMicrotasks();
                expect(handler).not.to.have.been.called;
            });

            it('should call the handler with the first notify data', async () => {
                watchable.notify('a', 'abc');
                watchable.notify('a', 'def');
                time.runMicrotasks();
                expect(handler).to.have.been.calledWith('abc');
            });
        });

        describe('signal, deferred=true', () => {
            /** @type {AbortController} */
            let abortCtl;

            beforeEach(() => {
                handler   = sinon.spy();
                watchable = new ExtendedWatchable();
                abortCtl  = new AbortController();
                watchable.watch('a', { handler, deferred: true, signal: abortCtl.signal });
            });

            it('should not error when abort has been called after the unwatch method', async () => {
                watchable.unwatch('a', { handler, deferred: true });
                abortCtl.abort();
                time.runMicrotasks();
                expect(handler).not.to.have.been.called;
            });
        });

        describe('once=true', () => {
            beforeEach(() => {
                handler   = sinon.spy();
                watchable = new ExtendedWatchable();
                watchable.watch('a', { handler, once: true });
            });

            it('should not call handler more than once', () => {
                watchable.notify('a', 'abc');
                expect(handler).to.have.been.calledOnce;
                watchable.notify('a', 'abc');
                expect(handler).to.have.been.calledOnce;
            });

            it('should not call handler if unwatch has been called', () => {
                watchable.unwatch('a', { handler });
                watchable.notify('a', 'abc');
                expect(handler).not.to.have.been.called;
            });
        });

        describe('once=true, deferred=true', () => {
            beforeEach(() => {
                handler  = sinon.spy();
                watchable = new ExtendedWatchable();
                watchable.watch('a', { handler, deferred: true, once: true });
            });

            it('should not call handler more than once', async () => {
                watchable.notify('a', 'abc');
                time.runMicrotasks();
                expect(handler).to.have.been.calledOnce;
                watchable.notify('a', 'abc');
                time.runMicrotasks();
                expect(handler).to.have.been.calledOnce;
            });

            it('should not call handler if unwatch has been called', async () => {
                watchable.unwatch('a', { handler, deferred: true });
                watchable.notify('a', 'abc');
                time.runMicrotasks();
                expect(handler).not.to.have.been.called;
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

        /** @type {sinon.SinonStub} */
        let notifyStub;

        /** @type {sinon.SinonStub} */
        let watchStub;

        /** @type {sinon.SinonStub} */
        let unwatchStub;

        /** @type {sinon.SinonStub} */
        let waitForStub;

        /** @type {sinon.SinonStub} */
        let isWatchedStub;

        /** @type {sinon.SinonStub} */
        let isQueuedStub;

        beforeEach(() => {
            notifyStub    = sinon.stub(Watchable.prototype, 'notify');
            watchStub     = sinon.stub(Watchable.prototype, 'watch');
            unwatchStub   = sinon.stub(Watchable.prototype, 'unwatch');
            waitForStub   = sinon.stub(Watchable.prototype, 'waitFor');
            isWatchedStub = sinon.stub(Watchable.prototype, 'isWatched');
            isQueuedStub  = sinon.stub(Watchable.prototype, 'isQueued');

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
            expect(float).to.be.instanceOf(Float32Array);
            expect(ExtendedFloat.BYTES_PER_ELEMENT).to.exist;
        });

        it('should add the notify method', () => {
            float.notify('a', 'abc');
            expect(notifyStub).to.have.been.calledOnce;
        });

        it('should add the watch method', async () => {
            float.watch('a', () => {});
            expect(watchStub).to.have.been.calledOnce;
        });

        it('should add the unwatch method', async () => {
            float.unwatch('a', () => {});
            expect(unwatchStub).to.have.been.calledOnce;
        });

        it('should add the waitFor method', async () => {
            float.waitFor('a');
            expect(waitForStub).to.have.been.calledOnce;
        });

        it('should add the isWatched method', async () => {
            float.isWatched('a');
            expect(isWatchedStub).to.have.been.calledOnce;
        });

        it('should add the isQueued method', async () => {
            float.isQueued('a');
            expect(isQueuedStub).to.have.been.calledOnce;
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
            expect(Watchable.isWatchable(watchable)).to.be.true;
        });

        it('should return true for extended watchable instance', () => {
            expect(Watchable.isWatchable(float)).to.be.true;
        });

        it('should return false non watchable', () => {
            expect(Watchable.isWatchable(nonWatchable)).to.be.false;
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
            expect(watchable).to.be.instanceOf(Watchable);
        });

        it('should return true for extended watchable instance', () => {
            expect(float).to.be.instanceOf(Watchable);
        });

        it('should return false non watchable', () => {
            expect(nonWatchable).to.not.be.instanceOf(Watchable);
        });
    });

    describe('waitFor', () => {
        beforeEach(() => {
            handler   = sinon.spy();
            watchable = new ExtendedWatchable();
            watchable.waitFor('a').then(handler);
        });

        it('should call the handler in the next microtask execution when notify has been called.', async () => {
            watchable.notify('a', 'abc');
            await time.tickAsync(0);
            expect(handler).to.have.been.calledWith('abc');
        });

        it('should not call the handler more than once.', async () => {
            watchable.notify('a', 'abc');
            await time.tickAsync(0);
            watchable.notify('a', 'abc');
            await time.tickAsync(0);
            expect(handler).to.have.been.calledOnceWith('abc');
        });

        describe('signal', () => {
            beforeEach(() => {
                handler       = sinon.spy();
                rejectHandler = sinon.spy();
                watchable = new ExtendedWatchable();
                abortCtl  = new AbortController();
                watchable.waitFor('c', abortCtl.signal).then(handler).catch(rejectHandler);
            });

            it('should not call handler if aborted', async () => {
                abortCtl.abort();
                watchable.notify('c');
                await time.tickAsync(0);
                expect(handler).to.not.have.been.called;
            });

            it('should not reject with aborted', async () => {
                abortCtl.abort();
                await time.tickAsync(0);
                expect(rejectHandler).to.have.been.calledWith('aborted');
            });
        });
    });

    describe('isWatched', () => {
        beforeEach(() => {
            handler   = sinon.spy();
            watchable = new ExtendedWatchable();
            watchable.watch('a', { handler });
        });

        it('should return true if the watchable has a watcher', async () => {
            expect(watchable.isWatched('a')).to.be.true;
        });

        it('should return false if the watchable does not have a watcher of that type', async () => {
            expect(watchable.isWatched('b')).to.be.false;
        });

        it('should return true if the watchable has a wildcard watcher', async () => {
            watchable.watch({ handler });
            expect(watchable.isWatched('b')).to.be.true;
        });

        it('should return false if the watchable does not have any watchers at all', async () => {
            expect(new ExtendedWatchable().isWatched('b')).to.be.false;
        });
    });

    describe('isQueued', () => {
        beforeEach(() => {
            handler   = sinon.spy();
            watchable = new ExtendedWatchable();
            watchable.watch('a', { handler, deferred: true });
        });

        it('should return true if the a notification is queued', async () => {
            watchable.notify('a', 'a');
            expect(watchable.isQueued('a')).to.be.true;
            expect(watchable.isQueued('b')).to.be.false;
        });

        it('should return false if the a notification is no longer queued', async () => {
            watchable.notify('a', 'a');
            await time.tickAsync(0);
            expect(watchable.isQueued('a')).to.be.false;
            expect(watchable.isQueued('b')).to.be.false;
        });
    });
});
