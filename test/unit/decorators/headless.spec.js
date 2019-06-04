import { headlessOnly, nonheadlessOnly } from '../../../lib/decorators/headless.js';
import { Game } from '../../../lib/game.js';

/** @test {headlessOnly} */
/** @test {nonheadlessOnly} */
describe('headless', () => {
  let game, test, spy;

  beforeEach(() => {
    spy = sinon.spy();
    game = new Game();
    test = new (class TestClass {
      @headlessOnly headlessMethod() { spy(); }
      @nonheadlessOnly nonheadlessMethod() { spy(); }

      @headlessOnly async asyncHeadlessMethod() { spy(); }
      @nonheadlessOnly async asyncNonheadlessMethod() { spy(); }
    })();
  });

  afterEach(() => {
    game.command('headless', false);
  });

  describe('nonheadless mode', () => {
    beforeEach(() => {
      game.command('headless', false);
    });

    it('should not execute headlessOnly', () => {
      test.headlessMethod();
      expect(spy).not.to.have.been.called;
    });

    it('should execute nonheadlessOnly', () => {
      test.nonheadlessMethod();
      expect(spy).to.have.been.called;
    });

    it('should return promises for async methods', () => {
      expect(test.asyncHeadlessMethod()).to.be.instanceOf(Promise);
      expect(test.asyncNonheadlessMethod()).to.be.instanceOf(Promise);
    });

    it('should not execute async headlessOnly', async () => {
      await test.asyncHeadlessMethod();
      expect(spy).not.to.have.been.called;
    });

    it('should execute async nonheadlessOnly', async () => {
      await test.asyncNonheadlessMethod();
      expect(spy).to.have.been.called;
    });
  });

  describe('headless mode', () => {
    beforeEach(() => {
      game.command('headless', true);
    });

    it('should execute headlessOnly method', () => {
      test.headlessMethod();
      expect(spy).to.have.been.called;
    });

    it('should not execute nonheadlessOnly method', () => {
      test.nonheadlessMethod();
      expect(spy).not.to.have.been.called;
    });

    it('should return promises for async methods', () => {
      expect(test.asyncHeadlessMethod() instanceof Promise).to.be.true;
      expect(test.asyncNonheadlessMethod() instanceof Promise).to.be.true;
    });

    it('should execute async headlessOnly', async () => {
      await test.asyncHeadlessMethod();
      expect(spy).to.have.been.called;
    });

    it('should not execute async nonheadlessOnly', async () => {
      await test.asyncNonheadlessMethod();
      expect(spy).not.to.have.been.called;
    });
  });
});
