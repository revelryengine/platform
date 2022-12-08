import { System } from 'revelryengine/ecs/lib/system.js';
import { Model  } from 'revelryengine/ecs/lib/model.js';

import { vec3, quat, mat4 } from '../deps/gl-matrix.js';
import { Watchable        } from './watchable.js';

export class Transform extends Watchable.mixin(Float32Array) {
    constructor({ matrix, translation, rotation, scale }) {
        super(16);
        mat4.identity(this, this);

        this.translation = vec3.create();
        this.rotation    = quat.create();
        this.scale       = vec3.fromValues(1, 1, 1);
        
        if(matrix) {
            mat4.set(this, matrix);
            mat4.getTranslation(this.translation, this);
            mat4.getRotation(this.rotation, this);
            mat4.getScaling(this.scale, this);
        } else {
            if(translation) vec3.copy(this.translation, translation);
            if(rotation)    quat.copy(this.rotation, rotation);
            if(scale)       vec3.copy(this.scale, scale);
            mat4.fromRotationTranslationScale(this, this.rotation, this.translation, this.scale);
        }
    }

    commit(){
        mat4.fromRotationTranslationScale(this, this.rotation, this.translation, this.scale);
        this.notify();
    }

    translate(v) {
        vec3.add(this.translation, this.translation, v);
    }

    setAxisAngle(axis, rad) {
        quat.setAxisAngle(this.rotation, axis, rad);
    }
}

export class TransformModel extends Model {
    static get components() {
        return {
            transform: { type: 'transform' },
        }
    }
}
export class TransformSystem extends System {
    static get models() {
        return {
            transforms: { model: TransformModel, isSet: true },
        }
    }
}

export default Transform;