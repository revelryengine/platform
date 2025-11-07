/// <reference path="./lib.revelry.d.ts" />

import { Model, System } from '../deps/ecs.js';

import { vec3, quat, mat4, glMatrix } from '../deps/gl-matrix.js';

import { rad2Deg } from '../deps/utils.js';

import { QUATERNION, EULER_XYZ, EULER_XZY, EULER_YXZ, EULER_YZX, EULER_ZXY, EULER_ZYX, AXIS_ANGLE, EULER_ANGLE_ORDERS, EULER_ROTATION_MODES } from './constants.js';

/**
 * @import { ComponentTypes, ComponentTypeSchema, ComponentTypeFromSchema, SystemBundle } from '../deps/ecs.js';
 */


const { abs, asin, atan2 } = Math;

const _matrix  = mat4.create();
const _getQuat = quat.create();
const _setQuat = quat.create();

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}

/**
 * @param {number} v
 */
function towardsZero(v) {
    return v >= 0 ? Math.floor(v) : Math.ceil(v);
}

const TWO_PI = Math.PI * 2;
const EPSILON = 1 - glMatrix.EPSILON;


/**
 * @typedef {'xyz'|'xzy'|'yxz'|'yzx'|'zxy'|'zyx'} EULER_ORDER
 */

/**
 * @typedef {QUATERNION|EULER_XYZ|EULER_XZY|EULER_YXZ|EULER_YZX|EULER_ZXY|EULER_ZYX|AXIS_ANGLE} ROTATION_MODE
 */

/**
  * ported from https://github.com/mrdoob/three.js/blob/560c5fcba722d9b37884a6925895d64195cd675e/src/math/Euler.js
  *
  * @param {quat} out
  * @param {quat} q
  */
function getEulerFromQuat(out, q, order = 'zyx') {
    const matrix = mat4.fromQuat(_matrix, q);

    const m11 = matrix[0], m12 = matrix[4], m13 = matrix[8];
    const m21 = matrix[1], m22 = matrix[5], m23 = matrix[9];
    const m31 = matrix[2], m32 = matrix[6], m33 = matrix[10];

    switch (order) {
        case 'xyz':
            out[1] = asin(clamp(m13, -1, 1));

            if (abs(m13) < EPSILON) {
                out[0] = atan2(-m23, m33);
                out[2] = atan2(-m12, m11);
            } else {
                out[0] = atan2(m32, m22);
                out[2] = 0;
            }

            break;
        case 'xzy':
            out[2] = asin(-clamp(m12, -1, 1));

            if (abs(m12) < EPSILON) {
                out[0] = atan2(m32, m22);
                out[1] = atan2(m13, m11);
            } else {
                out[0] = atan2(-m23, m33);
                out[1] = 0;
            }

            break;
        case 'yxz':
            out[0] = asin(-clamp(m23, -1, 1));

            if (abs(m23) < EPSILON) {
                out[1] = atan2(m13, m33);
                out[2] = atan2(m21, m22);
            } else {
                out[1] = atan2(-m31, m11);
                out[2] = 0;
            }



            break;
        case 'yzx':
            out[2] = asin(clamp(m21, -1, 1));

            if (abs(m21) < EPSILON) {
                out[0] = atan2(-m23, m22);
                out[1] = atan2(-m31, m11);
            } else {
                out[0] = 0;
                out[1] = atan2(m13, m33);
            }

            break;
        case 'zxy':
            out[0] = asin(clamp(m32, -1, 1));

            if (abs(m32) < EPSILON) {
                out[1] = atan2(-m31, m33);
                out[2] = atan2(-m12, m22);
            } else {
                out[1] = 0;
                out[2] = atan2(m21, m11);
            }

            break;
        case 'zyx':
            out[1] = asin(-clamp(m31, -1, 1));

            if (abs(m31) < EPSILON) {
                out[0] = atan2(m32, m33);
                out[2] = atan2(m21, m11);
            } else {
                out[0] = 0;
                out[2] = atan2(-m12, m22);
            }

            break;
    }

    out[0] = rad2Deg(out[0]);
    out[1] = rad2Deg(out[1]);
    out[2] = rad2Deg(out[2]);

    return out;
}

/**
 * @typedef {ComponentTypeFromSchema<TransformSchema>} Transform
 */

