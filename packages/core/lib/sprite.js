import { Model, System } from '../deps/ecs.js';
import { GLTF, Mesh, MeshPrimitive, Material, Node as GLTFNode, Sampler, Texture, Image, TextureInfo, MaterialPBRMetallicRoughness } from '../deps/gltf.js';
import { SAMPLER_PARAMS } from '../deps/renderer.js';
import { NonNull, WeakCache } from '../deps/utils.js';
import { GameObjectModel } from './game-object.js';

/**
 * @import { ComponentTypeSchema, SystemBundle } from '../deps/ecs.js';
 */

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

const GEOMETRY_GLTF = await GLTF.fromJSON({
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
    meshes: [
        { primitives: [{ indices: 0, attributes: { POSITION: 1, TEXCOORD_0: 2 }, mode: 4 }] },
    ]
}).load();

export const SpriteSchema = /** @type {const} @satisfies {ComponentTypeSchema}*/({
    type: 'object',
    properties: {
        asset: { type: 'string', asset: 'revelry/sprite' },

        pixelToUnitRatio: { type: 'number', default: 0.01 },
        alphaMode:        { type: 'string', enum: ['mask', 'blend', 'opaque'], default: 'mask' },
        alphaCutoff:      { type: 'number', default: 0.5 },
        doubleSided:      { type: 'boolean', default: true },
        filter: {
            type: 'object',
            properties: {
                magFilter:    { type: 'string', enum: ['nearest', 'linear'], default: 'nearest' },
                minFilter:    { type: 'string', enum: ['nearest', 'linear'], default: 'nearest' },
                mipmapFilter: { type: 'string', enum: ['nearest', 'linear'], default: 'nearest' },
            },
            default: { magFilter: 'nearest', minFilter: 'nearest', mipmapFilter: 'nearest' },
            observed: ['magFilter', 'minFilter', 'mipmapFilter'],
        },
    },
    observed: ['asset', 'pixelToUnitRatio', 'alphaMode', 'alphaCutoff', 'doubleSided', 'filter'],
});

/**
 * @param {{uri: string, signal: AbortSignal }} params
 */
