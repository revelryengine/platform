import { Model, System } from '../deps/ecs.js';
import { GLTF, Mesh, MeshPrimitive, Node } from '../deps/gltf.js';

import { Asset } from './asset.js';

/**
 * @typedef {{ path: string, alphaMode?: 'MASK'| 'BLEND' | 'OPAQUE', alphaCutoff?: number, doubleSided?: boolean, pixelToUnitRatio?: number }} SpriteAssetJSON
 */

const GL = WebGL2RenderingContext;

const INDICES = new Blob([new Uint16Array([
    0, 1, 2, 2, 3, 0
]).buffer], { type: 'application/octet-stream' });

const POSITION = new Blob([new Float32Array([
    -0.5, 0.5, 0.0,
    -0.5,-0.5, 0.0,
     0.5,-0.5, 0.0,
     0.5, 0.5, 0.0,
]).buffer], { type: 'application/octet-stream' });

const TEXCOORD_0 = new Blob([new Float32Array([
    0, 0,
    0, 1,
    1, 1,
    1, 0,
]).buffer], { type: 'application/octet-stream' });

const ASSET_GENERATOR = {
    version: '2.0', generator: 'Reverly Engine Sprite Generation',
};

const GEOMETRY_GLTF = GLTF.fromJSON({
    asset: ASSET_GENERATOR,
    accessors: [
        { bufferView: 0, byteOffset: 0, componentType: GL.UNSIGNED_SHORT, count: 6, type: 'SCALAR', min: [0], max: [3] },
        { bufferView: 1, byteOffset: 0, componentType: GL.FLOAT, count: 4, type: 'VEC3', min: [-0.5, -0.5, 0], max: [0.5, 0.5, 0] },
        { bufferView: 2, byteOffset: 0, componentType: GL.FLOAT, count: 2, type: 'VEC2', min: [0, 0], max: [1, 1] },
    ],
    buffers: [
        { uri: URL.createObjectURL(INDICES),    byteLength: 12 },
        { uri: URL.createObjectURL(POSITION),   byteLength: 48 },
        { uri: URL.createObjectURL(TEXCOORD_0), byteLength: 32 },
    ],
    bufferViews: [
        { buffer: 0, byteLength: 12, target: GL.ELEMENT_ARRAY_BUFFER  },
        { buffer: 1, byteLength: 48, target: GL.ARRAY_BUFFER  },
        { buffer: 2, byteLength: 32, target: GL.ARRAY_BUFFER  },
    ],
}).load();

/**
 * @extends {Asset<SpriteAssetJSON, { mesh: Mesh, width: number, height: number }, { node: Node }>}
 */
export class SpriteAsset extends Asset {
    /**
     * @param {Revelry.ECS.ComponentJSON<'sprite'>} component
     */
    constructor(component) {
        super(component);
    }

    get key() {
        return `${super.key}#a=${this.value.alphaMode}&c=${this.value.alphaCutoff}&d=${this.value.doubleSided}`;
    }

    /**
     * @param {AbortSignal} [signal]
     */
    async load(signal) {
        const geometry = await GEOMETRY_GLTF;

        const { alphaMode = 'MASK', alphaCutoff = 0.5, doubleSided = true } = this.value;

        const material = await GLTF.fromJSON({
            asset: ASSET_GENERATOR,
            images: [
                { uri: import.meta.resolve(this.path) },
            ],
            samplers: [
                { magFilter: GL.NEAREST, minFilter: GL.NEAREST_MIPMAP_LINEAR, wrapS: GL.CLAMP_TO_EDGE, wrapT: GL.CLAMP_TO_EDGE },
            ],
            textures: [
                { sampler: 0, source: 0 },
            ],
            materials: [{
                pbrMetallicRoughness: { baseColorTexture: { index: 0 } },
                alphaMode: alphaMode, alphaCutoff,  doubleSided,
            }]
        }).load(signal);

        const imageData = material.images[0].getImageData();

        if(!(imageData instanceof ImageBitmap)) throw new Error('Invalid Image Data');

        const { width, height } = imageData;

        return {
            width, height,
            mesh: new Mesh({
                primitives: [
                    new MeshPrimitive({
                        indices: geometry.accessors[0], mode: 4,
                        attributes: { POSITION: geometry.accessors[1], TEXCOORD_0: geometry.accessors[2] },
                        material: material.materials[0],
                    })
                ]
            }),
        };
    }

    async createInstance() {
        if(!this.data) throw new Error('Invalid state');

        const { width, height, mesh     } = this.data;
        const { pixelToUnitRatio = 0.01 } = this.value;

        const node = new Node({
            children: [
                new Node({ mesh, scale: [pixelToUnitRatio * width, pixelToUnitRatio * height, 1] })
            ]
        });
        return { node };
    }
}

export class SpriteModel extends Model.Typed({
    components: {
        transform: { type: 'transform' },
        sprite:    { type: 'sprite'    },
    }

}) {
    get node() {
        return this.sprite.instance?.node;
    }
}

export class SpriteSystem extends System.Typed({
    models: {
        sprites: { model: SpriteModel, isSet: true },
    }
}) {
    id = 'sprite';

    /**
     * @param {SpriteModel} model
     */
    onModelAdd(model) {
        const renderer = /** @type {import('./renderer.js').RendererSystem} */(this.stage?.getContext('renderer'));

        model.sprite.watch('instance:create', ({ instance, previous }) => {
            if(model.sprite.instance) model.sprite.instance.node.matrix = model.transform;
            if(previous) renderer.deleteGraphNode(previous.node);
            renderer.addGraphNode(instance.node);
        });

        model.transform.watch('change', {
            deferred: true, handler: () => {
                if(model.node) renderer.updateGraphNode(model.node);
            }
        });
    }

    /**
     * @param {SpriteModel} model
     */
    onModelDelete(model) {
        const renderer = /** @type {import('./renderer.js').RendererSystem} */(this.stage?.getContext('renderer'));
        if(model.node) renderer.deleteGraphNode(model.node);
    }
}

/** @type {Revelry.ECS.SystemBundle} */
export const bundle = {
    systems: [SpriteSystem],
    initializers: { sprite: (c) => new SpriteAsset(c) }
}
