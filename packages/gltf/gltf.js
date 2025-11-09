/**
 * The root object for a glTF asset.
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-gltf
 *
 * @module
 */

import { GLTFProperty } from './gltf-property.js';
import { Accessor     } from  './accessor.js';
import { Animation    } from  './animation.js';
import { Asset        } from  './asset.js';
import { Buffer       } from  './buffer.js';
import { BufferView   } from  './buffer-view.js';
import { Camera       } from  './camera.js';
import { Image        } from  './image.js';
import { Material     } from  './material.js';
import { Mesh         } from  './mesh.js';
import { Node         } from  './node.js';
import { Sampler      } from  './sampler.js';
import { Scene        } from  './scene.js';
import { Skin         } from  './skin.js';
import { Texture      } from  './texture.js';

import { registry } from './extensions/registry.js';
import './extensions/all.js';

import { GLTF_SUPPORTED_VERSION, GLTF_MAGIC_NUMBER_BINARY_FORMAT } from './constants.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, FromJSONGraph } from './gltf-property.js';
 * @import { glTFExtensions, GLTFExtensions } from 'virtual-rev-gltf-extensions';
 */

/**
 * @param {{ asset: import('./asset.js').asset, extensionsRequired?: string[] }} gltf
 */
function ensureSupport({ asset: { version, minVersion }, extensionsRequired = [] }) {
    const [major, minor] = (minVersion ?? version).split('.').map(v => Number(v));

    if ((major !== GLTF_SUPPORTED_VERSION.major) || (minVersion && (minor > GLTF_SUPPORTED_VERSION.minor))) {
        throw new Error(`Unsupported glTF version ${minVersion ?? version}`);
    }

    for(const ext of extensionsRequired) {
        if(!registry.isSupported(ext)) {
            throw new Error(`Unsupported glTF extension ${ext}`);
        }
    }
}

/**
 * @import { asset      } from './asset.js';
 * @import { accessor   } from './accessor.js';
 * @import { animation  } from './animation.js';
 * @import { buffer     } from './buffer.js';
 * @import { bufferView } from './buffer-view.js';
 * @import { camera     } from './camera.js';
 * @import { image      } from './image.js';
 * @import { material   } from './material.js';
 * @import { mesh       } from './mesh.js';
 * @import { node       } from './node.js';
 * @import { sampler    } from './sampler.js';
 * @import { scene      } from './scene.js';
 * @import { skin       } from './skin.js';
 * @import { texture    } from './texture.js';
 */

/**
 * @typedef {object} glTF - glTF JSON representation.
 * @property {asset} asset - Metadata about the glTF asset.
 * @property {accessor[]} [accessors] - An array of Accessors.
 * @property {animation[]} [animations] - An array of keyframe Animations.
 * @property {buffer[]} [buffers] - An array of Buffers.
 * @property {bufferView[]} [bufferViews] - An array of BufferViews.
 * @property {camera[]} [cameras] - An array of Cameras.
 * @property {image[]} [images] - An array of Images.
 * @property {material[]} [materials] - An array of Materials.
 * @property {mesh[]} [meshes] - An array of meshes.
 * @property {node[]} [nodes] - An array of nodes.
 * @property {sampler[]} [samplers] - An array of Samplers.
 * @property {scene[]} [scenes] - An array of scenes.
 * @property {skin[]} [skins] - An array of skins.
 * @property {texture[]} [textures] - An array of Textures.
 * @property {number} [scene] - The default scene.
 * @property {string[]} [extensionsUsed] - Names of glTF extensions used somewhere in this asset.
 * @property {string[]} [extensionsRequired] - Names of glTF extensions required to properly load this asset.
 * @property {glTFExtensions} [extensions] - Extension-specific data.
 */

/**
 * GLTF class representation.
 */
