/**
 * A camera's projection. A node can reference a camera to apply a transform to place the camera in the scene.
 *
 * [Reference Spec - Camera](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-camera)
 *
 * @module
 */

import { NamedGLTFProperty  } from './gltf-property.js';
import { CameraOrthographic } from './camera-orthographic.js';
import { CameraPerspective  } from './camera-perspective.js';
import { mat4               } from "revelryengine/deps/gl-matrix.js";

/**
 * @import { namedGLTFPropertyData, NamedGLTFPropertyData, FromJSONGraph } from './gltf-property.js';
 * @import { cameraExtensions, CameraExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @import { cameraOrthographic } from './camera-orthographic.js';
 * @import { cameraPerspective  } from './camera-perspective.js';
 */

/**
 * @typedef {object} camera - Camera JSON representation.
 * @property {'orthographic'|'perspective'} type - Specifies if the camera uses a perspective or orthographic projection.
 * @property {cameraOrthographic} [orthographic] - An orthographic camera containing properties to create an orthographic projection matrix.
 * @property {cameraPerspective} [perspective] - A perspective camera containing properties to create a perspective projection matrix.
 * @property {cameraExtensions} [extensions] - Extension-specific data.
 */

/**
 * @typedef {object} HasOrthographiCameraDetails - Predicate for cameras with perspective details.
 * @property {cameraOrthographic} orthographic - The type of the camera.
 *
 * @typedef {object} HasPerspectiveCameraDetails - Predicate for cameras with perspective details.
 * @property {cameraPerspective} perspective - The type of the camera.
 */

/**
 * Camera class representation.
 */
export class Camera extends NamedGLTFProperty {
    /**
     * Creates an instance of Camera.
     * @param {({
     *  type:          'orthographic'|'perspective',
     *  orthographic?: CameraOrthographic,
     *  perspective?:  CameraPerspective,
     *  extensions?:   CameraExtensions,
     * }) & NamedGLTFPropertyData} unmarshalled - Unmarshalled camera object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { type, extensions } = unmarshalled;

        /**
         * Specifies if the camera uses a perspective or orthographic projection.
         * interpolation algorithm to define a keyframe graph (but not its target).
         */
        this.type = type;

        /**
         * An orthographic camera containing properties to create an orthographic
         * projection matrix.
         */
        this.orthographic = unmarshalled.orthographic;

        /**
         * A perspective camera containing properties to create a perspective
         * projection matrix.
         */
        this.perspective = unmarshalled.perspective;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {camera & namedGLTFPropertyData} camera - The camera JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(camera, graph) {
        return this.unmarshall(graph, camera, {
            orthographic: { factory: CameraOrthographic },
            perspective:  { factory: CameraPerspective  },
        }, this);
    }

    /**
     * Checks if the camera is a perspective camera.
     * @return {this is HasPerspectiveCameraDetails}
     */
    isPerspective() {
        return this.type === 'perspective';
    }

    /**
     * Checks if the camera is an orthographic camera.
     * @return {this is HasOrthographiCameraDetails}
     */
    isOrthographic() {
        return this.type === 'orthographic';
    }

    /**
     * Gets the aspect ratio of the camera.
     */
    getAspectRatio() {
        if(this.isPerspective()) {
            return this.perspective.aspectRatio;
        } else if(this.isOrthographic()) {
            return this.orthographic.xmag / this.orthographic.ymag;
        }
    }

    /**
     * Sets the aspect ratio of the camera.
     * @param {number} aspectRatio - The new aspect ratio.
     */
    setAspectRatio(aspectRatio) {
        if(this.isPerspective()) {
            this.perspective.aspectRatio = aspectRatio;
        } else if(this.isOrthographic()) {
            this.orthographic.xmag = this.orthographic.ymag * aspectRatio;
        }
    }

    /**
     * Gets the details of the camera.
     */
    getDetails() {
        if(this.isPerspective()) {
            return this.perspective;
        } else if(this.isOrthographic()) {
            return this.orthographic;
        }
        throw new Error('Invalid Camera');
    }

    /**
     * Gets the vertical field of view of the camera.
     */
    getYFov() {
        if(this.isPerspective()) {
            return this.perspective.yfov;
        } else if(this.isOrthographic()) {
            return this.orthographic.ymag;
        }
        throw new Error('Invalid Camera');
    }
    /**
     * Gets the projection matrix for this camera
     * @param {{
     *   width?: number,
     *   height?: number,
     *   ndcZO?: boolean,
     *   override?: Partial<cameraOrthographic | cameraPerspective>
     * }} options - Options for generating the projection matrix.
     */
    getProjectionMatrix({ width = 1, height = 1, ndcZO, override = {} }) {
        const matrix = mat4.create();

        if (this.isPerspective()) {
            const { aspectRatio = width / height, yfov, znear, zfar } = { ...this.perspective, ...override };
            (ndcZO ? mat4.perspectiveZO : mat4.perspectiveNO)(matrix, yfov, aspectRatio, znear, zfar ?? Infinity);
        } else if(this.isOrthographic()) {
            const { xmag, ymag, znear, zfar } = { ...this.orthographic, ...override };
            (ndcZO ? mat4.orthoZO : mat4.orthoNO)(matrix, -xmag, xmag, -ymag, ymag, znear, zfar);
        }

        return matrix;
    }
}
