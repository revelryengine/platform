import { describe, it, beforeEach, afterEach } from 'https://deno.land/std@0.143.0/testing/bdd.ts';
import { assertEquals                        } from 'https://deno.land/std@0.143.0/testing/asserts.ts';
import { spy, assertSpyCalls                 } from 'https://deno.land/std@0.143.0/testing/mock.ts';

import { GameNode } from '../../../lib/gom/game-node.js';

describe('GameNode', () => {
    let node, childA, childB, parentA, parentB, event;

    beforeEach(() => {
        node = new GameNode('node');
        node.initialized = true;

        parentA = new GameNode('parentA');
        parentB = new GameNode('parentB');
        childA = new GameNode('childA');
        childB = new GameNode('childB');

        node.parent = parentA;
        parentA.parent = parentB;

        node.children.add(childA);
        node.children.add(childB);

        event = { eventPhase: 0, bubbles: true, path: [] };


    });

    describe('update', () => {
        let dispatch, updateA, updateB;

        beforeEach(() => {
            dispatch  = spy(node, 'dispatchDeferredEvents');
            updateA = spy(childA, 'update');
            updateB = spy(childB, 'update');
        });

        it('should call dispatchDeferredEvents ', () => {
            node.update();
            assertSpyCalls(dispatch, 1);
        });

        it('should call update on all children', () => {
            node.update();
            assertSpyCalls(updateA, 1);
            assertSpyCalls(updateB, 1);
        });
    });

    describe('render', () => {
        let renderA, renderB;
        beforeEach(() => {
            renderA = spy(childA, 'render');
            renderB = spy(childB, 'render');
        });

        it('should call render on all children', () => {
            node.render();
            assertSpyCalls(renderA, 1);
            assertSpyCalls(renderB, 1);
        });
    });

    describe('dispatchEvent', () => {
        let dispatch;
        beforeEach(() => {
            dispatch = spy(Object.getPrototypeOf(GameNode).prototype, 'dispatchEvent');
        });

        afterEach(() => {
            dispatch.restore();
        });

        it('Add parents to GameEvent.path and call super dispatchEvent', () => {
            node.dispatchEvent(event);
            assertEquals(event.path[0], parentA);
            assertEquals(event.path[1], parentB);
            assertSpyCalls(dispatch, 1);
        });
    });

    describe('get root', () => {
        let root, childA, childB;

        beforeEach(() => {
            root   = new GameNode('root');
            childA = new GameNode('childA');
            childB = new GameNode('childB');

            root.children.add(childA);
            childA.children.add(childB);
        });

        it('should return the root node', () => {
            assertEquals(childA.root, root);
        });

        it('should return undefined for the root node itself', () => {
            assertEquals(root.root, undefined);
        });
    });
});
