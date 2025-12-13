import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF  } from '../gltf.js';
import { Node  } from '../node.js';

const FIXTURE_URL = new URL('./__fixtures__/scene.gltf', import.meta.url);

describe('Scene', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    describe('referenceFields', () => {
        it('resolves referenceFields', () => {
            const scene = gltf.scene;

            expect(scene.nodes[0]).to.be.instanceOf(Node);
        });
    });

    describe('traverseBreadthFirst', () => {
        it('traverses the hierarchy breadth-first', () => {
            const scene = gltf.scene;

            const breadthNames = Array.from(scene.traverseBreadthFirst()).map(node => node.name);

            expect(breadthNames).to.deep.equal(['RootA', 'RootB', 'ChildA', 'LeafA']);
        });
    });

    describe('traverseDepthFirst', () => {
        it('traverses the hierarchy depth-first', () => {
            const scene = gltf.scene;

            const depthNames = Array.from(scene.traverseDepthFirst()).map(node => node.name);

            expect(depthNames).to.deep.equal(['RootA', 'ChildA', 'LeafA', 'RootB']);
        });
    });
});
