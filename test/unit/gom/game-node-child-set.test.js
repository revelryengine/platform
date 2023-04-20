import { describe, it, beforeEach          } from 'std/testing/bdd.ts';
import { assert, assertEquals, assertFalse } from 'std/testing/asserts.ts';
import { spy, assertSpyCalls               } from 'std/testing/mock.ts';

import { GameNodeChildSet } from '../../../lib/gom/game-node-child-set.js';
import { GameNode         } from '../../../lib/gom/game-node.js';
import { Game             } from '../../../lib/game.js';
import { Stage            } from '../../../lib/stage.js';
import { System           } from '../../../lib/system.js';

/** @typedef {import('std/testing/mock.ts').Spy} Spy */

describe('GameNodeChildSet', () => {
    let /** @type {Game} */game, /** @type {Stage} */stageA, /** @type {Stage} */stageB, /** @type {System} */systemA, /** @type {System} */systemB, /** @type {GameNodeChildSet<any>} */childSet;

    beforeEach(() => {
        game     = new Game();
        stageA   = new Stage('stageA');
        stageB   = new Stage('stageB');
        systemA  = new System('systemA');
        systemB  = new System('systemB');
        childSet = new GameNodeChildSet(new GameNode('parent'), [new GameNode('child')]);
    });

    describe('constructor', () => {
        it('should add all items specified in iterable argument', () => {
            assertEquals([...childSet][0].id, 'child');
        });
    });

    describe('add', () => {
        let /** @type {Spy} */connected;
        beforeEach(() => {
            connected = spy(stageA, 'connectedCallback');
            game.children.add(stageA);
        });

        it('should add node to set', () => {
            assert(game.children.has(stageA));
        });

        it('should set game reference on node', () => {
            assertEquals(stageA.game, game);
        });

        it('should call connectedCallback on node when added to game', () => {
            assertSpyCalls(connected, 1);
        });

    });

    describe('delete', () => {
        beforeEach(() => {
            game.children.add(stageA);
            game.children.delete(stageA);
        });

        it('should remove node from set', () => {
            assertFalse(game.children.has(stageA));
        });

        it('should unset game reference on node', () => {
            assertEquals(stageA.game, undefined);
        });

        it('should return false if child was not part of game', () => {
            assertFalse(childSet.delete(new GameNode()));
        });
    });

    describe('getById', () => {
        beforeEach(() => {
            childSet.add(stageA);
            childSet.add(stageB);
        });

        it('should return child by id', () => {
            assertEquals(childSet.getById('stageA'), stageA);
        });
    });

    describe('connectedCallback', () => {
        let /** @type {Spy} */connectedStageA, /** @type {Spy} */connectedStageB;
        let /** @type {Spy} */connectedSystemA, /** @type {Spy} */connectedSystemB;

        beforeEach(() => {
            connectedStageA  = spy(stageA,  'connectedCallback');
            connectedStageB  = spy(stageB,  'connectedCallback');
            connectedSystemA = spy(systemA, 'connectedCallback');
            connectedSystemB = spy(systemB, 'connectedCallback');

            stageA.children.add(systemA);
            stageB.children.add(systemB);
        });

        it('should call connectedCallback on all children nodes when added to game', () => {
            game.children.add(stageA);
            game.children.add(stageB);

            assertSpyCalls(connectedStageA, 1);
            assertSpyCalls(connectedStageB, 1);
            assertSpyCalls(connectedSystemA, 1);
            assertSpyCalls(connectedSystemB, 1);
        });

        it('should not call connectedCallback on node if never added to game', () => {
            assertSpyCalls(connectedSystemA, 0);
            assertSpyCalls(connectedSystemB, 0);
        });
    });

    describe('disconnectedCallback', () => {
        let /** @type {Spy} */disconnectedStageA, /** @type {Spy} */disconnectedStageB;
        let /** @type {Spy} */disconnectedSystemA, /** @type {Spy} */disconnectedSystemB;
        beforeEach(() => {
            disconnectedStageA  = spy(stageA,  'disconnectedCallback');
            disconnectedStageB  = spy(stageB,  'disconnectedCallback');
            disconnectedSystemA = spy(systemA, 'disconnectedCallback');
            disconnectedSystemB = spy(systemB, 'disconnectedCallback');

            stageA.children.add(systemA);
            stageB.children.add(systemB);
        });

        it('should call disconnectedCallback on all children nodes when deleted from game', () => {
            game.children.add(stageA);
            game.children.add(stageB);

            game.children.delete(stageA);
            game.children.delete(stageB);

            assertSpyCalls(disconnectedStageA, 1);
            assertSpyCalls(disconnectedStageB, 1);
            assertSpyCalls(disconnectedSystemA, 1);
            assertSpyCalls(disconnectedSystemB, 1);
        });

        it('should not call disconnectedCallback on node if never added to game', () => {
            stageA.children.delete(systemA);
            stageB.children.delete(systemB);

            assertSpyCalls(disconnectedSystemA, 0);
            assertSpyCalls(disconnectedSystemB, 0);
        });
    });
});
