import { Model, System, Watchable } from '../deps/ecs.js';
import { vec3 } from '../deps/gl-matrix.js';

const EPSILON = 0.01;

export class Velocity extends Watchable.mixin(Float32Array) {
    constructor({ velocity, dampingFactor }) {
        super(3);

        this.set({ velocity, dampingFactor });

        this.dampingFactor = vec3.fromValues(1, 1, 1);

        if(dampingFactor) {
            if(typeof dampingFactor === 'number') {
                this.dampingFactor.fill(dampingFactor);
            } else {
                this.dampingFactor.set(dampingFactor);
            }
        }
    }

    set() {

    }

    toJSON() {
        return { velocity: [...this], dampingFactor: this.dampingFactor };
    }
}

export class VelocityModel extends Model {
    static components = {
        transform: { type: 'transform' },
        velocity:  { type: 'velocity' },
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
    static components = {
        transform: { type: 'transform' },
        velocity:  { type: 'angularVelocity' },
    }
}

export class VelocitySystem extends System {
    static models = {
        velocities:        { model: VelocityModel,        isSet: true },
        angularVelocities: { model: AngularVelocityModel, isSet: true },
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

// export const systems = [VelocitySystem];

// /** @type {import('revelryengine/ecs/lib/component.js').ComponentInitializers<ComponentTypes>} */
// export const initializers = { transform: (c) => new Velocity(c.value) };
