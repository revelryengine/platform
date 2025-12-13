import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF  } from '../../gltf.js';
import { Image } from '../../image.js';

import {
    KHREnvironmentMap,
    KHREnvironmentMapCubemap,
    KHREnvironmentMapData,
    SceneKHREnvironmentMap,
} from '../../KHR/KHR_environment_map.js';

import { KTX2Container } from 'revelryengine/deps/ktx-parse.js';

const FIXTURE_URL = new URL('../__fixtures__/khr-environment-map.gltf', import.meta.url);

describe('KHR_environment_map', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    describe('KHREnvironmentMapCubemap', () => {
        it('resolves referenceFields', () => {
            const cubemap = gltf.extensions?.KHR_environment_map?.cubemaps?.[0];

            expect(cubemap?.source).to.be.instanceOf(Image);
        });

        it('sets default values', () => {
            const cubemap = new KHREnvironmentMapCubemap({ source: new Image({
                name: 'Placeholder',
                uri: new URL('https://revelry.local/env.png'),
            }) });

            expect(cubemap.layer).to.equal(0);
            expect(cubemap.intensity).to.equal(1);
        });

        describe('load', () => {
            it('loads KTX image data from the source image', async () => {
                const cubemap = gltf.extensions?.KHR_environment_map?.cubemaps?.[0];
                expect(cubemap?.getImageDataKTX()).to.be.instanceOf(KTX2Container);
            });
        });

        describe('getImageDataKTX', () => {
            it('throws when image data has not been loaded yet', () => {
                const image = new KHREnvironmentMapCubemap({ source: gltf.images[0] });
                expect(() => image.getImageDataKTX()).to.throw('Invalid State');
            });
        });
    });

    describe('KHREnvironmentMapData', () => {
        it('resolves referenceFields', () => {
            const environmentMap = gltf.extensions?.KHR_environment_map?.environment_maps[0];

            expect(environmentMap?.cubemap).to.be.instanceOf(KHREnvironmentMapCubemap);
        });
    });

    describe('KHREnvironmentMap', () => {
        it('resolves on GLTF extensions', () => {
            const extension = gltf.extensions?.KHR_environment_map;

            expect(extension).to.be.instanceOf(KHREnvironmentMap);
        });
        it('resolves referenceFields', () => {
            const extension = gltf.extensions?.KHR_environment_map;

            expect(extension?.cubemaps?.[0]).to.be.instanceOf(KHREnvironmentMapCubemap);
            expect(extension?.environment_maps[0]).to.be.instanceOf(KHREnvironmentMapData);
        });
    });

    describe('SceneKHREnvironmentMap', () => {
        it('resolves on Scene extensions', () => {
            const sceneExtension = gltf.scenes[0]?.extensions?.KHR_environment_map;

            expect(sceneExtension).to.be.instanceOf(SceneKHREnvironmentMap);
        });
        it('resolves referenceFields', () => {
            const sceneExtension = gltf.scenes[0]?.extensions?.KHR_environment_map;

            expect(sceneExtension?.environment_map).to.be.instanceOf(KHREnvironmentMapData);
        });
    });
});
