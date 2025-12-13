import { describe, it, expect, beforeEach } from 'bdd';
import { findItem } from './__helpers__/find-item.js';

import { GLTF             } from '../gltf.js';
import { Animator         } from '../animation.js';
import { AnimationSampler } from '../animation-sampler.js';
import { AnimationChannel } from '../animation-channel.js';

/**
 * @import { Animation } from '../animation.js';
 * @import { Node      } from '../node.js';
 * @import { Material  } from '../material.js';
 */

const FIXTURE_URL = new URL('./__fixtures__/animation.gltf', import.meta.url);

describe('Animation', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    it('resolves referenceFields', () => {
        const animation = findItem(gltf.animations, 'TranslateAnim');

        expect(animation.samplers[0]).to.be.instanceOf(AnimationSampler);
        expect(animation.channels[0]).to.be.instanceOf(AnimationChannel);
    });

    describe('createAnimator', () => {
        it('creates Animator instances with the requested loop flag', () => {
            const animation = findItem(gltf.animations, 'TranslateAnim');
            const animator = animation?.createAnimator(false);

            expect(animator).to.be.instanceOf(Animator);
            expect(animator.loop).to.be.false;
            expect(animator.animation).to.equal(animation);
        });

        it('throws if target node is not set', () => {
            const animation = findItem(gltf.animations, 'InvalidAnim');

            expect(() => animation.createAnimator()).to.throw(Error, 'Invalid Animation Channel: Missing target node');
        });

        it('throws if animation path is pointer and KHR_animation_pointer is not set on channel', () => {
            const animation = findItem(gltf.animations, 'InvalidPointerAnim');

            expect(() => animation.createAnimator()).to.throw(Error, 'Invalid Animation Channel: Missing KHR_animation_pointer extension');
        });

        it('initializes target path if not already set', () => {
            const animation = findItem(gltf.animations, 'InitializationAnim');
            animation.createAnimator();
            expect(gltf.nodes[4].translation).to.exist;
        });

        it('initializes target path if not already set for animation pointers', () => {
            const animation = findItem(gltf.animations, 'InitializationAnim');
            animation.createAnimator();
            expect(gltf.nodes[4].weights).to.exist;
            expect(gltf.nodes[4].extras?.foobar).to.equal(0);
        });
    });

    describe('Animator.update', () => {
        /** @type {Animation} */
        let animation;
        /** @type {Node} */
        let node;

        beforeEach(() => {
            animation = findItem(gltf.animations, 'TranslateAnim');
            node = /** @type {Node} */(animation.channels[0]?.target.node);
        });

        it('linearly interpolates translation keyframes', () => {
            const animator = animation.createAnimator();

            animator.update(500);

            expect(node.translation?.[0]).to.be.closeTo(0.5, 1e-6);
            expect(node.translation?.[1]).to.be.closeTo(1, 1e-6);
            expect(node.translation?.[2]).to.be.closeTo(1.5, 1e-6);
        });

        it('clamps values to the final keyframe when not looping', () => {
            const animator = animation.createAnimator(false);

            animator.update(2000);

            expect(node.translation).to.deep.equal([1, 2, 3]);
        });

        it('clamps values to the first keyframe when time is before the animation start', () => {
            const animator = animation.createAnimator(false);
            node.translation = [9, 9, 9];

            animator.update(-500);

            expect(node.translation).to.deep.equal([0, 0, 0]);
        });

        it('loops values when time exceeds the animation duration', () => {
            const animator = animation.createAnimator(true);

            animator.update(1500);

            expect(node.translation?.[0]).to.be.closeTo(0.5, 1e-6);
            expect(node.translation?.[1]).to.be.closeTo(1, 1e-6);
            expect(node.translation?.[2]).to.be.closeTo(1.5, 1e-6);
        });

        describe('advanced animations', () => {
            /** @type {Animation} */
            let advancedAnimation;
            /** @type {Node} */
            let rotatingNode;
            /** @type {Node} */
            let steppedNode;
            /** @type {Node} */
            let morphNode;
            /** @type {Material} */
            let material;

            beforeEach(() => {
                advancedAnimation = findItem(gltf.animations, 'AdvancedAnim');

                rotatingNode = /** @type {Node} */(gltf.nodes.find(node => node.name === 'RotatingNode'));
                steppedNode  = /** @type {Node} */(gltf.nodes.find(node => node.name === 'SteppedNode'));
                morphNode    = /** @type {Node} */(gltf.nodes.find(node => node.name === 'MorphNode'));
                material     = /** @type {Material} */(gltf.materials?.[0]);
            });

            it('slerps quaternion rotation channels', () => {
                const animator = advancedAnimation.createAnimator();

                animator.update(500);

                expect(rotatingNode.rotation?.[0]).to.be.closeTo(0, 1e-6);
                expect(rotatingNode.rotation?.[2]).to.be.closeTo(0, 1e-6);
                expect(rotatingNode.rotation?.[1]).to.be.closeTo(Math.SQRT1_2, 1e-6);
                expect(rotatingNode.rotation?.[3]).to.be.closeTo(Math.SQRT1_2, 1e-6);
            });

            it('applies STEP interpolation without blending values', () => {
                const animator = advancedAnimation.createAnimator();

                animator.update(500);

                expect(steppedNode.scale).to.deep.equal([1, 2, 3]);
            });

            it('interpolates morph target weights using the node stride', () => {
                const animator = advancedAnimation.createAnimator();

                animator.update(500);

                expect(morphNode.weights?.[0]).to.be.closeTo(0.5, 1e-6);
                expect(morphNode.weights?.[1]).to.be.closeTo(0.25, 1e-6);
            });

            it('evaluates cubic spline translation channels', () => {
                const animator = advancedAnimation.createAnimator();

                animator.update(500);

                expect(rotatingNode.translation?.[0]).to.be.closeTo(1, 1e-6);
                expect(rotatingNode.translation?.[1]).to.be.closeTo(2, 1e-6);
                expect(rotatingNode.translation?.[2]).to.be.closeTo(3, 1e-6);
            });

            it('updates pointer targets with all normalized component types', () => {
                const animator = advancedAnimation.createAnimator();

                animator.update(500);

                const extras = material.extras ?? {};
                const color = material.pbrMetallicRoughness?.baseColorFactor;

                expect(extras.byteValue).to.be.closeTo(0, 1e-6);
                expect(extras.shortValue).to.be.closeTo(0, 1e-6);
                expect(extras.ushortValue).to.be.closeTo(0.5, 1e-6);
                expect(color).to.deep.equal([0.5, 0.5, 0.5, 1]);
            });

            it('clamps scalar pointer targets when time is before the animation', () => {
                const animator = advancedAnimation.createAnimator(false);

                animator.update(0, false);

                const extras = material.extras ?? {};
                const color = material.pbrMetallicRoughness?.baseColorFactor;

                expect(extras.byteValue).to.be.closeTo(-1, 1e-6);
                expect(extras.shortValue).to.be.closeTo(-1, 1e-6);
                expect(extras.ushortValue).to.be.closeTo(0, 1e-6);
                expect(color).to.deep.equal([0, 0, 0, 1]);
            });
        });

        it('normalizes cubic spline rotation quaternions', () => {
            const splineAnimation = findItem(gltf.animations, 'SplineRotationAnim');
            const rotatingNode = /** @type {Node} */(gltf.nodes.find(node => node.name === 'RotatingNode'));

            const animator = splineAnimation.createAnimator();

            animator.update(500);

            const rotation = rotatingNode.rotation ?? [];
            const magnitude = Math.hypot(rotation[0], rotation[1], rotation[2], rotation[3]);

            expect(magnitude).to.be.closeTo(1, 1e-6);
        });
    });
});
