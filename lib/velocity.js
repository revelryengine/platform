import { System } from 'revelryengine/ecs/lib/system.js';
import { Model  } from 'revelryengine/ecs/lib/model.js';

import { vec3      } from '../deps/gl-matrix.js';
import { Watchable } from './watchable.js';

const EPSILON = 0.01;

export class Velocity extends Watchable.mixin(Float32Array) {
    constructor(v, dampingFactor) {
        super(3);
        
        this.set(v);

        this.dampingFactor = vec3.fromValues(1, 1, 1);

        if(dampingFactor) {
            if(typeof dampingFactor === 'number') {
                this.dampingFactor.fill(dampingFactor);
            } else {
                this.dampingFactor.set(dampingFactor);
            }
        }
    }

    commit(){
        this.notify();
    }
}

export class VelocityModel extends Model {
    static get components() {
        return {
            velocity: { type: 'velocity' },
        }
    }
}

export class AngularVelocityModel extends Model {
    static get components() {
        return {
            angularVelocity: { type: 'angularVelocity' },
        }
    }
}

export class VelocitySystem extends System {
    static get models() {
        return {
            velocities:        { model: VelocityModel, isSet: true        },
            angulatVelocities: { model: AngularVelocityModel, isSet: true },
        }
    }

    update() {
        for(const { velocity } of this.velocities) {
            const length = vec3.length(velocity);
            if(length > 0) {
                if(length < EPSILON) {
                    vec3.zero(velocity);
                } else {
                    vec3.multiply(velocity, velocity, velocity.dampingFactor);
                    velocity.commit();
                }
            }
        }
    }
}

export default Velocity;