export async function SpriteLoader({ uri, signal }) {
    const paths = uri.toString().split(',');

    let path;
    if(paths.length > 1) {
        const images = await Promise.all(paths.map(async (path) => {
            const blob = await fetch(import.meta.resolve(path), { signal }).then((res) => res.blob());
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

    return GLTF.fromJSON({
        asset: ASSET_GENERATOR,
        images: [
            { uri: import.meta.resolve(path) },
        ],
    }).load(signal);
}

export class SpriteNode extends GLTFNode {
    /**
     * @param {SpriteModel} model
     */
    constructor(model) {
        super({});
        this.model = model;

        Object.defineProperties(this, {
            scale: {
                get: () => {
                    const imageData = /** @type {ImageBitmap|undefined} */(this.mesh?.primitives[0].material?.pbrMetallicRoughness?.baseColorTexture?.texture.source?.getImageData())
                    const { width, height    } = imageData ?? { width: 0, height: 0 };
                    const { pixelToUnitRatio } = this.model.components.sprite.value;
                    return [width * pixelToUnitRatio, height * pixelToUnitRatio, 1];
                }
            },
        });
    }
}

export class SpriteModel extends Model.Typed(/** @type {const} */({
    components: ['transform', 'meta', 'sprite'],
})) {
    node = new SpriteNode(this);
}

export class SpriteSystem extends System.Typed(/** @type {const} */({
    id: 'sprite',
    models: {
        sprites: { model: SpriteModel, isSet: true },
    }
})) {
    /**
     * @param {SpriteModel} model
     */
    onModelAdd(model) {
        const gameObject = NonNull(this.stage.getEntityModel(model.entity, GameObjectModel));
        gameObject.addChildNode(model.node);

        this.#createSprite(model)
        model.components.sprite.watch(() => this.#createSprite(model));
    }

    /**
     * @param {SpriteModel} model
     */
    onModelDelete(model) {
        const gameObject = this.stage.getEntityModel(model.entity, GameObjectModel);
        gameObject?.deleteChildNode(model.node);
    }

    /**
     * @param {SpriteModel} model
     */
    #createSprite(model) {
        const gameObject = NonNull(this.stage.getEntityModel(model.entity, GameObjectModel));

        const gltf = model.components.sprite.references['/asset']?.data;
        if(gltf) {
            const image    = gltf.images[0];
            const sampler  = this.#getSamplerFromCache(model.components.sprite.value.filter);
            const texture  = this.#getTextureFromCache(image, sampler);
            const options  = this.#getOptionsFromCache(texture, model.components.sprite.value);
            const material = this.#getMaterialFromCache(texture, options);

            model.node.mesh = this.#getMeshFromCache(material);

            gameObject.notify('node:update');
        }
    }

    /**
     * There are only so many combinations of filters that can be used. This will cache the sampler objects to avoid creating new ones.
     * @type {Map<string, Sampler>}
     */
    #samplerCache = new Map();
    /**
     * @param {{ magFilter: 'nearest' | 'linear', minFilter: 'nearest' | 'linear', mipmapFilter: 'nearest' | 'linear' }} filter
     */
    #getSamplerFromCache(filter) {
        const key = `${filter.magFilter}:${filter.minFilter}:${filter.mipmapFilter}`;
        return this.#samplerCache.get(key) ?? NonNull(this.#samplerCache.set(key, new Sampler({
            magFilter: SAMPLER_PARAMS.magFilterMode[filter.magFilter],
            minFilter: filter.mipmapFilter ? SAMPLER_PARAMS.minFilterMode[`${filter.minFilter}:${filter.mipmapFilter}`] : SAMPLER_PARAMS.minFilterMode[filter.minFilter],
            wrapS:     SAMPLER_PARAMS.addressMode['clamp-to-edge'],
            wrapT:     SAMPLER_PARAMS.addressMode['clamp-to-edge'],
        })).get(key));
    }

    /**
     * @type {WeakCache<Map<string, { alphaMode: 'MASK'|'BLEND'|'OPAQUE', alphaCutoff: number,  doubleSided: boolean }>>}
     */
    #optionsCache = new WeakCache();
    /**
     * @param {Texture} texture
     * @param {{ alphaMode: 'mask'|'blend'|'opaque', alphaCutoff: number,  doubleSided: boolean }} options
     */
    #getOptionsFromCache(texture, options) {
        const cache = this.#optionsCache.ensure(texture, () => new Map());
        const { alphaMode, alphaCutoff, doubleSided } = options;
        const key = `${alphaMode}:${doubleSided}:${alphaCutoff}`;
        return cache.get(key) ?? NonNull(cache.set(key, { alphaMode: /** @type {'MASK'|'BLEND'|'OPAQUE'} */(alphaMode.toUpperCase()), alphaCutoff, doubleSided }).get(key));
    }

    /**
     * @type {WeakCache<Texture>}
     */
    #textureCache = new WeakCache();
    /**
     * @param {Image} image
     * @param {Sampler} sampler
     */
    #getTextureFromCache(image, sampler) {
        return this.#textureCache.ensure(image, sampler, () => new Texture({ source: image, sampler }));
    }

    /**
     * @type {WeakCache<Material>}
     */
    #MaterialCache = new WeakCache();
    /**
     * @param {Texture} texture
     * @param {{ alphaMode: 'MASK'|'BLEND'|'OPAQUE', alphaCutoff: number,  doubleSided: boolean }} options
     */
    #getMaterialFromCache(texture, options) {
        return this.#MaterialCache.ensure(texture, options, () => new Material({
            pbrMetallicRoughness: new MaterialPBRMetallicRoughness({ baseColorTexture: new TextureInfo({ texture }) }),
            ...options,
        }));
    }

    /**
     * @type {WeakCache<Mesh>}
     */
    #meshCache = new WeakCache();
    /**
     * @param {Material} material
     */
    #getMeshFromCache(material) {
        return this.#meshCache.ensure(material, () => new Mesh({
            primitives: [
                new MeshPrimitive({
                    indices: GEOMETRY_GLTF.accessors[0], mode: 4,
                    attributes: { POSITION: GEOMETRY_GLTF.accessors[1], TEXCOORD_0: GEOMETRY_GLTF.accessors[2] },
                    material,
                })
            ]
        }));
    }
}

/** @satisfies {SystemBundle} */
export const bundle = {
    systems: [SpriteSystem],
    schemas: {
        sprite: SpriteSchema,
    },
    loaders: {
        'revelry/sprite': SpriteLoader,
    },
}
