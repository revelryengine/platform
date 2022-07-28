import { extensions   } from '../extensions.js';
import { GLTFProperty } from '../gltf-property.js';

/**
 * @see https://github.com/KhronosGroup/glTF/blob/397a9f7df4d2bd1b9303224da70961dcbdda2efa/extensions/2.0/Khronos/KHR_animation_pointer/README.md
 */

/**
 * KHR_animation_pointer target extension
 * @typedef {glTFProperty} khrAnimationPointerTarget
 * @property {String} pointer - JSON pointer of the object to target. The value of the path from animation.channel.target **must** be `pointer`.
 */

/**
 * A class wrapper for the material khrAnimationPointerTarget object.
 */
export class KHRAnimationPointerTarget extends GLTFProperty {
    /**
     * Creates an instance of KHRAnimationPointerTarget.
     * @param {khrAnimationPointerTarget} khrAnimationPointerTarget - The properties of the KHR_animation_pointer target extension.
     */
    constructor(khrAnimationPointerTarget) {
        super(khrAnimationPointerTarget);

        const { pointer } = khrAnimationPointerTarget;

        /**
         * @type {String|Object} JSON pointer of the object to target.
         */
        this.pointer = pointer;
    }

    static referenceFields = [
        { name: 'pointer', type: 'json' },
    ];
}

extensions.set('KHR_animation_pointer', {
    schema: {
        Target: KHRAnimationPointerTarget,
    },
});
