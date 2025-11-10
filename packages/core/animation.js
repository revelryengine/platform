import { Model, System } from 'revelryengine/ecs/ecs.js';
import { Animation, AnimationChannel, AnimationChannelTarget, AnimationSampler } from 'revelryengine/gltf/gltf.js';
import { NonNull } from 'revelryengine/utils/utils.js';
import { MeshModel } from './mesh.js';

/**
 * @import { SystemBundle, ComponentTypeSchema } from 'revelryengine/ecs/ecs.js';
 */

export const AnimationsSchema = /** @type {const} @satisfies {ComponentTypeSchema}*/({
    type: 'array',
    items: {
        type:  'object',
        properties: {
            name: { type: 'string'  },
            loop: { type: 'boolean' },
        },
        required: ['name'],
    },
});

export class AnimatedModel extends Model.Typed(/** @type {const} */({
    components: ['transform', 'meta', 'mesh', 'animations'],
})) {
    /** @type {Record<string, import('revelryengine/gltf/gltf.js').Animator>} */
    animators = {};
}

export class AnimationSystem extends System.Typed(/** @type {const} */({
    id: 'animation',
    models: {
        animatedModels: { model: AnimatedModel, isSet: true },
    }
})) {

    /**
     * @param {AnimatedModel} model
     */
    onModelAdd(model) {
        this.#createAnimations(model);
        model.components.mesh.watch(() => this.#createAnimations(model));
    }

    /**
     * @param {AnimatedModel} model
     */
    #createAnimations(model) {
        const gltf = model.components.mesh.references['/asset']?.data;
        if(gltf) {
            const meshModel = NonNull(this.stage.getEntityModel(model.entity, MeshModel));

            const animations = gltf.animations?.map(({ name, channels, samplers }) => {
                return new Animation({
                    name,
                    channels: channels.map((channel) => {
                        /** @todo handle KHR_animation_pointer by managing KHRAnimationPointerTarget resolve method to get new reference. What about materials and lights? */
                        return new AnimationChannel({ ...channel, target: new AnimationChannelTarget({ ...channel.target, node: channel.target.node && meshModel.node.refs.get(channel.target.node) }) });
                    }),
                    samplers: samplers.map((sampler) => {
                        return new AnimationSampler({ ...sampler });
                    }),
                });
            });

            model.animators = {};

            for (const animation of animations) {
                if(animation.name) {
                    model.animators[animation.name] = animation.createAnimator();
                }
            }
        }
    }


    /**
     * @param {number} deltaTime
     */
    update(deltaTime){
        for(const model of this.models.animatedModels) {
            for(const { name, loop = true } of model.components.animations.value) {
                model.animators[name]?.update(deltaTime, loop);
            }
        }
    }
}

/** @satisfies {SystemBundle} */
export const bundle = {
    systems: [AnimationSystem],
    schemas: {
        animations: AnimationsSchema,
    }
}
