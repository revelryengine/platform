import { System    } from 'revelryengine/ecs/lib/system.js';
import { Model     } from 'revelryengine/ecs/lib/model.js';
import { Watchable } from 'revelryengine/ecs/lib/utils/watchable.js';

import { vec3, vec4, quat, mat4, glMatrix } from 'gl-matrix';

import { rad2Deg, deg2Rad, diffDeg } from './utils/angles.js';

const { abs, asin, atan2 } = Math;

const _matrix       = mat4.create();

const _getScale       = vec3.create();
const _getQuat        = quat.create();
const _getEuler       = vec3.create();


const _setTranslation = vec3.create();
const _setScale       = vec3.create();
const _setQuat        = quat.create();
const _setEuler       = vec3.create();

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
 * @typedef {Transform.QUATERNION|Transform.EULER_XYZ|Transform.EULER_XZY|Transform.EULER_YXZ|Transform.EULER_YZX|Transform.EULER_ZXY|Transform.EULER_ZYX|Transform.AXIS_ANGLE} ROTATION_MODE
 */
/**
 * @typedef {{  
 *     transform: { value: Transform, json: { translation: vec3, rotation: quat, scale: vec3, mode: ROTATION_MODE } },
 * }} ComponentTypes
 */

const types = /** @type {ComponentTypes} */({});
const TypedModel  = Model.Typed(types);
const TypedSystem = System.Typed(types);

/**
 * @template {any} I
 * @param {I} input
 * @return {input is ArrayLike<number>}
 */
function isArrayLikeNumber(input) {
    return Array.isArray(input) && input.every(item => typeof item === 'number');
}

/**
 * A Transform is similar to a standard transformation matrix excepts it maintains additional values that contain the original translation, rotation, and scale used to generate the matrix.
 * This is useful for stablizing values when rotating/scaling programatically or via an editor as signs and floating point values can fluxuate when converting to and from the matrix. 
 * In addition, quaternions lose information about rotation direction when rotating fully around so it can be useful to chose other rotation modes and retain these values.
 * 
 * You may be asking, why bother with all this? Well editors and artist facing tools typically use Euler angles because it is easier to visualize. 
 * The underlying engines will convert these values to quaternions before performing complex math as they are better suited for the task. 
 * However, this conversion leads to a potential loss of artistic information.
 * 
 * @see https://github.com/KhronosGroup/glTF/issues/1515 for reference to a detailed discussion about this topic.
 * 
 */
export class Transform extends Watchable.mixin(Float32Array, /**  @type {{ change: void }} */({})) {
    #matrix;
    #translation;
    #rotation;
    #scale;
    #mode;

    /**
     * @param {ComponentTypes['transform']['value'] | ComponentTypes['transform']['json']} [value]
     */
    constructor(value) {
        super(Transform.IDENTITY);

        this.#matrix      = /** @type {Float32Array & mat4} */(new Float32Array(this.buffer, 0, 16));
        this.#translation = /** @type {Float32Array & vec3} */(new Float32Array(this.buffer, 16 * 4, 3));
        this.#rotation    = /** @type {Float32Array & quat} */(new Float32Array(this.buffer, 19 * 4, 4));
        this.#scale       = /** @type {Float32Array & vec3} */(new Float32Array(this.buffer, 23 * 4, 3));
        this.#mode        = new Float32Array(this.buffer, 26 * 4, 1);
    
        this.set(value ?? []);
    }

    /**
     * @param {ComponentTypes['transform']['value'] | ComponentTypes['transform']['json'] | ArrayLike<number>} value
     */
    set(value) {
        if(isArrayLikeNumber(value)) {
            super.set(value);
        } else {
            const { translation, rotation, scale, mode } = value;

            translation && this.#translation.set(translation);
            rotation    && this.#rotation.set(rotation);
            scale       && this.#scale.set(scale);

            if(mode !== undefined) this.#rotationMode = mode;

            this.#applyTRS();
        }
        this.notify('change');
    }

    
    /**
     * The local rotation mode
     */
    get rotationMode() {
        return this.#rotationMode;
    }

    /** 
     * The euler order for local rotations
     * @type {EULER_ORDER}
     */
    get eulerOrder() {
        return Transform.#EULER_ANGLE_ORDERS[this.#rotationMode] ?? 'zyx';
    }

