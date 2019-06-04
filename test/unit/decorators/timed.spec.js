import { timed } from '../../../lib/decorators/timed.js';
import { Game  } from '../../../lib/game.js';

/** @test {timed} */
describe('timed', () => {
  let game, test, spy;

  beforeEach(() => {
    spy = sinon.spy();
    game = new Game();
    test = new (class TestClass {
      @timed timedMethod() { spy(); }
      @timed async asyncTimedMethod() { spy(); }
    })();

    sinon.spy(performance, 'mark');
  });

  afterEach(() => {
    performance.mark.restore();
    performance.clearMarks();
    performance.clearMeasures();
  });

  describe('timing disabled', () => {
    beforeEach(() => {
      game.command('timing', false);
    });

    it('should execute original method', () => {
      test.timedMethod();
      expect(spy).to.have.been.called;
    });

    it('should not call performance.mark', () => {
      test.timedMethod();
      expect(performance.mark).not.to.have.been.called;
    });

    it('should return a promise for an async method', () => {
      expect(test.asyncTimedMethod() instanceof Promise).to.be.true;
    });

    it('should execute original async method', async () => {
      await test.asyncTimedMethod();
      expect(spy).to.have.been.called;
    });
  });

  describe('timing enabled', () => {
    beforeEach(() => {
      game.command('timing', true);
    });

    it('should execute original method', () => {
      test.timedMethod();
      expect(spy).to.have.been.called;
    });

    it('should call performance.mark', () => {
      test.timedMethod();
      expect(performance.mark).to.have.been.called;
    });

    it('should add User Timing entries for Revelry:ClassName:method', () => {
      test.timedMethod();
      expect(performance.getEntriesByName('Revelry:TestClass.timedMethod')[0]).not.to.be.undefined;
    });

    it('should return a promise for an async method', () => {
      expect(test.asyncTimedMethod() instanceof Promise).to.be.true;
    });

    it('should execute original async method', async () => {
      await test.asyncTimedMethod();
      expect(spy).to.have.been.called;
    });
  });
});
