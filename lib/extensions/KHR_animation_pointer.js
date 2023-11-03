import { GLTFProperty } from '../gltf-property.js';
import { extensions   } from '../extensions.js';

/**
 * @typedef {{
 *  pointer: string,
 *  extensions?: Revelry.GLTF.Extensions.khrAnimationPointerTarget,
 * } & import('../gltf-property.js').glTFPropertyData} khrAnimationPointerTarget
 */

/**
 *
 * @see https://github.com/KhronosGroup/glTF/blob/397a9f7df4d2bd1b9303224da70961dcbdda2efa/extensions/2.0/Khronos/KHR_animation_pointer/README.md
 */
export class KHRAnimationPointerTarget extends GLTFProperty {

    /**
     * @param {{
     *  resolve: () => { root: { collection: string, target: unknown }, target: Record<string, number|number[]>, path: string },
     *  extensions?: Revelry.GLTF.Extensions.KHRAnimationPointerTarget,
     * } & import('../gltf-property.js').GLTFPropertyData} khrAnimationPointerTarget
     */
    constructor(khrAnimationPointerTarget) {
        super(khrAnimationPointerTarget);

        const { resolve, extensions } = khrAnimationPointerTarget;

        /**
         * Resolves the target and path
         */
        this.resolve = resolve;

        this.extensions = extensions;
    }

    /**
     * @param {khrAnimationPointerTarget} khrAnimationPointerTarget
     * @param {import('../gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(khrAnimationPointerTarget, options) {
        return new this({
            ...this.unmarshall(khrAnimationPointerTarget, options, {}, 'KHRAnimationPointerTarget'),
            resolve: this.unmarshallJSONPointerResolver(khrAnimationPointerTarget.pointer, options.root),
        });
    }
}

extensions.add('KHR_animation_pointer', {
    schema: {
        AnimationChannelTarget: KHRAnimationPointerTarget,
    },
});
