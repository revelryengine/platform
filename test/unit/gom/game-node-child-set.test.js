import { describe, it, beforeEach          } from 'https://deno.land/std@0.143.0/testing/bdd.ts';
import { assert, assertEquals, assertFalse } from 'https://deno.land/std@0.143.0/testing/asserts.ts';
import { spy, assertSpyCalls               } from 'https://deno.land/std@0.143.0/testing/mock.ts';

import { GameNodeChildSet } from '../../../lib/gom/game-node-child-set.js';
import { GameNode         } from '../../../lib/gom/game-node.js';
import { Game             } from '../../../lib/game.js';

describe('GameNodeChildSet', () => {
    let parent, childSet, childA, childB;
    beforeEach(() => {
        parent   = new GameNode('parent');
        childSet = new GameNodeChildSet(parent, [new GameNode('childC')]);
        childA   = new GameNode('childA');
        childB   = new GameNode('childB');
    });

    describe('constructor', () => {
        it('should add all items specified in iterable argument', () => {
            const childSet = new GameNodeChildSet(parent, [new GameNode('child')])
            assertEquals([...childSet][0].id, 'child');
        });
    });

    describe('add', () => {
        let connected;
        beforeEach(() => {
            connected = spy(childA, 'connectedCallback');
            childSet.add(childA);
        });

        it('should add node to set', () => {
            assert(childSet.has(childA));
        });

        it('should set parent reference on node', () => {
            assertEquals(childA.parent, parent);
        });

        it('should call connectedCallback on node when added to game', () => {
            const game = new Game();
            game.children.add(childA);
            assertSpyCalls(connected, 1);
        });

    });

    describe('delete', () => {
        let disconnected;
        beforeEach(() => {
            disconnected = spy(childA, 'disconnectedCallback');
            childSet.add(childA);
            childSet.delete(childA);
        });

        it('should remove node from set', () => {
            assertFalse(childSet.has(childA));
        });

        it('should unset parent reference on node', () => {
            assertEquals(childA.parent, undefined);
        });

        it('should call disconnectedCallback on node when removed from game', () => {
            const game = new Game();
            game.children.add(childA);
            game.children.delete(childA);
            assertSpyCalls(disconnected, 1);
        });

        it('should not calll disconnectedCallback on node if not removed from game', () => {
            childSet.delete(childA);
            assertSpyCalls(disconnected, 0);
        });

        it('should return false if child was not part of parent', () => {
            assertFalse(childSet.delete(new GameNode()));
        });
    });

    describe('getById', () => {
        beforeEach(() => {
            childSet.add(childA);
            childSet.add(childB);
        });

        it('should return child by id', () => {
            assertEquals(childSet.getById('childA'), childA);
        });
    });

    describe('connectedCallback', () => {
        let game, childA, childB, childC, connectedA, connectedB, connectedC;
        beforeEach(() => {
            game = new Game();
            childA = new GameNode('childA');
            childB = new GameNode('childB');
            childC = new GameNode('childC');
            connectedA = spy(childA, 'connectedCallback');
            connectedB = spy(childB, 'connectedCallback');
            connectedC = spy(childC, 'connectedCallback');
            childA.children.add(childB);
            childB.children.add(childC);
        });

        it('should call connectedCallback on all children nodes when added to game', () => {
            game.children.add(childA);
            assertSpyCalls(connectedA, 1);
            assertSpyCalls(connectedB, 1);
            assertSpyCalls(connectedC, 1);
        });

        it('should not call connectedCallback on node if not added to game', () => {
            assertSpyCalls(connectedA, 0);
            assertSpyCalls(connectedB, 0);
        });
    });

    describe('disconnectedCallback', () => {
        let game, childA, childB, childC, disconnectedA, disconnectedB, disconnectedC;
        beforeEach(() => {
            game = new Game();
            childA = new GameNode('childA');
            childB = new GameNode('childB');
            childC = new GameNode('childC');

            disconnectedA = spy(childA, 'disconnectedCallback');
            disconnectedB = spy(childB, 'disconnectedCallback');
            disconnectedC = spy(childC, 'disconnectedCallback');

            childA.children.add(childB);
            childB.children.add(childC);
        });

        it('should call disconnectedCallback on all children nodes when added to game', () => {
            game.children.add(childA);
            childA.children.delete(childB);
            assertSpyCalls(disconnectedB, 1);
            assertSpyCalls(disconnectedC, 1);
        });

        it('should not calll disconnectedCallback on node if not added to game', () => {
            childA.children.delete(childB);

            assertSpyCalls(disconnectedB, 0);
            assertSpyCalls(disconnectedC, 0);
        });
    });
});
