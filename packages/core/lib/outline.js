/// <reference path="./lib.revelry.d.ts" />

import { Model, System   } from '../deps/ecs.js';
import { NonNull         } from '../deps/utils.js';
import { GameObjectModel } from './game-object.js';

/**
 * @import { SystemBundle, ComponentTypeSchema } from '../deps/ecs.js';
 */

export const OutlineSchema = /** @type {const} @satisfies {ComponentTypeSchema}*/({
    type: 'array',
    items: [{ type: 'number' }, { type: 'number' }, { type: 'number' }, { type: 'number' }],
});


export class OutlineModel extends Model.Typed(/** @type {const} */({
    components: ['transform', 'meta', 'outline']
})) {
    get color() {
        return this.components.outline.value;
    }
    set color(v) {
        this.components.outline.value = v;
    }
}

export class OutlineSystem extends System.Typed(/** @type {const} */({
    id: 'outline',
    models: {
        outlineObjects: { model: OutlineModel, isSet: true },
    },
})) {

    /**
     * @param {OutlineModel} model
     */
    onModelAdd(model) {
        const gameObject = NonNull(this.stage.getEntityModel(model.entity, GameObjectModel));

        Object.defineProperties(gameObject.node.extensions.REV_game_object, {
            outline: { get: () => model.color, configurable: true },
        });

        gameObject.notify('node:update');
    }

    /**
     * @param {OutlineModel} model
     */
    onModelDelete(model) {
        const gameObject = this.stage.getEntityModel(model.entity, GameObjectModel);
        if(gameObject) {
            delete gameObject.node.extensions.REV_game_object.outline;
            gameObject.notify('node:update');
        }
    }
}

/** @satisfies {SystemBundle} */
export const bundle = {
    systems: [OutlineSystem],
    schemas: { meta: OutlineSchema }
}
