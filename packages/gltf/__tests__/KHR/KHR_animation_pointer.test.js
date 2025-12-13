import { describe, it, expect, beforeEach } from 'bdd';

import { GLTF                                      } from '../../gltf.js';
import { JSONPointer                               } from '../../gltf-property.js';
import { AnimationChannelTargetKHRAnimationPointer } from '../../KHR/KHR_animation_pointer.js';

const FIXTURE_URL = new URL('../__fixtures__/animation.gltf', import.meta.url);

describe('KHR_animation_pointer', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    /**
     * @param {string} animationName
     * @param {number} channelIndex
     */
    function getChannel(animationName, channelIndex) {
        const animation = gltf.animations.find(entry => entry.name === animationName);
        if(!animation) throw new Error(`Missing animation ${animationName} in fixture`);
        const channel = animation.channels.at(channelIndex);
        if(!channel) throw new Error(`Missing channel ${channelIndex} in ${animationName}`);
        return channel;
    }

    describe('AnimationChannelTargetKHRAnimationPointer', () => {
        it('resolves on AnimationChannelTarget extensions', () => {
            const channel = getChannel('AdvancedAnim', 4);
            const extension = channel.target.extensions?.KHR_animation_pointer;

            expect(extension).to.be.instanceOf(AnimationChannelTargetKHRAnimationPointer);
        });

        it('resolves referenceFields', () => {
            const advChannel = getChannel('AdvancedAnim', 4);
            const advPointer = advChannel.target.extensions?.KHR_animation_pointer?.pointer;

            expect(advPointer).to.be.instanceOf(JSONPointer);
            expect(advPointer?.collection).to.equal('/materials');
            expect(advPointer?.path).to.equal('byteValue');
            expect(advPointer?.rootTarget).to.equal(gltf.materials[0]);
            expect(advPointer?.target).to.equal(gltf.materials[0]?.extras);

            const initChannel = getChannel('InitializationAnim', 1);
            const initPointer = initChannel.target.extensions?.KHR_animation_pointer?.pointer;

            expect(initPointer).to.be.instanceOf(JSONPointer);
            expect(initPointer?.collection).to.equal('/nodes');
            expect(initPointer?.path).to.equal('weights');
            expect(initPointer?.rootTarget).to.equal(gltf.nodes[4]);
            expect(initPointer?.target).to.equal(gltf.nodes[4]);
        });
    });
});
