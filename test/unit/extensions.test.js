import { describe, it, beforeEach } from 'std/testing/bdd.ts';
import { assertEquals             } from 'std/testing/asserts.ts';


import { Game       } from '../../lib/game.js';
import { extensions } from '../../lib/extensions.js';

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
        assertEquals(gameA.extensions, extensions);
        assertEquals(gameB.extensions, extensions);
        assertEquals(gameC.extensions, extensions);
    });
});
