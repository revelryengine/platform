/**
 * An orthographic camera containing properties to create an orthographic projection matrix.
 *
 * [Reference Spec - Camera Orthographic](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-camera-orthographic)
 *
 * @module
 */

import { GLTFProperty } from './gltf-property.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, FromJSONGraph } from './gltf-property.js';
 * @import { cameraOrthographicExtensions, CameraOrthographicExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @typedef {object} cameraOrthographic - CameraOrthographic JSON representation.
 * @property {number} xmag - The floating-point horizontal magnification of the view.
 * @property {number} ymag - The floating-point vertical magnification of the view.
 * @property {number} zfar - The floating-point distance to the far clipping plane. zfar must be greater than znear.
 * @property {number} znear - The floating-point distance to the near clipping plane.
 * @property {cameraOrthographicExtensions} [extensions] - Extension-specific data.
 */

/**
 * CameraOrthographic class representation.
 */
export class CameraOrthographic extends GLTFProperty {
    /**
     * Creates a new instance of CameraOrthographic.
     * @param {{
     *  xmag:        number,
     *  ymag:        number,
     *  zfar:        number,
     *  znear:       number,
     *  extensions?: CameraOrthographicExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled camera orthographic object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { xmag, ymag, zfar, znear, extensions } = unmarshalled;

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

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {cameraOrthographic & glTFPropertyData} cameraOrthographic - The camera orthographic JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(cameraOrthographic, graph) {
        return this.unmarshall(graph, cameraOrthographic, {
            // No reference fields
        }, this);
    }
}
