import { Model, System         } from '../deps/ecs.js';
import { vec3                  } from '../deps/gl-matrix.js';
import { NonNull, OrbitControl } from '../deps/utils.js';
import { CameraModel           } from './renderer.js';

export class OrbitControlModel extends Model.Typed({
    components: {
        transform: { type: 'transform'    },
        camera:    { type: 'camera'       },
        control:   { type: 'orbitControl' }
    }

}) {
    #control = new OrbitControl({
        oninput: (input) => {
            if((input.pitch || input.yaw) && this.axis !== 'user' && this.camera.type === 'orthographic') {
                this.camera.type = 'perspective';
            }
        },
        onupdate: (matrix) => {
            this.#control.speed.pan = this.getDepthScale(this.#control.target);
            this.transform.setMatrix(matrix)
        }
    });

    /**
     * @param {number} hrTime
     */
    update(hrTime) {
        if(typeof this.control.target === 'string') {
            const component = this.stage.components.find({ entity: this.control.target, type: 'transform' });
            component?.value.getTranslation(this.#control.target);
        } else if(Array.isArray(this.control.target)) {
            vec3.copy(this.#control.target, this.control.target);
        }

        this.#control.update(hrTime);
    }

    /**
     * @param {CameraModel} cameraModel
     */
    observe(cameraModel) {
        this.#control.observeElement(cameraModel.canvas, this.control.button);
    }

    unobserve() {
        this.#control.unobserveAll();
    }

    /**
     * @param {Parameters<OrbitControl['interpolate']>[0]} options
     */
    interpolate(options) {
        this.#control.interpolate(options);
    }

    get forward() {
        return this.#control.forward;
    }

    get rotation() {
        return this.#control.rotation;
    }

    get distance() {
        return this.#control.distance;
    }

    get axis () {
        return this.#control.axis;
    }

    #point = vec3.create();

    /**
     * @param {vec3} point
     */
    getDepthScale(point) {
        this.transform.getTranslation(this.#point);
        const distance = vec3.distance(this.#point, point);

        if(this.camera.isPerspective()) {
            return distance * Math.tan(this.camera.perspective.yfov / 2);
        } else if(this.camera.isOrthographic()){
            return this.camera.orthographic.ymag;
        }
        throw new Error('Invalid Camera');
    }
}

export class OrbitControlSystem extends System.Typed({
    models: {
        controls: { model: OrbitControlModel, isSet: true },
    },
}) {
    id = 'orbit';

    /**
     * @param {OrbitControlModel} model
     */
    onModelAdd(model) {
        model.observe(NonNull(model.stage.getEntityModel(model.entity, CameraModel)));
    }

    /**
     * @param {OrbitControlModel} model
     */
    onModelDelete(model) {
        model.unobserve();
    }

    /**
     * @param {number} hrTime
     */
    update(hrTime) {
        for(const control of this.controls) {
            control.update(hrTime);
        }
    }
}

/** @satisfies {Revelry.ECS.SystemBundle} */
export const bundle = {
    systems: [OrbitControlSystem]
}
