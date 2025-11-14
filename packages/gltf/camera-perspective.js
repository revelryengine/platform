/**
 * A perspective camera containing properties to create a perspective projection matrix.
 *
 * [Reference Spec - Camera Perspective](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-camera-perspective)
 *
 * @module
 */

import { GLTFProperty } from './gltf-property.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, FromJSONGraph } from './gltf-property.js';
 * @import { cameraPerspectiveExtensions, CameraPerspectiveExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @typedef {object} cameraPerspective - CameraPerspective JSON representation.
 * @property {number} yfov - The floating-point vertical field of view in radians.
 * @property {number} znear - The floating-point distance to the near clipping plane.
 * @property {number} [zfar] - The floating-point distance to the far clipping plane. zfar must be greater than znear.
 * @property {number} [aspectRatio] - The floating-point aspect ratio of the field of view.
 * @property {cameraPerspectiveExtensions} [extensions] - Extension-specific data.
 */

/**
 * CameraPerspective class representation.
 */
export class CameraPerspective extends GLTFProperty {
    /**
     * Creates an instance of CameraPerspective.
     * @param {{
     *  yfov:         number,
     *  znear:        number,
     *  zfar?:        number,
     *  aspectRatio?: number,
     *  extensions?:  CameraPerspectiveExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled camera perspective object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { yfov, znear, zfar, aspectRatio, extensions } = unmarshalled;

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

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {cameraPerspective & glTFPropertyData} cameraPerspective - The camera perspective JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(cameraPerspective, graph) {
        return this.unmarshall(graph, cameraPerspective, {
            // No reference fields
        }, this);
    }
}
