import { GLTFProperty } from './gltf-property.js';

/**
 * An orthographic camera containing properties to create an orthographic projection matrix.
 * @typedef {{
 *  xmag:        number,
 *  ymag:        number,
 *  zfar:        number,
 *  znear:       number,
 *  extensions?: Revelry.GLTF.Extensions.cameraOrthographic,
 * } & import('./gltf-property.js').glTFPropertyData} cameraOrthographic
 */

/**
 * An orthographic camera containing properties to create an orthographic projection matrix.
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-camera-orthographic
 */
export class CameraOrthographic extends GLTFProperty {
    /**
     * @param {{
     *  xmag:        number,
     *  ymag:        number,
     *  zfar:        number,
     *  znear:       number,
     *  extensions?: Revelry.GLTF.Extensions.CameraOrthographic,
     * } & import('./gltf-property.js').GLTFPropertyData} cameraOrthographic
     */
    constructor(cameraOrthographic) {
        super(cameraOrthographic);

        const { xmag, ymag, zfar, znear, extensions } = cameraOrthographic;

        /**
         * The floating-point horizontal magnification of the view.
         */
        this.xmag = xmag;

        /**
         * The floating-point vertical magnification of the view.
         */
        this.ymag = ymag;

        /**
         * The floating-point distance to the far clipping plane. zfar must be greater than znear.
         */
        this.zfar = zfar;

        /**
         * The floating-point distance to the near clipping plane.
         */
        this.znear = znear;

        this.extensions = extensions;
    }

    /**
     * Creates a CameraOrthographic instance from a JSON representation.
     * @param {cameraOrthographic} cameraOrthographic
     * @param {import('./gltf-property.js').FromJSONOptions} options
     * @override
     */
    static fromJSON(cameraOrthographic, options) {
        return new this(this.unmarshall(cameraOrthographic, options, {
        }, 'CameraOrthographic'));
    }
}
