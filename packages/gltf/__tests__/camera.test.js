import { describe, it, expect, beforeEach } from 'bdd';
import { findItem, findItemProp } from './__helpers__/find-item.js';

import { mat4 } from 'revelryengine/deps/gl-matrix.js';

import { GLTF               } from '../gltf.js';
import { Camera             } from '../camera.js';
import { CameraPerspective  } from '../camera-perspective.js';
import { CameraOrthographic } from '../camera-orthographic.js';

const FIXTURE_URL = new URL('./__fixtures__/camera.gltf', import.meta.url);

describe('Camera', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    it('resolves referenceFields', () => {
        const [perspectiveCamera, orthographicCamera] = gltf.cameras;

        expect(perspectiveCamera?.perspective).to.be.instanceOf(CameraPerspective);
        expect(orthographicCamera?.orthographic).to.be.instanceOf(CameraOrthographic);
    });

    describe('isPerspective', () => {
        it('returns true for perspective cameras', () => {
            const camera = findItem(gltf.cameras, 'PerspectiveWithAspect');

            expect(camera.isPerspective()).to.be.true;
        });

        it('returns false for orthographic cameras', () => {
            const camera = findItem(gltf.cameras, 'OrthographicWide');

            expect(camera.isPerspective()).to.be.false;
        });
    });

    describe('isOrthographic', () => {
        it('returns true for orthographic cameras', () => {
            const camera = findItem(gltf.cameras, 'OrthographicWide');

            expect(camera.isOrthographic()).to.be.true;
        });

        it('returns false for perspective cameras', () => {
            const camera = findItem(gltf.cameras, 'PerspectiveWithAspect');

            expect(camera.isOrthographic()).to.be.false;
        });
    });

    describe('getAspectRatio', () => {
        it('uses the stored aspect ratio for perspective cameras', () => {
            const camera = findItem(gltf.cameras, 'PerspectiveWithAspect');

            expect(camera.getAspectRatio()).to.equal(1.6);
        });

        it('derives the ratio from magnitudes for orthographic cameras', () => {
            const camera = findItem(gltf.cameras, 'OrthographicWide');

            expect(camera.getAspectRatio()).to.equal(2);
        });
    });

    describe('setAspectRatio', () => {
        it('updates the stored aspect ratio on perspective cameras', () => {
            const camera = findItem(gltf.cameras, 'PerspectiveWithAspect');

            camera.setAspectRatio(2);

            expect(camera.perspective?.aspectRatio).to.equal(2);
        });

        it('adjusts xmag based on ymag for orthographic cameras', () => {
            const camera = findItem(gltf.cameras, 'OrthographicWide');

            camera.setAspectRatio(1.5);

            expect(camera.orthographic?.xmag).to.equal(3);
        });
    });

    describe('getDetails', () => {
        it('returns the perspective payload when applicable', () => {
            const camera = findItem(gltf.cameras, 'PerspectiveWithAspect');

            expect(camera.getDetails()).to.equal(camera.perspective);
        });

        it('returns the orthographic payload when applicable', () => {
            const camera = findItem(gltf.cameras, 'OrthographicWide');

            expect(camera.getDetails()).to.equal(camera.orthographic);
        });

        it('throws an error for invalid types', () => {
            // @ts-expect-error - We are intentionally setting an invalid type for testing
            const camera  = new Camera({ type: 'invalid' });

            expect(() => camera.getDetails()).to.throw('Invalid Camera');
        });
    });

    describe('getYFov', () => {
        it('returns the perspective yfov in radians', () => {
            const camera = findItem(gltf.cameras, 'PerspectiveWithAspect');

            expect(camera.getYFov()).to.equal(1.0471975512);
        });

        it('returns the orthographic ymag value', () => {
            const camera = findItem(gltf.cameras, 'OrthographicWide');

            expect(camera.getYFov()).to.equal(2);
        });

        it('throws an error for invalid types', () => {
            // @ts-expect-error - We are intentionally setting an invalid type for testing
            const camera  = new Camera({ type: 'invalid' });

            expect(() => camera.getYFov()).to.throw('Invalid Camera');
        });
    });

    describe('getProjectionMatrix', () => {
        it('builds a perspective matrix based on width and height', () => {
            const camera      = findItem(gltf.cameras, 'PerspectiveWithAspect');
            const perspective = findItemProp(gltf.cameras, 'PerspectiveWithAspect', 'perspective');

            const matrix   = camera.getProjectionMatrix({ width: 1920, height: 1080 });
            const expected = mat4.create();

            mat4.perspectiveNO(
                expected,
                perspective.yfov,
                perspective.aspectRatio ?? 0,
                perspective.znear,
                perspective.zfar,
            );

            expect(Array.from(matrix ?? [])).to.deep.equal(Array.from(expected));
        });

        it('builds an orthographic matrix', () => {
            const camera       = findItem(gltf.cameras, 'OrthographicWide');
            const orthographic = findItemProp(gltf.cameras, 'OrthographicWide', 'orthographic');

            const matrix   = camera.getProjectionMatrix();
            const expected = mat4.create();

            mat4.orthoNO(
                expected,
                -orthographic.xmag,
                orthographic.xmag,
                -orthographic.ymag,
                orthographic.ymag,
                orthographic.znear,
                orthographic.zfar,
            );

            expect(Array.from(matrix)).to.deep.equal(Array.from(expected));
        });

        describe('ndcZO', () => {
            it('builds a perspective matrix with zero-to-one clip space', () => {
                const camera      = findItem(gltf.cameras, 'PerspectiveWithAspect');
                const perspective = findItemProp(gltf.cameras, 'PerspectiveWithAspect', 'perspective');

                const matrix   = camera.getProjectionMatrix({ width: 1920, height: 1080, ndcZO: true });
                const expected = mat4.create();

                mat4.perspectiveZO(
                    expected,
                    perspective.yfov,
                    perspective.aspectRatio ?? 0,
                    perspective.znear,
                    perspective.zfar,
                );

                expect(Array.from(matrix)).to.deep.equal(Array.from(expected));
            });

            it('builds an orthographic matrix with zero-to-one clip space', () => {
                const camera       = findItem(gltf.cameras, 'OrthographicWide');
                const orthographic = findItemProp(gltf.cameras, 'OrthographicWide', 'orthographic');

                const matrix   = camera.getProjectionMatrix({ ndcZO: true });
                const expected = mat4.create();

                mat4.orthoZO(
                    expected,
                    -orthographic.xmag,
                    orthographic.xmag,
                    -orthographic.ymag,
                    orthographic.ymag,
                    orthographic.znear,
                    orthographic.zfar,
                );

                expect(Array.from(matrix)).to.deep.equal(Array.from(expected));
            });
        });

        describe('override', () => {
            it('builds a perspective matrix based on overrides', () => {
                const camera = findItem(gltf.cameras, 'PerspectiveWithAspect');

                const override = { aspectRatio: 16 / 9, yfov: Math.PI / 4, znear: 0.1, zfar: 1000 };
                const matrix   = camera.getProjectionMatrix({ width: 1920, height: 1080, override });
                const expected = mat4.create();

                mat4.perspectiveNO(
                    expected,
                    override.yfov,
                    override.aspectRatio,
                    override.znear,
                    override.zfar,
                );

                expect(Array.from(matrix)).to.deep.equal(Array.from(expected));
            });

            it('builds a orthographic matrix based on overrides', () => {
                const camera = findItem(gltf.cameras, 'OrthographicWide');

                const override = { xmag: 5, ymag: 2.5, znear: 0.5, zfar: 50 };
                const matrix   = camera.getProjectionMatrix({ override });
                const expected = mat4.create();

                mat4.orthoNO(
                    expected,
                    -override.xmag,
                    override.xmag,
                    -override.ymag,
                    override.ymag,
                    override.znear,
                    override.zfar,
                );

                expect(Array.from(matrix)).to.deep.equal(Array.from(expected));
            });
        });

        it('builds a perspective matrix with zfar set to infinity if not defined', () => {
            const camera      = findItem(gltf.cameras, 'PerspectiveAutoAspect');
            const perspective = findItemProp(gltf.cameras, 'PerspectiveAutoAspect', 'perspective');

            const matrix   = camera.getProjectionMatrix({ width: 1920, height: 1080 });
            const expected = mat4.create();

            mat4.perspectiveNO(
                expected,
                perspective.yfov,
                16 / 9,
                perspective.znear,
                Infinity,
            );

            expect(Array.from(matrix)).to.deep.equal(Array.from(expected));
        });
    });
});
