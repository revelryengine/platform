import { System    } from 'revelryengine/ecs/lib/system.js';
import { Model     } from 'revelryengine/ecs/lib/model.js';
import { Watchable } from 'revelryengine/ecs/lib/utils/watchable.js';

import { vec3, vec4, quat, mat4, glMatrix } from 'gl-matrix';
import { rad2Deg, deg2Rad, diffDeg } from './utils/angles.js';

const { abs, asin, atan2 } = Math;

const _matrix       = mat4.create();

const _getQuat      = quat.create();
const _getEuler     = vec3.create();
const _getAxisAngle = vec4.create();

const _setQuat      = quat.create();
const _setEuler     = vec3.create();

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
 * @typedef {{  
 *     transform: { value: Transform, json: { translation: number[], rotation: number[], scale: number[], mode: number } },
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
 * A Transform is similar to a standard transformation matrix excepts it maintains additional values that contain the original rotation and scale used to generate the matrix.
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
        super(Transform.#IDENTITY);

        this.#matrix      = new Float32Array(this.buffer, 0, 16);
        this.#translation = new Float32Array(this.buffer, 16 * 4, 3);
        this.#rotation    = new Float32Array(this.buffer, 19 * 4, 4);
        this.#scale       = new Float32Array(this.buffer, 23 * 4, 3);
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

    get rotationMode() {
        return this.#mode[0];
    }

    get eulerOrder() {
        return Transform.#EULER_ANGLE_ORDERS[this.#rotationMode] ?? 'zyx';
    }

    get #rotationMode() {
        return this.#mode[0]
    }

    set #rotationMode(mode) {
        this.#mode[0] = mode;
    }

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
                return Transform.getEulerFromQuat(_getEuler, this.#rotation, 'zyx');
            case Transform.AXIS_ANGLE:
                return Transform.getEulerFromQuat(_getEuler, quat.setAxisAngle(_getAxisAngle, this.#rotation, this.#rotation[3]), 'zyx');
            default:
                return this.#rotation;
        }
    }

    #getRotationAsAxisAngle() {
        switch(this.rotationMode) {
            case Transform.QUATERNION:
                _getAxisAngle[3] = quat.getAxisAngle(_getAxisAngle, this.#rotation);
                return _getAxisAngle;
            case Transform.AXIS_ANGLE:
                return this.#rotation;
            default:
                quat.fromEuler(_getQuat, this.#rotation[0], this.#rotation[1], this.#rotation[2], this.eulerOrder)
                _getAxisAngle[3] = quat.getAxisAngle(_getAxisAngle, _getQuat);
                return _getAxisAngle;
        }
    }

    #setRotationFromQuat(q) {
        switch(this.rotationMode) {
            case Transform.QUATERNION:
                return quat.copy(this.#rotation, q);
            case Transform.AXIS_ANGLE:
                return this.#rotation[3] = quat.getAxisAngle(this.#rotation, q);
            default: 
                return Transform.getEulerFromQuat(this.#rotation, q, this.eulerOrder);
        }
    }

    #applyTRS() {
        mat4.fromRotationTranslationScale(this, this.#getRotationAsQuat(), this.#translation, this.#scale);
        if(this.#parent) {
            mat4.multiply(this, this.#parent, this);
        }
    }

    getMatrix(out = mat4.create()) {
        return mat4.copy(out, this.#matrix);
    }

    getTranslation(out = vec3.create()) {
        return vec3.copy(out, this.#translation);;
    }

    setTranslation(translation) {
        this.#translation.set(translation);
        this.#applyTRS();
        this.notify('change');
    }

    getWorldTranslation(out = vec3.create()) {
        mat4.getTranslation(out, this);
        return out;
    }

    getRotation(out = vec4.create()) {
        return vec4.copy(out, this.#rotation);
    }

    setRotation(rotation) {
        this.#rotation.set(rotation);
        this.#applyTRS();
        this.notify('change');
    }

    getWorldRotation(out = quat.create()) {
        mat4.getRotation(out, this);
        return out;
    }

    getScale(out = vec3.create()) {
        return vec3.copy(out, this.#scale);
    }

    setScale(scale) {
        this.#scale.set(scale)
        this.#applyTRS();
        this.notify('change');
    }

    getWorldScale(out = vec3.create()) {
        mat4.getScaling(out, this);
        return out;
    }

    getQuat(out = quat.create()) {
        return quat.copy(out, this.#getRotationAsQuat());
    }

    setQuat(q) {
        this.#rotation.set(q);
        this.#rotationMode = Transform.QUATERNION;
        this.#applyTRS();
        this.notify('change');
    }

    /**
     * Return Euler angles as they were stored or as zyx order if rotationMode was quaternion or axis angle. 
     * Use transform.eulerAngle to check order
     */
    getEuler(out = vec3.create()) {
        return vec3.copy(out, this.#getRotationAsEuler());
    }

    /**
     * Set Euler angles
     */
    setEuler(e, order = 'zyx') {
        this.#rotation.set(e);
        this.#rotationMode = Transform.#EULER_ANGLE_ORDERS[order];
        this.#applyTRS();
        this.notify('change');
    }

    setAxisAngle(a) {
        this.#rotation.set(a);
        this.#rotationMode = Transform.AXIS_ANGLE;
        this.#applyTRS();
        this.notify('change');
    }

    getAxisAngle(out = vec4.create()) {
        return vec3.copy(out, this.#getRotationAsAxisAngle());
    }

    translate(v) {
        vec3.add(this.#translation, this.#translation, v);
        this.#applyTRS();
        this.notify('change');
    }

    rotateQuat(q){
        this.#setRotationFromQuat(quat.multiply(_setQuat, q, this.#getRotationAsQuat()));
        this.#applyTRS();
        this.notify('change');
    }

    rotateEuler(e) {
        this.#setRotationFromQuat(quat.multiply(_setQuat, quat.fromEuler(_setQuat, e[0], e[1], e[2], this.eulerOrder), this.#getRotationAsQuat()));
        this.#applyTRS();
        this.notify('change');
    }

    
    rotateAxisAngle(a) {

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
            const destination = quat.multiply(_setQuat, quat.setAxisAngle(_setQuat, a, a[3]), this.#getRotationAsQuat());
            this.#setRotationFromQuat(destination);
        // }
        
        this.#applyTRS();
        this.notify('change');
    }

    scale(s) {
        vec3.multiply(this.#scale, this.#scale, s);
        this.#applyTRS();
        this.notify('change');
    }

    changeRotationMode(mode) {
        const quat = this.#getRotationAsQuat(_getQuat);
        this.#rotationMode = mode;
        this.#setRotationFromQuat(quat);
    }

    #parent;
    #parentCtl;
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

    static #IDENTITY = Object.freeze([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0]);
    static get IDENTITY() { return this.#IDENTITY}

    static get QUATERNION() { return 0; }
    static get EULER_XYZ()  { return 1; }
    static get EULER_XZY()  { return 2; }
    static get EULER_YXZ()  { return 3; }
    static get EULER_YZX()  { return 4; }
    static get EULER_ZXY()  { return 5; }
    static get EULER_ZYX()  { return 6; }
    static get AXIS_ANGLE() { return 7; }

    static #EULER_ANGLE_ORDERS = {
        [this.EULER_XYZ]: 'xyz',
        [this.EULER_XZY]: 'xzy',
        [this.EULER_YXZ]: 'yxz',
        [this.EULER_YZX]: 'yzx',
        [this.EULER_ZXY]: 'zxy',
        [this.EULER_ZYX]: 'zyx',
    
        'xyz': this.EULER_XYZ,
        'xzy': this.EULER_XZY,
        'yxz': this.EULER_YXZ,
        'yzx': this.EULER_YZX,
        'zxy': this.EULER_ZXY,
        'zyx': this.EULER_ZYX,
    }

    /** ported from https://github.com/mrdoob/three.js/blob/560c5fcba722d9b37884a6925895d64195cd675e/src/math/Euler.js */
    static getEulerFromQuat(out, q, order = 'zyx') {
        const matrix = mat4.fromQuat(_matrix, q);

        const m11 = matrix[0], m12 = matrix[4], m13 = matrix[8];
        const m21 = matrix[1], m22 = matrix[5], m23 = matrix[9];
        const m31 = matrix[2], m32 = matrix[6], m33 = matrix[10];
    
        switch (order) {
            case Transform.EULER_XYZ:
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
            case Transform.EULER_XZY:
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
            case Transform.EULER_YXZ:
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
            case Transform.EULER_YZX:
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
            case Transform.EULER_ZXY:
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
            case Transform.EULER_ZYX:
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