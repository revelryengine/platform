import { Model, System } from 'revelryengine/ecs/ecs.js';

import { GLTF, Node as GLTFNode, Skin } from 'revelryengine/gltf/gltf.js';
import { NonNull } from 'revelryengine/utils/utils.js';

import { GameObjectModel } from './game-object.js';

/**
 * @import { SystemBundle, ComponentTypeSchema } from 'revelryengine/ecs/ecs.js';
 */

export const MeshSchema = /** @type {const} @satisfies {ComponentTypeSchema}*/({
    type: 'object',
    properties: {
        asset: { type: 'string', asset: 'revelry/mesh' },
    },
    observed: ['asset'],
});

export class MeshNode extends GLTFNode {
    /**
     * @param {MeshModel} model
     */
    constructor(model) {
        super({});
        this.model = model;
        this.refs  = /** @type {Map<GLTFNode, GLTFNode>} */(new Map());
    }
}

/**
 * @param {{uri: string, signal: AbortSignal }} params
 */
export async function MeshLoader({ uri, signal }) {
    return GLTF.load(import.meta.resolve(uri), signal);
}

export class MeshModel extends Model.Typed(/** @type {const} */({
    components: ['transform', 'meta', 'mesh']
})) {
    node = new MeshNode(this);
}

export class MeshSystem extends System.Typed(/** @type {const} */({
    id: 'mesh',
    models: {
        meshes: { model: MeshModel, isSet: true },
    },
})) {
    /**
     * @param {MeshModel} model
     */
    onModelAdd(model) {
        const gameObject = this.stage.getEntityModel(model.entity, GameObjectModel);
        gameObject?.addChildNode(model.node);
        this.#createMesh(model);
        model.components.mesh.watch(() => this.#createMesh(model));
    }

    /**
     * @param {MeshModel} model
     */
    onModelDelete(model) {
        const gameObject = this.stage.getEntityModel(model.entity, GameObjectModel);
        gameObject?.deleteChildNode(model.node);
    }

    /**
     * @param {MeshModel} model
     */
    #createMesh(model) {
        const gameObject = NonNull(this.stage.getEntityModel(model.entity, GameObjectModel));

        const gltf = model.components.mesh.references['/asset']?.data;
        if(gltf) {
            const scene = gltf.scene ?? gltf.scenes[0];

            /**
             * @type {Map<GLTFNode, GLTFNode>}
             */
            const refs = new Map();

            for (const node of scene.traverseDepthFirst()) {
                refs.set(node, new GLTFNode({ ...node }));
            }

            for (const node of scene.traverseDepthFirst()) {
                const copy = /** @type {GLTFNode} */(refs.get(node));

                copy.children = node.children.map(n => /** @type {GLTFNode} */(refs.get(n)));

                if(node.skin) {
                    copy.skin = new Skin({ ...node.skin, skeleton: node.skin.skeleton && refs.get(node.skin.skeleton), joints: node.skin.joints.map(j => /** @type {GLTFNode} */(refs.get(j))) });
                }
            }

            const node = new GLTFNode({ children: scene.nodes.map(n => /** @type {GLTFNode} */(refs.get(n))) });

            model.node.refs = refs;
            for(const child of model.node.children) {
                gameObject.notify('node:delete', child);
            }
            model.node.children = [node];
            gameObject.notify('node:add', node)
        }
    }
}


/** @satisfies {SystemBundle} */
export const bundle = {
    systems: [MeshSystem],
    schemas: {
        mesh: MeshSchema,
    },
    loaders: {
        'revelry/mesh': MeshLoader,
    }
}
