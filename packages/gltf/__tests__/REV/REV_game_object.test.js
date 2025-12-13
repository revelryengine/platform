import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF              } from '../../gltf.js';
import { NodeREVGameObject } from '../../REV/REV_game_object.js';

const FIXTURE_URL = new URL('../__fixtures__/rev-game-object.gltf', import.meta.url);

describe('REV_game_object', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    /**
     * @param {string} name
     */
    function getNode(name) {
        const node = gltf.nodes.find(entry => entry.name === name);
        if(!node) throw new Error(`Missing node ${name} in fixture`);
        return node;
    }

    describe('NodeREVGameObject', () => {
        it('resolves on Node extensions', () => {
            const node = getNode('RootNode');
            const extension = node.extensions?.REV_game_object;

            expect(extension).to.be.instanceOf(NodeREVGameObject);
        });
    });
});
