import { Game       } from '../../lib/game.js';
import { extensions } from '../../lib/extensions.js';

/** @test {extensions} */
describe('extensions', () => {
  let GameSubClassA, GameSubClassB, GameSubClassC;
  let gameA, gameB, gameC;

  beforeEach(() => {
    GameSubClassA = class extends Game { };
    GameSubClassB = class extends Game { };
    GameSubClassC = class extends GameSubClassB { };

    gameA = new GameSubClassA();
    gameB = new GameSubClassB();
    gameC = new GameSubClassC();
  });

  it('should have the same instance of extensions across the import and all instances of Game', () => {
    expect(gameA.extensions).to.equal(extensions);
    expect(gameB.extensions).to.equal(extensions);
    expect(gameC.extensions).to.equal(extensions);
  });
});
