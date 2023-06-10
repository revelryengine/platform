import { System    } from 'revelryengine/ecs/lib/system.js';
import { Model     } from 'revelryengine/ecs/lib/model.js';
import { Watchable } from 'revelryengine/ecs/lib/utils/watchable.js';

import { vec3      } from '../deps/gl-matrix.js';

const EPSILON = 0.01;

export class Velocity extends Watchable.mixin(Float32Array) {
    constructor({ velocity, dampingFactor }) {
        super(3);
        
        this.set(velocity);
        
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

    toJSON() {
        return { velocity: [...this], dampingFactor: this.dampingFactor };
    }
}

export class VelocityModel extends Model {
    static get components() {
        return {
            velocity: { type: 'velocity' },
        }
    }

    constructor() {
        super(...arguments);
        if(!(this.velocity instanceof Float32Array)) {
            if(Array.isArray(this.velocity)) {
                this.velocity = new Float32Array(this.velocity);
            } else {
                const { velocity = vec3.create(), dampingFactor = vec3.fromValues(1, 1, 1) } = this.velocity;
                this.velocity = new Float32Array([...velocity, ...dampingFactor]);
            }
        }
    }
}

export class AngularVelocityModel extends VelocityModel {
    static get components() {
        return {
            velocity: { type: 'angularVelocity' },
        }
    }
}

export class VelocitySystem extends System {
    static get models() {
        return {
            velocities:        { model: VelocityModel, isSet: true        },
            angularVelocities: { model: AngularVelocityModel, isSet: true },
        }
    }

    update() {
        for(const v of this.velocities) {
            const length = vec3.length(v.velocity);
            if(length > 0) {
                if(length < EPSILON) {
                    vec3.zero(v.velocity);
                } else {
                    vec3.multiply(v.velocity, v.velocity, new Float32Array(v.velocity.buffer, 12));
                    v.notify('velocity');
                }
            }
        }
    }
}

export default Velocity;