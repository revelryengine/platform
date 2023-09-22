import { System    } from 'revelryengine/ecs/lib/system.js';
import { Model     } from 'revelryengine/ecs/lib/model.js';

import { GLTF, Node, Animation, Skin } from 'revelryengine/gltf/lib/gltf.js';

import { Asset } from './asset.js';

/**
 * @typedef {{  
 *     mesh: { value: MeshAsset, json: { path: string } },
 * } & import('./game-object.js').ComponentTypes } ComponentTypes
 */

const types = /** @type {ComponentTypes} */({});
const TypedModel  = Model.Typed(types);
const TypedSystem = System.Typed(types);


export class MeshAsset extends Asset {
    /**
     * @param {AbortSignal} [signal] 
     * @return {Promise<GLTF>}
     */
    async load(signal) {
        return GLTF.load(import.meta.resolve(this.path), signal);
    }

    async createInstance() {
        const gltf = this.data;
        const scene = gltf.scene ?? gltf.scenes[0];

        const refs = new Map();

        for (const node of scene.traverseDepthFirst()) {
            refs.set(node, new Node({ ...node }));
        }

        for (const node of scene.traverseDepthFirst()) {
            const copy = refs.get(node);

            copy.children = node.children.map(n => refs.get(n));

            if(node.skin) {
                copy.skin = new Skin({ ...node.skin, skeleton: refs.get(node.skin.skeleton), joints: node.skin.joints.map(j => refs.get(j)) });
            }
        }

        const node = new Node({ children: scene.nodes.map(n => refs.get(n)) });
        const animations = gltf.animations?.map(({ name, channels, samplers }) => {
            return new Animation({ 
                name,
                channels: channels.map((channel) => {
                    return { ...channel, target: { ...channel.target, node: refs.get(channel.target.node) } };
                }), 
                samplers: samplers.map((sampler) => {
                    return { ...sampler };
                }),
            });
        });

        return { node, animations };
    }
}

export class MeshModel extends TypedModel({
    components: {
        transform: { type: 'transform' },
        mesh:      { type: 'mesh'      },
    }
    
}) { 
    get node() {
        return this.mesh.instance?.node;
    }
}

export class MeshSystem extends TypedSystem({
    models: {
        meshes: { model: MeshModel, isSet: true },
    }
}) {
    id = 'mesh';

    /** 
     * @param {MeshModel} model
     */
    onModelAdd(model) {
        model.mesh.watch('instance:create', () => {
            if(model.mesh.instance) model.mesh.instance.node.matrix = model.transform;
        });
    }
}