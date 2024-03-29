import { Model, System } from '../deps/ecs.js';
import { GLTF, Mesh, MeshPrimitive, Material, Node } from '../deps/gltf.js';
import { SAMPLER_PARAMS } from '../deps/renderer.js';

import { Asset } from './asset.js';
import { GameObjectAssetNode } from './game-object.js';

const GL = WebGL2RenderingContext;

/**
 * @typedef {{
 *  path:              string,
 *  pixelToUnitRatio?: number,
 *  alphaMode?:        'mask'| 'blend' | 'opaque',
 *  alphaCutoff?:      number,
 *  doubleSided?:      boolean,
 *  filter: {
 *      magFilter?:        GPUFilterMode,
 *      minFilter?:        GPUFilterMode,
 *      mipmapFilter?:     GPUFilterMode,
 *  }
 * }} SpriteAssetJSON
 */

const INDICES = new Blob([new Uint16Array([
    0, 1, 2, 2, 3, 0
]).buffer], { type: 'application/octet-stream' });

const POSITION = new Blob([new Float32Array([
    -0.5, 0.5, 0.0,
    -0.5,-0.5, 0.0,
     0.5,-0.5, 0.0,
     0.5, 0.5, 0.0,
]).buffer], { type: 'application/octet-stream' });

const NORMAL = new Blob([new Float32Array([
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
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
        { bufferView: 3, byteOffset: 0, componentType: GL.FLOAT, count: 4, type: 'VEC3', min: [0, 0, 1], max: [0, 0, 1] },
    ],
    buffers: [
        { uri: URL.createObjectURL(INDICES),    byteLength: 12 },
        { uri: URL.createObjectURL(POSITION),   byteLength: 48 },
        { uri: URL.createObjectURL(TEXCOORD_0), byteLength: 32 },
        { uri: URL.createObjectURL(NORMAL),     byteLength: 48 },
    ],
    bufferViews: [
        { buffer: 0, byteLength: 12, target: GL.ELEMENT_ARRAY_BUFFER  },
        { buffer: 1, byteLength: 48, target: GL.ARRAY_BUFFER  },
        { buffer: 2, byteLength: 32, target: GL.ARRAY_BUFFER  },
        { buffer: 3, byteLength: 48, target: GL.ARRAY_BUFFER  },
    ],
}).load();

const SpriteDefaultValues = {
    pixelToUnitRatio: 0.01,
    alphaMode:        'mask',
    alphaCutoff:      0.5,
    doubleSided:      true,
    filter: {
        magFilter:    'nearest',
        minFilter:    'nearest',
        mipmapFilter: 'nearest',
    }
}

/**
 * @extends {Asset<import('./game-object.js').GameObjectAssetDefinition & {
 *  value:    SpriteAssetJSON,
 *  data:     { mesh: Mesh, width: number, height: number },
 *  instance: { node: Node },
 *  defaults: typeof SpriteDefaultValues,
 * }>}
 */
export class SpriteAsset extends Asset {
    /**
     * @param {Revelry.ECS.ComponentJSON<'sprite'>} component
     */
    constructor(component) {
        super(component, SpriteDefaultValues);
    }

    get key() {
        return `${super.key}#a=${this.value.alphaMode}&c=${this.value.alphaCutoff}&d=${this.value.doubleSided}&f=${encodeURIComponent(JSON.stringify(this.value.filter))}`;
    }

    /**
     * @param {SpriteAssetJSON} value
     */
    set(value) {
        this.adjustPixelToUnitRatio(this.value.pixelToUnitRatio);
        super.set(value);
    }

    /**
     * @type {Mesh|null}
     */
    #isolated = null;
    #isolatePrimitive() {
        const sharedPrimitive = this.data?.mesh.primitives[0];
        if(!sharedPrimitive) throw new Error('Sprite has not been loaded yet');

        this.#isolated ??= new Mesh({
                primitives: [new MeshPrimitive({
                indices:    sharedPrimitive.indices, mode: 4,
                attributes: sharedPrimitive.attributes,
                material:   new Material({ ...sharedPrimitive.material }),
            })]
        });

        return /** @type {Mesh & { primitives: { [0]: { material: NonNullable<MeshPrimitive['material']> } } } } */(this.#isolated);
    }
    /**
     * This will isolate the mesh primitive of this sprite instance from other instances. To allow adjusting the alphaCutoff at runtime.
     *
     * Once the set is called on the sprite instance, the mesh primitive will be destroyed and the instance will share the same mesh primitive again with other sprites that have the same key.
     *
     * This is useful during editing to fine tune the alphaCutoff value visually.
     * @param {number} value
     */
    adjustAlphaCutoff(value) {
        const isolated = this.#isolatePrimitive();
        isolated.primitives[0].material.alphaCutoff = value;
        /** @type {Node} */(this.instance?.node).mesh = isolated;
        this.notify('node:change');
        this.notify('material:change', isolated.primitives[0].material);
    }

    /**
     * @param {number} value
     */
    adjustPixelToUnitRatio(value) {
        if(!this.data) return;
        this.value.pixelToUnitRatio = value;
        /** @type {Node} */(this.instance?.node).scale = [value * this.data.width, value * this.data.height, 1];
        this.notify('node:change');
    }

    /**
     * @param {AbortSignal} [signal]
     */
    async load(signal) {
        const geometry = await GEOMETRY_GLTF;

        if(!this.path) {
            //return an empty mesh
            return {
                width: 0, height: 0,
                mesh: new Mesh({ primitives: [new MeshPrimitive({ attributes: { POSITION: geometry.accessors[1] } })] }),
            };
        }

        const { alphaMode, alphaCutoff, doubleSided, filter } = this.value;
        const { minFilter, magFilter, mipmapFilter } = filter;

        const paths = this.path.toString().split(',');

        let path;
        if(paths.length > 1) {
            const images = await Promise.all(paths.map(async (path) => {
                const blob = await fetch(import.meta.resolve(path)).then((res) => res.blob());
                return createImageBitmap(blob);
            }));
            const canvas = document.createElement('canvas');

            const { width, height } = images.reduce(({ width, height }, image) => {
                return { width: Math.max(image.width, width), height: Math.max(image.height, height) };
            }, { width: 0, height: 0 });

            canvas.width  = width;
            canvas.height = height;

            const context = canvas.getContext('2d');
            for(const image of images) {
                context?.drawImage(image, 0, 0);
            }
            const blob = await new Promise((resolve) => {
                canvas.toBlob(resolve);
            });
            path = URL.createObjectURL(blob);
        } else {
            path = paths[0];
        }

        const material = await GLTF.fromJSON({
            asset: ASSET_GENERATOR,
            images: [
                { uri: import.meta.resolve(path) },
            ],
            samplers: [
                {
                    magFilter: SAMPLER_PARAMS.magFilterMode[magFilter],
                    minFilter: mipmapFilter ? SAMPLER_PARAMS.minFilterMode[`${minFilter}:${mipmapFilter}`] : SAMPLER_PARAMS.minFilterMode[minFilter],
                    wrapS:     SAMPLER_PARAMS.addressMode['clamp-to-edge'],
                    wrapT:     SAMPLER_PARAMS.addressMode['clamp-to-edge'],
                },
            ],
            textures: [
                { sampler: 0, source: 0 },
            ],
            materials: [{
                pbrMetallicRoughness: { baseColorTexture: { index: 0 } },
                alphaMode: /** @type {'MASK'|'BLEND'|'OPAQUE'} */(alphaMode.toUpperCase()), alphaCutoff,  doubleSided,
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

        const { width, height, mesh } = this.data;
        const { pixelToUnitRatio    } = this.value;

        const node = new Node({ mesh, scale: [pixelToUnitRatio * width, pixelToUnitRatio * height, 1] });
        this.#isolated = null;
        return { node };
    }
}

export class SpriteModel extends Model.Typed({
    components: {
        meta:      { type: 'meta'      },
        transform: { type: 'transform' },
        sprite:    { type: 'sprite'    },
    }

}) {
    node = new GameObjectAssetNode({ type: 'sprite', asset: this.sprite, meta: this.meta, transform: this.transform });
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
        this.stage?.getContext('renderer').addGameObjectAssetNode(model.node);
    }
}

/** @satisfies {Revelry.ECS.SystemBundle} */
export const bundle = {
    systems: [SpriteSystem],
    initializers: { sprite: (c) => new SpriteAsset(c) }
}