export class GLTF extends GLTFProperty {
    /**
     * Creates a new instance of GLTF.
     * @param {{
     *  asset:               Asset,
     *  accessors?:          Accessor[],
     *  animations?:         Animation[],
     *  buffers?:            Buffer[],
     *  bufferViews?:        BufferView[],
     *  cameras?:            Camera[],
     *  images?:             Image[],
     *  materials?:          Material[],
     *  meshes?:             Mesh[],
     *  nodes?:              Node[],
     *  samplers?:           Sampler[],
     *  scenes?:             Scene[],
     *  skins?:              Skin[],
     *  textures?:           Texture[],
     *  scene?:              Scene,
     *  extensionsUsed?:     string[],
     *  extensionsRequired?: string[],
     *  extensions?:         GLTFExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled glTF object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const {
            extensionsUsed = [], extensionsRequired = [], accessors = [], animations = [],
            asset, buffers = [], bufferViews = [], cameras = [], images = [], materials = [], meshes = [],
            nodes = [], samplers = [], scene, scenes = [], skins = [], textures = [], extensions
        } = unmarshalled;

        /**
         * Metadata about the glTF asset.
         */
        this.asset = asset;

        /**
         * Names of glTF extensions used somewhere in this asset.
         */
        this.extensionsUsed = extensionsUsed;

        /**
         * Names of glTF extensions required to properly load this asset.
         */
        this.extensionsRequired = extensionsRequired;

        /**
         * An array of Accessors.
         */
        this.accessors = accessors;

        /**
         * An array of keyframe Animations.
         */
        this.animations = animations;

        /**
         * An array of Buffers.
         */
        this.buffers = buffers;

        /**
         * An array of BufferViews.
         */
        this.bufferViews = bufferViews;

        /**
         * An array of Cameras.
         */
        this.cameras = cameras;

        /**
         * An array of Images.
         */
        this.images = images;

        /**
         * An array of Materials.
         */
        this.materials = materials;

        /**
         * An array of meshes.
         */
        this.meshes = meshes;

        /**
         * An array of nodes.
         */
        this.nodes = nodes;

        /**
         * An array of Samplers.
         */
        this.samplers = samplers;

        /**
         * An array of scenes.
         */
        this.scenes = scenes;

        /**
         * An array of skins.
         */
        this.skins = skins;

        /**
         * An array of Textures.
         */
        this.textures = textures;

        /**
         * The default scene.
         */
        this.scene = scene ?? this.scenes[0];

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {glTF & glTFPropertyData} glTF - The glTF JSON representation.
     * @param {Omit<FromJSONGraph, 'root'>} [graph] - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(glTF, graph) {
        ensureSupport(glTF);

        return this.unmarshall({ ...(graph ?? {}), root: glTF }, glTF, {
            asset:       { factory: Asset      },
            accessors:   { factory: Accessor   },
            animations:  { factory: Animation  },
            buffers:     { factory: Buffer     },
            bufferViews: { factory: BufferView },
            cameras:     { factory: Camera     },
            images:      { factory: Image      },
            materials:   { factory: Material   },
            meshes:      { factory: Mesh       },
            nodes:       { factory: Node       },
            samplers:    { factory: Sampler    },
            scenes:      { factory: Scene      },
            skins:       { factory: Skin       },
            textures:    { factory: Texture    },
            scene:       { factory: Scene, collection: 'scenes' },
        }, this);
    }

    /**
     * Fetches a glTF file from a URL, then fetches all binary data, and returns a new GLTF instance.
     * @param {string|URL} url - The URL of the glTF file to be loaded.
     * @param {AbortSignal} [signal] - AbortSignal to cancel the load request.
     * @see https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#glb-file-format-specification
     */
    static async load(url, signal) {
        const response = await fetch(url, { signal });
        const buffer   = await response.arrayBuffer();
        return this.loadFromBuffer(buffer, url, signal);
    }

