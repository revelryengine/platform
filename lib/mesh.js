import { Model, System } from '../deps/ecs.js';

import { GLTF, Node, Animation, Skin } from '../deps/gltf.js';
import { AnimationChannel            } from '../deps/gltf.js';
import { AnimationChannelTarget      } from '../deps/gltf.js';
import { AnimationSampler            } from '../deps/gltf.js';

import { Asset } from './asset.js';
import { GameObjectAssetNode } from './game-object.js';

/**
 * @extends {Asset<import('./game-object.js').GameObjectAssetDefinition & {
 *  data:     GLTF,
 *  instance: { node: Node, animations?: Animation[] },
 * }>}
 */
export class MeshAsset extends Asset {
    /**
     * @param {AbortSignal} [signal]
     * @return {Promise<GLTF>}
     */
    async load(signal) {
        if(!this.path) {
            return GLTF.fromJSON({
                asset: {
                    version: '2.0',
                    generator: 'Reverly Engine Empty Mesh',
                },
                scenes: [{
                    nodes: [],
                }],
            });
        }
        return GLTF.load(import.meta.resolve(this.path), signal);
    }

    async createInstance() {
        if(!this.data) throw new Error('Invalid state');
        const gltf = this.data;
        const scene = gltf.scene ?? gltf.scenes[0];

        /**
         * @type {Map<Node, Node>}
         */
        const refs = new Map();

        for (const node of scene.traverseDepthFirst()) {
            refs.set(node, new Node({ ...node }));
        }

        for (const node of scene.traverseDepthFirst()) {
            const copy = /** @type {Node} */(refs.get(node));

            copy.children = node.children.map(n => /** @type {Node} */(refs.get(n)));

            if(node.skin) {
                copy.skin = new Skin({ ...node.skin, skeleton: node.skin.skeleton && refs.get(node.skin.skeleton), joints: node.skin.joints.map(j => /** @type {Node} */(refs.get(j))) });
            }
        }

        const node = new Node({ children: scene.nodes.map(n => /** @type {Node} */(refs.get(n))) });
        const animations = gltf.animations?.map(({ name, channels, samplers }) => {
            return new Animation({
                name,
                channels: channels.map((channel) => {
                    /** @todo handle KHR_animation_pointer by managing KHRAnimationPointerTarget resolve method to get new reference. What about materials and lights? */
                    return new AnimationChannel({ ...channel, target: new AnimationChannelTarget({ ...channel.target, node: channel.target.node && /** @type {Node} */(refs.get(channel.target.node)) }) });
                }),
                samplers: samplers.map((sampler) => {
                    return new AnimationSampler({ ...sampler });
                }),
            });
        });

        return { node, animations };
    }
}

export class MeshModel extends Model.Typed({
    components: {
        meta:      { type: 'meta'      },
        transform: { type: 'transform' },
        mesh:      { type: 'mesh'      },
    }

}) {
    node = new GameObjectAssetNode({ type: 'mesh', asset: this.mesh, meta: this.meta, transform: this.transform });
}

export class MeshSystem extends System.Typed({
    models: {
        meshes: { model: MeshModel, isSet: true },
    },
}) {
    id = 'mesh';

    /**
     * @param {MeshModel} model
     */
    onModelAdd(model) {
        this.stage?.getContext('renderer').addGameObjectAssetNode(model.node);
    }
}


/** @satisfies {Revelry.ECS.SystemBundle} */
export const bundle = {
    systems: [MeshSystem],
    initializers: { mesh: (c) => new MeshAsset(c) }
}
