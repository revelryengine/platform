import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF } from '../../gltf.js';

import {
    KHRLightsPunctual,
    KHRLightsPunctualLight,
    KHRLightsPunctualLightSpot,
    NodeKHRLightsPunctual,
} from '../../KHR/KHR_lights_punctual.js';

const FIXTURE_URL = new URL('../__fixtures__/khr-lights-punctual.gltf', import.meta.url);

describe('KHR_lights_punctual', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    describe('KHRLightsPunctualLightSpot', () => {
        it('sets default values', () => {
            const spot = new KHRLightsPunctualLightSpot({});

            expect(spot.innerConeAngle).to.equal(0);
            expect(spot.outerConeAngle).to.equal(Math.PI / 4);
        });
    });

    describe('KHRLightsPunctualLight', () => {
        it('resolves referenceFields', () => {
            const light = gltf.extensions?.KHR_lights_punctual?.lights[1];

            expect(light?.spot).to.be.instanceOf(KHRLightsPunctualLightSpot);
        });

        it('sets default values', () => {
            const light = new KHRLightsPunctualLight({ name: 'DefaultLight', type: 'point' });

            expect(light.range).to.equal(Infinity);
            expect(light.color).to.deep.equal([1, 1, 1]);
            expect(light.intensity).to.equal(1);
        });
    });

    describe('KHRLightsPunctual', () => {
        it('resolves on GLTF extensions', () => {
            const extension = gltf.extensions?.KHR_lights_punctual;

            expect(extension).to.be.instanceOf(KHRLightsPunctual);
        });

        it('resolves referenceFields', () => {
            const extension = gltf.extensions?.KHR_lights_punctual;

            expect(extension?.lights[0]).to.be.instanceOf(KHRLightsPunctualLight);
        });
    });

    describe('NodeKHRLightsPunctual', () => {
        it('resolves on Node extensions', () => {
            const node = gltf.nodes.find(entry => entry.name === 'DirectionalLightNode');
            const extension = node?.extensions?.KHR_lights_punctual;

            expect(extension).to.be.instanceOf(NodeKHRLightsPunctual);
        });

        it('resolves referenceFields', () => {
            const node = gltf.nodes.find(entry => entry.name === 'DirectionalLightNode');
            const extension = node?.extensions?.KHR_lights_punctual;

            expect(extension?.light).to.be.instanceOf(KHRLightsPunctualLight);
        });
    });
});
