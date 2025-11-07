import { Model, System         } from '../deps/ecs.js';
import { vec3, mat4            } from '../deps/gl-matrix.js';
import { NonNull, OrbitControl } from '../deps/utils.js';
import { CameraModel           } from './renderer.js';

/**
 * @import { SystemBundle, ComponentTypeSchema } from '../deps/ecs.js';
 */

export const OrbitControlSchema = /** @type {const} @satisfies {ComponentTypeSchema}*/({
    type: 'object',
    properties: {
        button: { type: 'number', default: 0 },
        target: { type: 'string', component: 'transform' },
    },
});

export class OrbitControlModel extends Model.Typed(/** @type {const} */({
    components: [ 'transform', 'camera', 'orbitControl']

})) {
    #camera = NonNull(this.stage.getEntityModel(this.entity, CameraModel));

    #control = new OrbitControl({
        oninput: (input) => {
            if((input.pitch || input.yaw) && this.axis !== 'user' && this.#camera.type === 'orthographic') {
                this.#camera.type = 'perspective';
            }
        },
        onupdate: (matrix) => {
            this.#control.sensitivity.pan = this.getDepthScale(this.#control.target);

            mat4.getTranslation(this.components.transform.value.translation, matrix);
            mat4.getRotation(this.components.transform.value.rotation, matrix);

            this.#camera.components.camera.value[this.#camera.type].zfar  = (this.#control.distance * 10);
            this.#camera.components.camera.value[this.#camera.type].znear = (this.#control.distance / 100);

            this.components.transform.notify('value:change');
        }
    });

    /**
     * @param {number} hrTime
     */
    update(hrTime) {
        // const ref = this.components.orbitControl.value.target;
        // if(ref) {
        //     vec3.copy(this.#control.target, ref.value.translation);
        // }

        this.#control.update(hrTime);
    }

    /**
     * @param {CameraModel} cameraModel
     */
    observe(cameraModel) {
        this.#control.observeElement(cameraModel.canvas, this.components.orbitControl.value.button);
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
        vec3.copy(this.#point, this.components.transform.value.translation);

        const distance = vec3.distance(this.#point, point);

        if(this.#camera.type === 'perspective') {
            return distance * Math.tan(this.#camera.perspective.yfov / 2);
        } else {
            return this.#camera.orthographic.ymag;
        }
    }
}

export class OrbitControlSystem extends System.Typed(/** @type {const} */({
    id: 'orbit',
    models: {
        controls: { model: OrbitControlModel, isSet: true },
    },
})) {
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
        for(const control of this.models.controls) {
            control.update(hrTime);
        }
    }
}

/** @satisfies {SystemBundle} */
export const bundle = {
    systems: [OrbitControlSystem]
}