export const TransformUtils = {
    /**
     * @param {Transform} transform
     * @param {{ translation?: vec3, rotation?: quat, scale?: vec3, rotationMode?: ROTATION_MODE }} value
     */
    setTransform(transform, { translation, rotation, scale, rotationMode }) {
        translation && this.setTranslation(transform, translation);
        rotation    && this.setRotation(transform, rotation);
        scale       && this.setScale(transform, scale);
        rotationMode !== undefined && (transform.rotationMode = rotationMode);
    },
    /**
     * Get the translation
     * @param {Transform} transform
     * @param {vec3} [out]
     */
    getTranslation(transform, out = vec3.create()) {
        return vec3.copy(out, transform.translation);
    },

    /**
     * Get the rotation as quaternion.
     * @param {Transform} transform
     * @param {vec3} translation
     */
    setTranslation(transform, translation) {
        vec3.copy(transform.translation, translation);
    },

    /**
     * Get the scale
     * @param {Transform} transform
     * @param {vec3} [out]
     */
    getScale(transform, out = vec3.create()) {
        return vec3.copy(out, transform.scale);
    },

    /**
     * Get the rotation as quaternion.
     * @param {Transform} transform
     * @param {vec3} scale
     */
    setScale(transform, scale) {
        vec3.copy(transform.scale, scale);
    },

    /**
     * Get the rotation as quaternion.
     * @param {Transform} transform
     * @param {quat} [out]
     */
    getRotation(transform, out = quat.create()) {
        switch(transform.rotationMode) {
            case QUATERNION:
                return transform.rotation;
            case AXIS_ANGLE:
                return quat.setAxisAngle(out, transform.rotation, transform.rotation[3]);
            default:
                return quat.fromEuler(out, transform.rotation[0], transform.rotation[1], transform.rotation[2], /** @type {any} ignore this warning */(EULER_ANGLE_ORDERS[transform.rotationMode]));
        }
    },

    /**
     * Set the rotation from a quaternion.
     * @param {Transform} transform
     * @param {quat} q
     */
    setRotation(transform, q) {
        quat.copy(transform.rotation, q);
        transform.rotationMode = QUATERNION;
    },

    /**
     * Get the rotation in euler angles.
     * @param {Transform} transform
     * @param {vec3} [out]
     */
    getEuler(transform, out = vec3.create()) {
        switch(transform.rotationMode) {
            case QUATERNION:
                return getEulerFromQuat(out, transform.rotation, 'zyx');
            case AXIS_ANGLE:
                return getEulerFromQuat(out, quat.setAxisAngle(_setQuat, transform.rotation, transform.rotation[3]), 'zyx');
            default:
                return transform.rotation;
        }
    },

    /**
     * Set the rotation as euler angles
     * @param {Transform} transform
     * @param {vec3} euler
     * @param {EULER_ORDER} order
     */
    setEuler(transform, euler, order = 'zyx') {
        vec3.copy(transform.rotation, euler);
        transform.rotationMode = EULER_ROTATION_MODES[order];
    },

    /**
    * @param {Transform} transform
    * @param {vec3} [out]
    */
    getAxisAngle(transform, out = vec3.create()) {
        switch(transform.rotationMode) {
            case QUATERNION:
                return quat.getAxisAngle(out, transform.rotation);;
            case AXIS_ANGLE:
                vec3.copy(out, transform.rotation);
                return transform.rotation[3];
            default:
                quat.fromEuler(_getQuat, transform.rotation[0], transform.rotation[1], transform.rotation[2], /** @type {any} ignore this warning */(EULER_ANGLE_ORDERS[transform.rotationMode]))
                return quat.getAxisAngle(out, _getQuat);
        }
    },

    /**
     * @param {Transform} transform
     * @param {vec3} axis
     * @param {number} angle
     */
    setAxisAngle(transform, axis, angle) {
        vec3.copy(transform.rotation, axis);
        transform.rotation[3] = angle;
        transform.rotationMode = AXIS_ANGLE;
        return transform;

    },

    /**
     * Change the rotation mode
     * @param {Transform} transform
     * @param {ROTATION_MODE} mode
     */
    changeRotationMode(transform, mode) {
        const quat = this.getRotation(transform, _setQuat);
        transform.rotation[3] = 1;
        transform.rotationMode = mode;
        this.setRotationFromQuat(transform, quat);
    },

    /**
     * Sets the rotation from a quat while maintining the current rotation mode.
     * @param {Transform} transform
     * @param {quat} q
     */
    setRotationFromQuat(transform, q) {
        switch(transform.rotationMode) {
            case QUATERNION:
                return quat.copy(transform.rotation, q);
            case AXIS_ANGLE:
                return transform.rotation[3] = quat.getAxisAngle(transform.rotation, q);
            default:
                return getEulerFromQuat(transform.rotation, q, EULER_ANGLE_ORDERS[transform.rotationMode]);
        }
    },

    /**
     * Sets the rotation from an axis angle while maintining the current rotation mode.
     * @param {Transform} transform
     * @param {vec3} axis
     * @param {number} angle
     */
    setRotationFromAxisAngle(transform, axis, angle) {
        this.setRotationFromQuat(transform, quat.setAxisAngle(_setQuat, axis, angle));
    },

    /**
     * Sets the rotation from euler angles while maintining the current rotation mode.
     * @param {Transform} transform
     * @param {vec3} euler
     * @param {EULER_ORDER} [order]
     */
    setRotationFromEuler(transform, euler, order = 'zyx') {
        this.setRotationFromQuat(transform, quat.fromEuler(_setQuat, euler[0], euler[1], euler[2], /** @type {any} ignore this warning */(order)));
    },

    /**
     * Apply spherical linear interpolation to rotation
     *
     * @param {Transform} transform
     * @param {quat} origin
     * @param {quat} destination
     * @param {number} t
     */
    slerp(transform, origin, destination, t) {
        this.setRotationFromQuat(transform, quat.slerp(_setQuat, origin, destination, t));
    },

    /**
     * Apply linear interpolation to translation
     *
     * @param {Transform} transform
     * @param {vec3} origin
     * @param {vec3} destination
     * @param {number} t
     */
    lerp(transform, origin, destination, t) {
        vec3.lerp(transform.translation, origin, destination, t);
    },

    /**
     * Apply linear interpolation to scale
     *
     * @param {Transform} transform
     * @param {vec3} origin
     * @param {vec3} destination
     * @param {number} t
     */
    lerpScale(transform, origin, destination, t) {
        vec3.lerp(transform.scale, origin, destination, t);
    },


    /**
     * Translate the transform
     * @param {Transform} transform
     * @param {vec3} translation
     */
    translate(transform, translation) {
        vec3.add(transform.translation, transform.translation, translation);
    },

    /**
     * Scale the transform
     * @param {Transform} transform
     * @param {vec3} scale
     */
    scale(transform, scale) {
        vec3.multiply(transform.scale, transform.scale, scale);
    },

    /**
     * Rotate the transform by a quaternion
     * @param {Transform} transform
     * @param {quat} q
     */
    rotate(transform, q){
        this.setRotationFromQuat(transform, quat.multiply(_setQuat, q, this.getRotation(transform)));
    },

    /**
     * Rotate the transform by a euler angles
     * @param {Transform} transform
     * @param {vec3} euler
     */
    rotateEuler(transform, euler) {
        this.setRotationFromQuat(transform, quat.multiply(_setQuat, quat.fromEuler(_setQuat, euler[0], euler[1], euler[2], /** @type {any} ignore this warning */(EULER_ANGLE_ORDERS[transform.rotationMode])), this.getRotation(transform)));
    },

    /**
     * Rotate the transform by an axis angle
     *
     * @overload
     * @param {Transform} transform
     * @param {vec3} axis
     * @param {number} angle
     * @return {void}
     *
     * @overload
     * @param {Transform} transform
     * @param {vec4} axisAngle
     * @return {void}
     *
     * @param {Transform} transform
     * @param {vec3|vec4} axis
     * @param {number} [angle]
     */
    rotateAxisAngle(transform, axis, angle = axis[3] ?? 0) {

        /**
         * @todo If the stored rotation is in euler format, attempt to maintain the correct signedness and revolution count.
         * None of the below comment really works, I was just experimenting and trying to reason about the math
         */

        // const isFriendlyAngle = Number.isInteger(rad2Deg(a[3]) * 100);

        // console.log(rad2Deg(a[3]), isFriendlyAngle)

        // if(this.rotationMode >= Transform.EULER_XYZ && this.rotationMode <= Transform.EULER_ZYX) { //single axis rotation in euler mode

        //     const destination = quat.multiply(_setQuat, quat.setAxisAngle(_setQuat, a, 0.01), this.#getRotationAsQuat());
        //     const euler = Transform.getEulerFromQuat(vec3.create(), quat.setAxisAngle(_setQuat, a, 0.01), this.eulerOrder);
        //     const delta = vec3.sub(vec3.create(), euler, this.#rotation);

        //     console.log(...this.#rotation, '|', ...euler, '|', ...delta)
        //     vec3.scale(delta, delta, a[3] / 0.01);
        //     console.log(...delta)
        //     vec3.add(this.#rotation, this.#rotation, delta);


            // vec3.add(this.#rotation, this.#rotation, euler);
            // if(a[0] === 1) {
            //     this.#rotation[0] += deg;
            // } else if (a[1] === 1) {
            //     this.#rotation[1] += deg;
            // } else {
            //     this.#rotation[2] += deg;
            // }


            // const euler = Transform.getEulerFromQuat(_setEuler, destination, this.eulerOrder);

            // // console.log('before', a, [...euler], [...this.#rotation]);

            // //half revolutions that should be caused by axis angle rotation
            // const rx = towardsZero(a[0] * a[3] / Math.PI);
            // const ry = towardsZero(a[1] * a[3] / Math.PI);
            // const rz = towardsZero(a[2] * a[3] / Math.PI);

            // //original revolutions
            // const ox = towardsZero(this.#rotation[0] / 360);
            // const oy = towardsZero(this.#rotation[1] / 360);
            // const oz = towardsZero(this.#rotation[2] / 360);

            // console.log(a, rx, ry, rz, ox, oy, oz);

            // euler[0] += (rx + ox) * 360;
            // euler[1] += (ry + oy) * 360;
            // euler[2] += (rz + oz) * 360;

            // if(a[3] > 0) {
            //     euler[0] += 360 * Math.ceil((((a[0] * a[3]) % TWO_PI) / TWO_PI));
            //     euler[1] += 360 * Math.ceil((((a[1] * a[3]) % TWO_PI) / TWO_PI));
            //     euler[2] += 360 * Math.ceil((((a[2] * a[3]) % TWO_PI) / TWO_PI));
            // } else {
            //     euler[0] -= 360 * Math.ceil((((a[0] * a[3]) % TWO_PI) / TWO_PI));
            //     euler[1] -= 360 * Math.ceil((((a[1] * a[3]) % TWO_PI) / TWO_PI));
            //     euler[2] -= 360 * Math.ceil((((a[2] * a[3]) % TWO_PI) / TWO_PI));
            // }

            // console.log('after', a, [...euler], [...this.#rotation]);

            // this.#rotation.set(euler);
        // } else {
            this.setRotationFromQuat(transform, quat.multiply(_setQuat, quat.setAxisAngle(_setQuat, axis, angle), this.getRotation(transform)));
        // }
    },

    create() {
        return { translation: vec3.create(), rotation: quat.create(), scale: vec3.fromValues(1, 1, 1), rotationMode: QUATERNION };
    },

    /**
     * @param {Transform} transform
     * @return {Transform}
     */
    clone(transform) {
        return {
            translation:  structuredClone(transform.translation),
            rotation:     structuredClone(transform.rotation),
            scale:        structuredClone(transform.scale),
            rotationMode: transform.rotationMode
        };
    }
}

