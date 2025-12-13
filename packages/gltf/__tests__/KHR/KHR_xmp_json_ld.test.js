import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF } from '../../gltf.js';
import { KHRXMPJSONLD, ObjectKHRXMPJSONLD } from '../../KHR/KHR_xmp_json_ld.js';

const FIXTURE_URL = new URL('../__fixtures__/khr-xmp.gltf', import.meta.url);

describe('KHR_xmp_json_ld', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    describe('KHRXMPJSONLD', () => {
        it('resolves on GLTF extensions', () => {
            const extension = gltf.extensions?.KHR_xmp_json_ld;

            expect(extension).to.be.instanceOf(KHRXMPJSONLD);
        });
    });

    describe('ObjectKHRXMPJSONLD', () => {
        it('resolves on object extensions', () => {
            const targets = [
                gltf.asset,
                gltf.scenes[0],
                gltf.nodes[0],
                gltf.meshes[0],
                gltf.materials[0],
                gltf.images[0],
                gltf.animations[0],
            ];

            targets.forEach((target) => {
                const extension = target.extensions?.KHR_xmp_json_ld;

                expect(extension).to.be.instanceOf(ObjectKHRXMPJSONLD);
            });
        });

        it('resolves referenceFields', () => {
            const targets = [
                gltf.asset,
                gltf.scenes[0],
                gltf.nodes[0],
                gltf.meshes[0],
                gltf.materials[0],
                gltf.images[0],
                gltf.animations[0],
            ];

             targets.forEach((target) => {
                const extension = target.extensions?.KHR_xmp_json_ld;

                expect(extension?.packet).to.be.instanceOf(Object);
            });
        });
    });
});
