import { GameEvent       } from '../../../lib/events/game-event.js';
import { GameEventTarget } from '../../../lib/events/game-event-target.js';

/** @test {GameEventTarget} */
describe('GameEventTarget', () => {
  let spy, target1, target2, target3;

  beforeEach(() => {
    spy = sinon.spy();
    target1 = new GameEventTarget('target1');
    target2 = new GameEventTarget('target2');
    target3 = new GameEventTarget('target3');
  });

  /** @test {GameEventTarget#addEventListener} */
  describe('addEventListener', () => {
    it('should invoke callback of listener', () => {
      target1.addEventListener('test', spy);
      target1.dispatchEvent(new GameEvent('test'));
      expect(spy).to.have.been.called;
    });

    describe('capture', () => {
      let event;

      beforeEach(() => {
        event = new GameEvent('test');

        target1.addEventListener('test', e => spy(e.eventPhase), true);
        target2.addEventListener('test', e => spy(e.eventPhase), true);
        target3.addEventListener('test', e => spy(e.eventPhase), true);

        event.path.push(target2, target3);

        target1.dispatchEvent(event);
      });

      it('should invoke callback during the CAPTURING_PHASE', () => {
        expect(spy).to.have.been.calledWith(GameEvent.CAPTURING_PHASE);
      });

      it('should invoke callback when AT_TARGET', () => {
        expect(spy).to.have.been.calledWith(GameEvent.AT_TARGET);
      });

      it('should not invoke callback during the BUBBLING_PHASE', () => {
        expect(spy).not.to.have.been.calledWith(GameEvent.BUBBLING_PHASE);
      });
    });

    /** @test {GameEventTarget#addEventListener} */
    describe('no capture', () => {
      let event;

      beforeEach(() => {
        event = new GameEvent('test');

        target1.addEventListener('test', e => spy(e.eventPhase));
        target2.addEventListener('test', e => spy(e.eventPhase));
        target3.addEventListener('test', e => spy(e.eventPhase));

        event.path.push(target2, target3);

        target1.dispatchEvent(event);
      });

      it('should invoke callback during the BUBBLING_PHASE', () => {
        expect(spy).to.have.been.calledWith(GameEvent.BUBBLING_PHASE);
      });

      it('should invoke callback when AT_TARGET', () => {
        expect(spy).to.have.been.calledWith(GameEvent.AT_TARGET);
      });

      it('should not invoke callback during the CAPTURING_PHASE', () => {
        expect(spy).not.to.have.been.calledWith(GameEvent.CAPTURING_PHASE);
      });
    });

    describe('once', () => {
      describe('boolean', () => {
        let event;

        beforeEach(() => {
          event = new GameEvent('test');
          target1.addEventListener('test', spy, { once: true });
          target1.dispatchEvent(event);
          target1.dispatchEvent(event);
        });

        it('should only call the callback once', () => {
          expect(spy).to.have.been.calledOnce;
        });
      });

      describe('promise', () => {
        let event, promise;

        beforeEach(() => {
          event = new GameEvent('test');
          promise = new Promise(resolve => setTimeout(resolve, 0));
          target1.addEventListener('test', spy, { once: promise });
        });

        it('should call the callback if the promise has not resolved', () => {
          target1.dispatchEvent(event);
          expect(spy).to.have.been.called;
        });

        it('should not call the callback if the promise has resolved', async () => {
          await promise;
          target1.dispatchEvent(event);
          expect(spy).not.to.have.been.called;
        });
      });
    });
  });


  /** @test {GameEventTarget#removeEventListener} */
  describe('removeEventListener', () => {
    it('should not invoke callback of listener', () => {
      target1.addEventListener('test', spy);
      target1.removeEventListener('test', spy);
      target1.dispatchEvent(new GameEvent('test'));

      expect(spy).not.to.have.been.called;
    });

    it('should not remove listener of options.capture does not match', () => {
      target1.addEventListener('test', spy);
      target1.removeEventListener('test', spy, true);
      target1.dispatchEvent(new GameEvent('test'));

      expect(spy).to.have.been.called;
    });
  });

  /** @test {GameEventTarget#removeAllEventListeners} */
  describe('removeAllEventListeners', () => {
    it('should not invoke any listeners', () => {
      target1.addEventListener('test', spy);
      target1.addEventListener('test', spy, true);
      target1.removeAllEventListeners();
      target1.dispatchEvent(new GameEvent('test'));
      expect(spy).not.to.have.been.called;
    });
  });

  /** @test {GameEventTarget#dispatchEvent} */
  describe('dispatchEvent', () => {
    it('should call console.warn when error is thrown in listener', () => {
      sinon.stub(console, 'warn');
      target1.addEventListener('test', () => { throw new Error('test'); });
      target1.dispatchEvent(new GameEvent('test'));
      expect(console.warn).to.have.been.called;
      console.warn.restore();
    });

    describe('propagation', () => {
      let event;
      beforeEach(() => {
        event = new GameEvent('test');
        event.path.push(target2, target3);
      });

      it('should bubble up the event path', () => {
        target1.addEventListener('test', e => spy(e.currentTarget));
        target2.addEventListener('test', e => spy(e.currentTarget));
        target3.addEventListener('test', e => spy(e.currentTarget));

        target1.dispatchEvent(event);

        expect(spy).to.have.been.calledThrice;
        expect(spy.getCall(0).args[0]).to.equal(target1);
        expect(spy.getCall(1).args[0]).to.equal(target2);
        expect(spy.getCall(2).args[0]).to.equal(target3);
      });

      it('should capture down the event path', () => {
        target1.addEventListener('test', e => spy(e.currentTarget), true);
        target2.addEventListener('test', e => spy(e.currentTarget), true);
        target3.addEventListener('test', e => spy(e.currentTarget), true);

        target1.dispatchEvent(event);

        expect(spy).to.have.been.calledThrice;
        expect(spy.getCall(0).args[0]).to.equal(target3);
        expect(spy.getCall(1).args[0]).to.equal(target2);
        expect(spy.getCall(2).args[0]).to.equal(target1);
      });
    });
  });

  /** @test {GameEventTarget#deferEvent} */
  describe('deferEvent', () => {
    it('should queue deferred event without dispatching', () => {
      target1.addEventListener('test', spy);
      target1.deferEvent(new GameEvent('test'));
      target1.deferEvent(new GameEvent('test'));
      expect(spy).not.to.have.been.called;
    });
  });

  /** @test {GameEventTarget#dispatchDeferredEvents} */
  describe('dispatchDeferredEvents', () => {
    it('should dispatch deferred events', () => {
      target1.addEventListener('test', spy);
      target1.deferEvent(new GameEvent('test'));
      target1.deferEvent(new GameEvent('test'));
      target1.dispatchDeferredEvents();
      expect(spy).to.have.been.calledTwice;
    });
  });
});