    /**
     * Returns a new GLTF instance.
     * @param {ArrayBuffer} buffer - The buffer to parse the file from.
     * @param {string|URL} uri - The URI where the file was loaded from. Used for relative file references.
     * @param {AbortSignal} [signal] - AbortSignal to cancel the load request.
     * @see https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#glb-file-format-specification
     */
    static async loadFromBuffer(buffer, uri, signal) {
        const header = new Uint32Array(buffer, 0, 4);

        uri = new URL(uri);

        let gltf;
        if (header[0] === GLTF_MAGIC_NUMBER_BINARY_FORMAT) {
            const length  = header[3];
            const decoder = new TextDecoder();
            const json    = JSON.parse(decoder.decode(new Uint8Array(buffer, 5 * 4, length)));

            gltf = this.fromJSON(json, { uri });

            //Copy into array buffer
            new Uint8Array(gltf.buffers[0].getArrayBuffer()).set(new Uint8Array(buffer, 7 * 4 + length, gltf.buffers[0].byteLength));
        } else {
            const json = JSON.parse(new TextDecoder().decode(buffer));

            gltf = this.fromJSON(json, { uri });
        }

        return gltf.load(signal);
    }

    /**
     * Fetches all binary data into memory.
     * @param {AbortSignal} [signal] - AbortSignal to cancel the load request.
     * @override
     */
    async load(signal) {
        const collections = /** @type {const} */([
            'accessors',
            'animations',
            'buffers',
            'bufferViews',
            'cameras',
            'images',
            'materials',
            'meshes',
            'nodes',
            'samplers',
            'scenes',
            'skins',
            'textures',
        ]);

        await Promise.all(collections.map(collection => Promise.all(this[collection].map(item => {
            return item.loadOnce(signal);
        }))));

        return super.load(signal);
    }
}

export * from './gltf-property.js';
export * from './accessor.js';
export * from './accessor-sparse.js';
export * from './accessor-sparse-indices.js';
export * from './accessor-sparse-values.js';
export * from './animation.js';
export * from './animation-channel.js';
export * from './animation-channel-target.js';
export * from './animation-sampler.js';
export * from './asset.js';
export * from './buffer.js';
export * from './buffer-view.js';
export * from './camera.js';
export * from './camera-orthographic.js';
export * from './camera-perspective.js';
export * from './image.js';
export * from './material.js';
export * from './material-normal-texture-info.js';
export * from './material-occlusion-texture-info.js';
export * from './material-pbr-metallic-roughness.js';
export * from './mesh.js';
export * from './mesh-primitive.js';
export * from './mesh-primitive-target.js';
export * from './node.js';
export * from './sampler.js';
export * from './scene.js';
export * from './skin.js';
export * from './texture.js';
export * from './texture-info.js';
export * from './extensions/registry.js';
export * from './extensions/KHR/KHR_animation_pointer.js';
export * from './extensions/KHR/KHR_audio.js';
export * from './extensions/KHR/KHR_draco_mesh_compression.js';
export * from './extensions/KHR/KHR_environment_map.js';
export * from './extensions/KHR/KHR_lights_punctual.js';
export * from './extensions/KHR/KHR_materials_clearcoat.js';
export * from './extensions/KHR/KHR_materials_emissive_strength.js';
export * from './extensions/KHR/KHR_materials_ior.js';
export * from './extensions/KHR/KHR_materials_iridescence.js';
export * from './extensions/KHR/KHR_materials_sheen.js';
export * from './extensions/KHR/KHR_materials_specular.js';
export * from './extensions/KHR/KHR_materials_transmission.js';
export * from './extensions/KHR/KHR_materials_unlit.js';
export * from './extensions/KHR/KHR_materials_variants.js';
export * from './extensions/KHR/KHR_materials_volume.js';
export * from './extensions/KHR/KHR_texture_basisu.js';
export * from './extensions/KHR/KHR_texture_transform.js';
export * from './extensions/KHR/KHR_xmp_json_ld.js';
export * from './extensions/KHR/archived/KHR_materials_pbrSpecularGlossiness.js';
export * from './extensions/KHR/archived/KHR_xmp.js';
export * from './extensions/EXT/EXT_texture_webp.js';
export * from './extensions/REV/REV_game_object.js';
