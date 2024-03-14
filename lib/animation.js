import { Model, System } from '../deps/ecs.js';

/**
 *
 */
export class AnimatedModel extends Model.Typed({
    components: {
        animations: { type: 'animations' },
        mesh:       { type: 'mesh'       },
    }
}) {
    get node() {
        return this.mesh.instance?.node;
    }

    /** @type {Record<string, import('../deps/gltf.js').Animator>} */
    animators = {};
}

export class AnimationSystem extends System.Typed({
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
                    if(animation.name) {
                        model.animators[animation.name] = animation.createAnimator();
                    }
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

/** @satisfies {Revelry.ECS.SystemBundle} */
export const bundle = {
    systems: [AnimationSystem],
}
