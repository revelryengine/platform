import { GLTFProperty } from './gltf-property.js';

/**
 * @typedef {{
 *  yfov:         number,
 *  znear:        number,
 *  zfar?:        number,
 *  aspectRatio?: number,
 *  extensions?:  Revelry.GLTF.Extensions.cameraPerspective,
 * } & import('./gltf-property.js').glTFPropertyData} cameraPerspective
 */

/**
 * A perspective camera containing properties to create a perspective projection matrix.
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-camera-perspective
 */
export class CameraPerspective extends GLTFProperty {
    /**
     * @param {{
     *  yfov:         number,
     *  znear:        number,
     *  zfar?:        number,
     *  aspectRatio?: number,
     *  extensions?:  Revelry.GLTF.Extensions.CameraPerspective,
     * } & import('./gltf-property.js').GLTFPropertyData} cameraPerspective
     */
    constructor(cameraPerspective) {
        super(cameraPerspective);

        const { yfov, znear, zfar, aspectRatio, extensions } = cameraPerspective;

        /**
         * The floating-point vertical field of view in radians.
         */
        this.yfov = yfov;

        /**
         * The floating-point distance to the near clipping plane.
         */
        this.znear = znear;

        /**
         * The floating-point distance to the far clipping plane. zfar must be greater than znear.
         */
        this.zfar = zfar;

        /**
         * The floating-point aspect ratio of the field of view.
         */
        this.aspectRatio = aspectRatio;

        this.extensions = extensions;
    }

    /**
     * @param {cameraPerspective} cameraPerspective
     * @param {import('./gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(cameraPerspective, options) {
        return new this(this.unmarshall(cameraPerspective, options, {
        }, 'CameraPerspective'));
    }
}