    /**
     * @type {ROTATION_MODE}
     */
    get #rotationMode() {
        return  /** @type {ROTATION_MODE} */(this.#mode[0]);
    }

    /**
     * @param {ROTATION_MODE} mode
     */
    set #rotationMode(mode) {
        this.#mode[0] = mode;
    }

    /**
     * Get the world transform matrix
     */
    getWorldTransform(out = mat4.create()) {
        return mat4.copy(out, this.#matrix);
    }

    /**
     * Get the local translation
     */
    getTranslation(out = vec3.create()) {
        return vec3.copy(out, this.#translation);;
    }

    /**
     * Set the local translation
     * 
     * @param {ArrayLike<number>} translation
     */
    setTranslation(translation) {
        this.#translation.set(translation);
        this.#applyTRS();
        this.notify('change');
    }

    /**
     * Get the world translation
     */
    getWorldTranslation(out = vec3.create()) {
        mat4.getTranslation(out, this);
        return out;
    }

    /**
     * Set the world translation by updating the local translation relative to the parent (if any).
     * @param {vec3} translation
     */
    setWorldTranslation(translation) {
        if(this.#parent) {
            const parent = mat4.invert(_matrix, this.#parent);
            this.setTranslation(vec3.transformMat4(_setTranslation, translation, parent));
        } else {
            this.setTranslation(translation);
        }
    }

    /**
     * Translate the transform
     * @param {vec3} translation
     */
    translate(translation) {
        vec3.add(this.#translation, this.#translation, translation);
        this.#applyTRS();
        this.notify('change');
    }

    /**
     * Get the local scale
     */
    getScale(out = vec3.create()) {
        return vec3.copy(out, this.#scale);
    }

    /**
     * Set the local scale
     * @param {vec3} scale
     */
    setScale(scale) {
        this.#scale.set(scale)
        this.#applyTRS();
        this.notify('change');
    }

    /**
     * Get the world scale
     */
    getWorldScale(out = vec3.create()) {
        mat4.getScaling(out, this);
        return out;
    }

    /**
     * Set the world scale by setting the local scale relative to the parent (if any).
     * @param {vec3} scale
     */
    setWorldScale(scale) {
        if(this.#parent) {
            const parent = this.#parent.getWorldScale(_getScale);
            this.setScale(vec3.divide(_setScale, scale, parent));
        } else {
            this.setScale(scale);
        }
    }

    /**
     * Scale the transform
     * 
     * @param {vec3} scale
     */
    scale(scale) {
        vec3.multiply(this.#scale, this.#scale, scale);
        this.#applyTRS();
        this.notify('change');
    }

    /**
     * Get the local rotation as a quaternion.
     */
    getRotation(out = quat.create()) {
        return quat.copy(out, this.#getRotationAsQuat());
    }

    /**
     * Set the local rotation from a quaternion.
     * @param {quat} quaternion
     */
    setRotation(quaternion) {
        this.#rotation.set(quaternion);
        this.#rotationMode = Transform.QUATERNION;
        this.#applyTRS();
        this.notify('change');
    }

    /**
     * Get the world rotation as a quaternion
     */
    getWorldRotation(out = quat.create()) {
        mat4.getRotation(out, this);
        return out;
    }

    /**
     * Set the local rotation from a quaternion.
     * @param {quat} quaternion
     */
    setWorldRotation(quaternion) {
        if(this.#parent) {
            const parent = this.#parent.getWorldRotation(_getQuat);
            this.setRotation(quat.multiply(_setQuat, quaternion, quat.invert(_getQuat, parent)));
        } else {
            this.setRotation(quaternion);
        }
    }

    /**
     * Rotate the transform by a quaternion
     * @param {quat} quaternion
     */
    rotate(quaternion){
        this.#setRotationFromQuat(quat.multiply(_setQuat, quaternion, this.#getRotationAsQuat()));
        this.#applyTRS();
        this.notify('change');
    }
    
    /**
     * Get the local rotation as euler angles. 
     * Result should match the input if orignally set using transform.setEuler. 
     * Use transform.eulerAngle to check order
     */
    getEuler(out = vec3.create()) {
        return vec3.copy(out, this.#getRotationAsEuler());
    }

    /**
     * Set the local rotation as euler angles
     * @param {vec3} euler
     * @param {EULER_ORDER} order
     */
    setEuler(euler, order = 'zyx') {
        this.#rotation.set(euler);
        this.#rotationMode = Transform.#EULER_ROTATION_MODES[order];
        this.#applyTRS();
        this.notify('change');
    }

    /**
     * Get the world rotation as euler angles in specified order
     */
    getWorldEuler(out = vec3.create(), order = 'zyx') {
        mat4.getRotation(_getQuat, this);
        this.#getEulerFromQuat(out, _getQuat, order);
        return out;
    }

    /**
     * Set the world rotation as euler angles
     * @param {vec3} euler
     * @param {EULER_ORDER} order
     */
    setWorldEuler(euler, order = 'zyx') {
        if(this.#parent) {
            const parent = this.#parent.getWorldEuler(_getEuler, order);
            this.setEuler(vec3.sub(_setEuler, euler, parent), order);
        } else {
            this.setEuler(euler, order);
        }
    }

    
    /**
     * Rotate the transform by a euler angles
     * @param {vec3} euler
     */
    rotateEuler(euler) {
        this.#setRotationFromQuat(quat.multiply(_setQuat, quat.fromEuler(_setQuat, euler[0], euler[1], euler[2], this.eulerOrder), this.#getRotationAsQuat()));
        this.#applyTRS();
        this.notify('change');
    }


    /**
     * Get the local rotation as an axis angle
     */
    getAxisAngle(out = vec3.create()) {
        return this.#getRotationAsAxisAngle(out);
    }

    /**
     * Set the local rotation as an axis angle
     * @param {vec3} axis
     * @param {number} angle
     */
    setAxisAngle(axis, angle) {
        this.#rotation.set(axis);
        this.#rotation[3] = angle;
        this.#rotationMode = Transform.AXIS_ANGLE;
        this.#applyTRS();
        this.notify('change');
    }

    /** 
     * Get the world rotation as an axis angle
     */
    getWorldAxisAngle(out = vec3.create()) {
        mat4.getRotation(_getQuat, this);
        return quat.getAxisAngle(out, _getQuat);
    }

    /**
     * Set the world rotation as an axis angle
     * @param {vec3} axis
     * @param {number} angle
     */
    setWorldAxisAngle(axis, angle) {
        if(this.#parent) {
            const parent = this.#parent.getWorldRotation(_getQuat);
            quat.setAxisAngle(_setQuat, axis, angle);
            quat.multiply(_setQuat, _setQuat, quat.invert(_getQuat, parent));
            const a = quat.getAxisAngle(_getQuat, _setQuat);
            this.setAxisAngle(_getQuat, a);
        } else {
            this.setAxisAngle(axis, angle);
        }
    }


    /**
     * Rotate the transform by an axis angle
     * @param {vec3} axis
     */
    rotateAxisAngle(axis) {

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
            const destination = quat.multiply(_setQuat, quat.setAxisAngle(_setQuat, axis, axis[3]), this.#getRotationAsQuat());
            this.#setRotationFromQuat(destination);
        // }
        
        this.#applyTRS();
        this.notify('change');
    }

    /**
     * Change the local rotation mode
     * @param {ROTATION_MODE} mode
     */
    changeRotationMode(mode) {
        const quat = this.#getRotationAsQuat();
        this.#rotationMode = mode;
        this.#setRotationFromQuat(quat);
    }

    #applyTRS() {
        mat4.fromRotationTranslationScale(this, this.#getRotationAsQuat(), this.#translation, this.#scale);
        if(this.#parent) {
            mat4.multiply(this, this.#parent, this);
        }
    }

    /** @type {Transform|null} */
    #parent = null;
    /** @type {AbortController|null} */
    #parentCtl = null;

    /** 
     * Sets the transform parent. The transform will become a local representation relative to the parent.
     * @param {Transform|null} parent */
    setParent(parent) {
        this.#parentCtl?.abort();

        this.#parent = parent;
        if(parent) {
            this.#parentCtl = new AbortController();

            parent.watch('change', { signal: this.#parentCtl.signal, handler: () => {
                this.#applyTRS();
                this.notify('change');
            } });
        } else {
            this.#parentCtl = null;
        }
        
        
        this.#applyTRS();
        this.notify('change');
    }

    /**
     * 
     */
    toJSON() {
        return { translation: [...this.#translation], rotation: [...this.#rotation], scale: [...this.#scale], mode: this.#rotationMode }
    }

    clone() {
        return new Transform(this);
    }

    static IDENTITY   = Object.freeze([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0]);
    static QUATERNION = /** @type {const} */(0);
    static EULER_XYZ  = /** @type {const} */(1);
    static EULER_XZY  = /** @type {const} */(2);
    static EULER_YXZ  = /** @type {const} */(3);
    static EULER_YZX  = /** @type {const} */(4);
    static EULER_ZXY  = /** @type {const} */(5);
    static EULER_ZYX  = /** @type {const} */(6);
    static AXIS_ANGLE = /** @type {const} */(7);


    static #EULER_ANGLE_ORDERS = Object.freeze({
        [this.QUATERNION]: 'xyz',
        [this.EULER_XYZ]:  'xyz',
        [this.EULER_XZY]:  'xzy',
        [this.EULER_YXZ]:  'yxz',
        [this.EULER_YZX]:  'yzx',
        [this.EULER_ZXY]:  'zxy',
        [this.EULER_ZYX]:  'zyx',
        [this.AXIS_ANGLE]: 'xyz',
    })

    static #EULER_ROTATION_MODES = Object.freeze({
        'xyz': this.EULER_XYZ,
        'xzy': this.EULER_XZY,
        'yxz': this.EULER_YXZ,
        'yzx': this.EULER_YZX,
        'zxy': this.EULER_ZXY,
        'zyx': this.EULER_ZYX,
    })


    #getRotationAsQuat() {
        switch(this.rotationMode) {
            case Transform.QUATERNION:
                return this.#rotation;
            case Transform.AXIS_ANGLE:
                return quat.setAxisAngle(_getQuat, this.#rotation, this.#rotation[3]);
            default: 
                return quat.fromEuler(_getQuat, this.#rotation[0], this.#rotation[1], this.#rotation[2], this.eulerOrder);
        }
    }

    #getRotationAsEuler() {
        switch(this.rotationMode) {
            case Transform.QUATERNION:
                return this.#getEulerFromQuat(_getEuler, this.#rotation, 'zyx');
            case Transform.AXIS_ANGLE:
                return this.#getEulerFromQuat(_getEuler, quat.setAxisAngle(_setQuat, this.#rotation, this.#rotation[3]), 'zyx');
            default:
                return this.#rotation;
        }
    }

    #getRotationAsAxisAngle(out = vec3.create()) {
        switch(this.rotationMode) {
            case Transform.QUATERNION:
                return quat.getAxisAngle(out, this.#rotation);;
            case Transform.AXIS_ANGLE:
                vec3.copy(out, this.#rotation);
                return this.#rotation[3];
            default:
                quat.fromEuler(_getQuat, this.#rotation[0], this.#rotation[1], this.#rotation[2], this.eulerOrder)
                return quat.getAxisAngle(out, _getQuat);
        }
    }

    /**
     * @param {quat} q
     */
    #setRotationFromQuat(q) {
        switch(this.rotationMode) {
            case Transform.QUATERNION:
                return quat.copy(this.#rotation, q);
            case Transform.AXIS_ANGLE:
                return this.#rotation[3] = quat.getAxisAngle(this.#rotation, q);
            default: 
                return this.#getEulerFromQuat(this.#rotation, q, this.eulerOrder);
        }
    }

    /**
     * ported from https://github.com/mrdoob/three.js/blob/560c5fcba722d9b37884a6925895d64195cd675e/src/math/Euler.js
     * 
     * @param {quat} out
     * @param {quat} q
     */
    #getEulerFromQuat(out, q, order = 'zyx') {
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
}

export class TransformModel extends TypedModel({
    components: {
        transform: { type: 'transform' },
    },
}) {
    /**
    * @param {import('revelryengine/ecs/lib/stage.js').Stage<ComponentTypes>} stage
    * @param {string} entity
    */
    constructor(stage, entity) {
        super(stage, entity)
        this.transform.watch(() => this.notify('transform'));
    }
}

export class TransformSystem extends TypedSystem({
    models: {
        transforms: { model: TransformModel, isSet: true },
    }
}) { }

export default Transform;