import { describe, it, beforeEach } from 'https://deno.land/std@0.208.0/testing/bdd.ts';
import { spy, assertSpyCalls      } from 'https://deno.land/std@0.208.0/testing/mock.ts';

import { assert       } from 'https://deno.land/std@0.208.0/assert/assert.ts';
import { assertEquals } from 'https://deno.land/std@0.208.0/assert/assert_equals.ts';
import { assertFalse  } from 'https://deno.land/std@0.208.0/assert/assert_false.ts';

import { GameNodeChildSet } from '../../lib/gom/game-node-child-set.js';
import { GameNode         } from '../../lib/gom/game-node.js';
import { Game             } from '../../lib/game.js';
import { Stage            } from '../../lib/stage.js';
import { System           } from '../../lib/system.js';

/** @typedef {import('https://deno.land/std@0.208.0/testing/mock.ts').Spy} Spy */

describe('GameNodeChildSet', () => {

    class SystemA extends System {}
    class SystemB extends System {}

    /** @type {Game} */
    let game;
    /** @type {Stage} */
    let stageA;
    /** @type {Stage} */
    let stageB;
    /** @type {SystemA} */
    let systemA;
    /** @type {SystemB} */
    let systemB;
    /** @type {GameNodeChildSet<any>} */
    let childSet;

    /** @type {Spy} */
    let handler;

    beforeEach(() => {
        game     = new Game();
        stageA   = new Stage({ id: 'stageA' });
        stageB   = new Stage({ id: 'stageB' });
        systemA  = new SystemA({ id: 'systemA' });
        systemB  = new SystemB({ id: 'systemB' });
        childSet = new GameNodeChildSet(new GameNode({ id: 'parent' }), [new GameNode({ id: 'child' })]);
    });

    describe('constructor', () => {
        it('should add all items specified in iterable argument', () => {
            assertEquals([...childSet][0].id, 'child');
        });
    });

    describe('add', () => {
        /** @type {Spy} */
        let connected;
        beforeEach(() => {
            connected = spy(stageA, 'connectedCallback');
            handler = spy();
            game.watch('node:add', handler);
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

        it('should notify node:add', () => {
            assertSpyCalls(handler, 1);
        });
    });

    describe('delete', () => {
        beforeEach(() => {
            handler = spy();
            game.watch('node:delete', handler);
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

        it('should notify node:delete', () => {
            assertSpyCalls(handler, 1);
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
        /** @type {Spy} */
        let connectedStageA;
         /** @type {Spy} */
        let connectedStageB;
        /** @type {Spy} */
        let connectedSystemA;
        /** @type {Spy} */
        let connectedSystemB;

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
        /** @type {Spy} */
        let disconnectedStageA;
        /** @type {Spy} */
        let disconnectedStageB;
        /** @type {Spy} */
        let disconnectedSystemA;
        /** @type {Spy} */
        let disconnectedSystemB;

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