export const TransformSchema = /** @type {const} @satisfies {ComponentTypeSchema}*/({
    type: 'object',
    properties: {
        translation:  { type: 'array',  default: [0, 0, 0],    items: [{ type: 'number' }, { type: 'number' }, { type: 'number' }] },
        rotation:     { type: 'array',  default: [0, 0, 0, 1], items: [{ type: 'number' }, { type: 'number' }, { type: 'number' }, { type: 'number' }] },
        scale:        { type: 'array',  default: [1, 1, 1],    items: [{ type: 'number' }, { type: 'number' }, { type: 'number' }] },
        rotationMode: { type: 'number', default: QUATERNION,   enum: [QUATERNION, EULER_XYZ, EULER_XZY, EULER_YXZ, EULER_YZX, EULER_ZXY, EULER_ZYX, AXIS_ANGLE] }
    },
    default: {},
    observed: ['translation', 'rotation', 'scale', 'rotationMode']
});

export class TransformModel extends Model.Typed({
    components: ['transform'],
}) { }


export class TransformSystem extends System.Typed({
    id: 'transform',
    models: {
        transforms: { model: TransformModel, isSet: true },
    }
}) {

    get utils() { return TransformUtils };
}

/** @satisfies {SystemBundle} */
export const bundle = {
    systems: [TransformSystem],
    schemas: { transform: TransformSchema }
}
