import { describe, it, beforeEach } from 'https://deno.land/std@0.143.0/testing/bdd.ts';
import { assertEquals, assertFalse, assertExists  } from 'https://deno.land/std@0.143.0/testing/asserts.ts';
import { spy, stub, assertSpyCall, assertSpyCalls } from 'https://deno.land/std@0.143.0/testing/mock.ts';

import { GameEvent       } from '../../../lib/events/game-event.js';
import { GameEventTarget } from '../../../lib/events/game-event-target.js';

describe('GameEventTarget', () => {
    let handler, target1, target2, target3;

    beforeEach(() => {
        handler = spy();
        target1 = new GameEventTarget('target1');
        target2 = new GameEventTarget('target2');
        target3 = new GameEventTarget('target3');
    });

    describe('addEventListener', () => {
        it('should invoke callback of listener', () => {
            target1.addEventListener('test', handler);
            target1.dispatchEvent(new GameEvent('test'));
            assertSpyCalls(handler, 1);
        });

        describe('capture', () => {
            let event;

            beforeEach(() => {
                event = new GameEvent('test');

                target1.addEventListener('test', e => handler(e.eventPhase, e.currentTarget), true);
                target2.addEventListener('test', e => handler(e.eventPhase, e.currentTarget), true);
                target3.addEventListener('test', e => handler(e.eventPhase, e.currentTarget), true);

                event.path.push(target2, target3);

                target1.dispatchEvent(event);
            });

            it('should invoke callback during the CAPTURING_PHASE', () => {
                assertSpyCall(handler, 0, { args: [GameEvent.CAPTURING_PHASE, target3] });
                assertSpyCall(handler, 1, { args: [GameEvent.CAPTURING_PHASE, target2] });
            });

            it('should invoke callback when AT_TARGET', () => {
                assertSpyCall(handler, 2, { args: [GameEvent.AT_TARGET, target1] });
            });

            it('should not invoke callback during the BUBBLING_PHASE', () => {
                assertFalse(handler.calls.some(call => call.args[0] === GameEvent.BUBBLING_PHASE));
            });
        });


        describe('no capture', () => {
            let event;

            beforeEach(() => {
                event = new GameEvent('test');

                target1.addEventListener('test', e => handler(e.eventPhase, e.currentTarget));
                target2.addEventListener('test', e => handler(e.eventPhase, e.currentTarget));
                target3.addEventListener('test', e => handler(e.eventPhase, e.currentTarget));

                event.path.push(target2, target3);

                target1.dispatchEvent(event);
            });

            it('should invoke callback when AT_TARGET', () => {
                assertSpyCall(handler, 0, { args: [GameEvent.AT_TARGET, target1] });
            });

            it('should invoke callback during the BUBBLING_PHASE', () => {
                assertSpyCall(handler, 1, { args: [GameEvent.BUBBLING_PHASE, target2] });
                assertSpyCall(handler, 2, { args: [GameEvent.BUBBLING_PHASE, target3] });
            });

            it('should not invoke callback during the CAPTURING_PHASE', () => {
                assertFalse(handler.calls.some(call => call.args[0] === GameEvent.CAPTURING_PHASE));
            });
        });

        describe('once', () => {
            describe('boolean', () => {
                let event;

                beforeEach(() => {
                    event = new GameEvent('test');
                    target1.addEventListener('test', handler, { once: true });
                    target1.dispatchEvent(event);
                    target1.dispatchEvent(event);
                });

                it('should only call the callback once', () => {
                    assertSpyCalls(handler, 1);
                });
            });

            describe('promise', () => {
                let event, promise;

                beforeEach(() => {
                    event = new GameEvent('test');
                    promise = new Promise(resolve => setTimeout(resolve, 0));
                    target1.addEventListener('test', handler, { once: promise });
                });

                it('should call the callback if the promise has not resolved', () => {
                    target1.dispatchEvent(event);
                    assertSpyCalls(handler, 1);
                });

                it('should not call the callback if the promise has resolved', async () => {
                    await promise;
                    target1.dispatchEvent(event);
                    assertSpyCalls(handler, 0);
                });
            });
        });
    });


    describe('removeEventListener', () => {
        it('should not invoke callback of listener', () => {
            target1.addEventListener('test', handler);
            target1.removeEventListener('test', handler);
            target1.dispatchEvent(new GameEvent('test'));

            assertSpyCalls(handler, 0);
        });

        it('should not remove listener of options.capture does not match', () => {
            target1.addEventListener('test', handler);
            target1.removeEventListener('test', handler, true);
            target1.dispatchEvent(new GameEvent('test'));

            assertSpyCalls(handler, 1);
        });
    });

    describe('removeAllEventListeners', () => {
        it('should not invoke any listeners', () => {
            target1.addEventListener('test', handler);
            target1.addEventListener('test', handler, true);
            target1.removeAllEventListeners();
            target1.dispatchEvent(new GameEvent('test'));

            assertSpyCalls(handler, 0);
        });
    });

    describe('dispatchEvent', () => {
        it('should call console.warn when error is thrown in listener', () => {
            const warn = stub(console, 'warn');
            target1.addEventListener('test', () => { throw new Error('test'); });
            target1.dispatchEvent(new GameEvent('test'));
            assertSpyCalls(warn, 1);
            warn.restore();
        });

        describe('propagation', () => {
            let event;
            beforeEach(() => {
                event = new GameEvent('test');
                event.path.push(target2, target3);
            });

            it('should bubble up the event path', () => {
                target1.addEventListener('test', e => handler(e.currentTarget));
                target2.addEventListener('test', e => handler(e.currentTarget));
                target3.addEventListener('test', e => handler(e.currentTarget));

                target1.dispatchEvent(event);

                assertSpyCalls(handler, 3);
                assertEquals(handler.calls[0].args[0], target1);
                assertEquals(handler.calls[1].args[0], target2);
                assertEquals(handler.calls[2].args[0], target3);
            });

            it('should capture down the event path', () => {
                target1.addEventListener('test', e => handler(e.currentTarget), true);
                target2.addEventListener('test', e => handler(e.currentTarget), true);
                target3.addEventListener('test', e => handler(e.currentTarget), true);

                target1.dispatchEvent(event);
                
                assertSpyCalls(handler, 3);
                assertEquals(handler.calls[0].args[0], target3);
                assertEquals(handler.calls[1].args[0], target2);
                assertEquals(handler.calls[2].args[0], target1);
            });
        });
    });

    describe('deferEvent', () => {
        it('should queue deferred event without dispatching', () => {
            target1.addEventListener('test', handler);
            target1.deferEvent(new GameEvent('test'));
            target1.deferEvent(new GameEvent('test'));
            assertSpyCalls(handler, 0);
        });
    });

    describe('dispatchDeferredEvents', () => {
        it('should dispatch deferred events', () => {
            target1.addEventListener('test', handler);
            target1.deferEvent(new GameEvent('test'));
            target1.deferEvent(new GameEvent('test'));
            target1.dispatchDeferredEvents();
            assertSpyCalls(handler, 2);
        });
    });


    describe('clearDeferredEvents', () => {
        it('should clear deferred events', () => {
            target1.addEventListener('test', handler);
            target1.deferEvent(new GameEvent('test'));
            target1.deferEvent(new GameEvent('test'));
            target1.clearDeferredEvents();
            target1.dispatchDeferredEvents();
            assertSpyCalls(handler, 0);
        });
    });

    describe('awaitEvent', () => {
        it('should resolve once an event of specified type is emitted', async () => {
            setTimeout(() => target1.dispatchEvent(new GameEvent('test')));
            const event = await target1.awaitEvent('test');
            assertExists(event);
        });
    });
});
