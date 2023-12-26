import { describe, it, beforeEach } from 'https://deno.land/std@0.208.0/testing/bdd.ts';
import { spy, assertSpyCalls      } from 'https://deno.land/std@0.208.0/testing/mock.ts';

import { assertEquals       } from 'https://deno.land/std@0.208.0/assert/assert_equals.ts';
import { assertStrictEquals } from 'https://deno.land/std@0.208.0/assert/assert_strict_equals.ts';

import { GameNode } from '../../lib/gom/game-node.js';


/** @typedef {import('https://deno.land/std@0.208.0/testing/mock.ts').Spy} Spy */

describe('GameNode', () => {
    /** @type {GameNode<any, any>} */
    let node;
    /**
    * @type {GameNode<any, any>}
    */
    let childA;
    /**
    * @type {GameNode<any, any>}
    */
    let childB;
    /**
    * @type {GameNode<any, any>}
    */
    let parentA;
    /**
    * @type {GameNode<any, any>}
    */
    let parentB;

    /** @type {HTMLElement} */
    let element;

    beforeEach(() => {
        element = /** @type {HTMLElement} */({}); // The ECS library doesn't do anything with this, it's just used for reference externally so we just need ensure it is set.
        node = new GameNode({ id: 'node' });

        parentA = new GameNode({ id: 'parentA', element });
        parentB = new GameNode({ id: 'parentB' });
        childA  = new GameNode({ id: 'childA' });
        childB  = new GameNode({ id: 'childB' });

        node.parent = parentA;
        parentA.parent = parentB;

        node.children.add(childA);
        node.children.add(childB);
    });

    describe('update', () => {
        /** @type {Spy} */
        let updateA;
        /** @type {Spy} */
        let updateB;

        beforeEach(() => {
            updateA = spy(childA, 'update');
            updateB = spy(childB, 'update');
        });


        it('should call update on all children', async () => {
            await node.update(1);
            assertSpyCalls(updateA, 1);
            assertSpyCalls(updateB, 1);
        });
    });

    describe('render', () => {
        /** @type {Spy} */
        let renderA;
        /** @type {Spy} */
        let renderB;
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

    describe('preload', () => {
        /** @type {Spy} */
        let preloadA;
        /** @type {Spy} */
        let preloadB;
        beforeEach(() => {
            preloadA = spy(childA, 'preload');
            preloadB = spy(childB, 'preload');
        });

        it('should call preload on all children', async () => {
            await node.preload();
            assertSpyCalls(preloadA, 1);
            assertSpyCalls(preloadB, 1);
        });
    });


    describe('get root', () => {
        /** @type {GameNode<any, any>} */
        let root;
        /** @type {GameNode<any, any>} */
        let childA;
        /** @type {GameNode<any, any>} */
        let childB;

        beforeEach(() => {
            root   = new GameNode({ id: 'root' });
            childA = new GameNode({ id: 'childA' });
            childB = new GameNode({ id: 'childB' });

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

    describe('element', () => {
        it('should contain a reference to the element provided', () => {
            assertStrictEquals(parentA.element, element);
        });
    })
});
