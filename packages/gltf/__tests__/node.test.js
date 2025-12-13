import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF   } from '../gltf.js';
import { Camera } from '../camera.js';
import { Node   } from '../node.js';
import { Mesh   } from '../mesh.js';
import { Skin   } from '../skin.js';

const FIXTURE_URL = new URL('./__fixtures__/mesh.gltf', import.meta.url);

describe('Node', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    it('resolves referenceFields', () => {
        const root = gltf.nodes[0];

        expect(root.camera).to.be.instanceOf(Camera);
        expect(root.mesh).to.be.instanceOf(Mesh);
        expect(root.children[0]).to.be.instanceOf(Node);
        expect(root.skin).to.be.instanceOf(Skin);
    });

    describe('getNumberOfMorphTargets', () => {
        it('returns the morph target count from the mesh primitive', () => {
            const root = gltf.nodes[0];

            expect(root.getNumberOfMorphTargets()).to.equal(1);
            const child = gltf.nodes[1];
            expect(child.getNumberOfMorphTargets()).to.equal(0);
        });
    });

    describe('traverseDepthFirst', () => {
        it('visits the node hierarchy depth-first', () => {
            const names = Array.from(gltf.nodes[0].traverseDepthFirst()).map(node => node.name);
            expect(names).to.deep.equal(['RootNode', 'ChildNode']);
        });
    });

    describe('traverseBreadthFirst', () => {
        it('visits the node hierarchy breadth-first', () => {
            const names = Array.from(gltf.nodes[0].traverseBreadthFirst()).map(node => node.name);
            expect(names).to.deep.equal(['RootNode', 'ChildNode']);
        });
    });
});
