import { System } from 'revelryengine/ecs/lib/system.js';
import { Model  } from 'revelryengine/ecs/lib/model.js';

/**
 * @typedef {{  
*     animations: { value: [{ name: string, loop?: boolean }] },
* } & import('./mesh.js').ComponentTypes } ComponentTypes
*/

const types = /** @type {ComponentTypes} */({});
const TypedModel  = Model.Typed(types);
const TypedSystem = System.Typed(types);

/**
 * 
 */
export class AnimatedModel extends TypedModel({
    components: {
        animations: { type: 'animations' },
        mesh:       { type: 'mesh'       },
    }
}) {
    get node() {
        return this.mesh.instance?.node;
    }

    /** @type {Record<string, import('revelryengine/gltf/lib/animation.js').Animator>} */
    animators = {};
}

export class AnimationSystem extends TypedSystem({
    models: {
        animatedModels: { model: AnimatedModel, isSet: true },
    }
}) {
    id = 'animation';

    /** @param {AnimatedModel} model */
    onModelAdd(model) {
        if(!model.node) {
            model.mesh.watch('instance:create', ({ instance }) => {
                model.animators = {};
                for (const animation of instance.animations) {
                    model.animators[animation.name] = animation.createAnimator();
                }
            });
        }
    }
    

    /** @param {number} deltaTime */
    update(deltaTime){
        for(const model of this.animatedModels) {
            for(const { name, loop = true } of model.animations) {
                model.animators[name]?.update(deltaTime, loop);
            }
        }
    }
}

export default AnimationSystem;