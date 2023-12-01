import { GLTFProperty, NamedGLTFProperty } from './gltf-property.js';

import { Accessor                     } from  './accessor.js';
import { AccessorSparse               } from  './accessor-sparse.js';
import { AccessorSparseIndices        } from  './accessor-sparse-indices.js';
import { AccessorSparseValues         } from  './accessor-sparse-values.js';
import { Animation                    } from  './animation.js';
import { AnimationChannel             } from  './animation-channel.js';
import { AnimationChannelTarget       } from  './animation-channel-target.js';
import { AnimationSampler             } from  './animation-sampler.js';
import { Asset                        } from  './asset.js';
import { Buffer                       } from  './buffer.js';
import { BufferView                   } from  './buffer-view.js';
import { Camera                       } from  './camera.js';
import { CameraOrthographic           } from  './camera-orthographic.js';
import { CameraPerspective            } from  './camera-perspective.js';
import { Image                        } from  './image.js';
import { Material                     } from  './material.js';
import { MaterialNormalTextureInfo    } from  './material-normal-texture-info.js';
import { MaterialOcclusionTextureInfo } from  './material-occlusion-texture-info.js';
import { MaterialPBRMetallicRoughness } from  './material-pbr-metallic-roughness.js';
import { Mesh                         } from  './mesh.js';
import { MeshPrimitive                } from  './mesh-primitive.js';
import { MeshPrimitiveTarget          } from  './mesh-primitive-target.js';
import { Node                         } from  './node.js';
import { Sampler                      } from  './sampler.js';
import { Scene                        } from  './scene.js';
import { Skin                         } from  './skin.js';
import { Texture                      } from  './texture.js';
import { TextureInfo                  } from  './texture-info.js';

import { extensions } from './extensions.js';

import './extensions/KHR_animation_pointer.js';
import './extensions/KHR_audio.js';
import './extensions/KHR_draco_mesh_compression.js';
import './extensions/KHR_environment_map.js';
import './extensions/KHR_lights_punctual.js';
import './extensions/KHR_materials_clearcoat.js';
import './extensions/KHR_materials_emissive_strength.js';
import './extensions/KHR_materials_ior.js';
import './extensions/KHR_materials_iridescence.js';
import './extensions/KHR_materials_sheen.js';
import './extensions/KHR_materials_specular.js';
import './extensions/KHR_materials_transmission.js';
import './extensions/KHR_materials_unlit.js';
import './extensions/KHR_materials_variants.js';
import './extensions/KHR_materials_volume.js';
import './extensions/KHR_texture_basisu.js';
import './extensions/KHR_texture_transform.js';

import './extensions/KHR_xmp_json_ld.js';

import './extensions/archived/KHR_materials_pbrSpecularGlossiness.js';
import './extensions/archived/KHR_xmp.js';

import './extensions/REV_game_object.js';

const SUPPORTED_VERSION = { major: 2, minor: 0 };
const MAGIC_NUMBER_BINARY_FORMAT = 0x46546C67;

/**
 * @param {{ asset: import('./asset.js').asset, extensionsRequired?: Revelry.GLTF.Extensions.Supported[] }} gltf
 */
function ensureSupport({ asset: { version, minVersion }, extensionsRequired = [] }) {
    const [major, minor] = (minVersion ?? version).split('.').map(v => Number(v));

    if ((major !== SUPPORTED_VERSION.major) || (minVersion && (minor > SUPPORTED_VERSION.minor))) {
        throw new Error(`Unsupported glTF version ${minVersion ?? version}`);
    }

    for(const ext of extensionsRequired) {
        if(!extensions.isSupported(ext)) {
            throw new Error(`Unsupported glTF extension ${ext}`);
        }
    }
}

/**
 * @typedef {{
 *  asset:               import('./asset.js').asset,
 *  accessors?:          import('./accessor.js').accessor[],
 *  animations?:         import('./animation.js').animation[],
 *  buffers?:            import('./buffer.js').buffer[],
 *  bufferViews?:        import('./buffer-view.js').bufferView[],
 *  cameras?:            import('./camera.js').camera[],
 *  images?:             import('./image.js').image[],
 *  materials?:          import('./material.js').material[],
 *  meshes?:             import('./mesh.js').mesh[],
 *  nodes?:              import('./node.js').node[],
 *  samplers?:           import('./sampler.js').sampler[],
 *  scenes?:             import('./scene.js').scene[],
 *  skins?:              import('./skin.js').skin[],
 *  textures?:           import('./texture.js').texture[],
 *  scene?:              number,
 *  extensionsUsed?:     Revelry.GLTF.Extensions.Supported[],
 *  extensionsRequired?: Revelry.GLTF.Extensions.Supported[],
 *  extensions?:         Revelry.GLTF.Extensions.glTF,
 * } & import('./gltf-property.js').glTFPropertyData} glTF
 */

/**
 * The root object for a glTF asset.
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-gltf
 * @todo Automate generation of typedefs from spec
 */
export class GLTF extends GLTFProperty {
    /**
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
     *  extensionsUsed?:     Revelry.GLTF.Extensions.Supported[],
     *  extensionsRequired?: Revelry.GLTF.Extensions.Supported[],
     *  extensions?:         Revelry.GLTF.Extensions.GLTF,
     * } & import('./gltf-property.js').GLTFPropertyData} glTF
     */
    constructor(glTF) {
        super(glTF);

        const {
            extensionsUsed = [], extensionsRequired = [], accessors = [], animations = [],
            asset, buffers = [], bufferViews = [], cameras = [], images = [], materials = [], meshes = [],
            nodes = [], samplers = [], scene, scenes = [], skins = [], textures = [], extensions
        } = glTF;

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

        this.extensions = extensions;
    }

    /**
     * @param {glTF} glTF
     * @param {Omit<import('./gltf-property.js').FromJSONOptions, 'root'>} [options]
     */
    static fromJSON(glTF, options) {
        ensureSupport(glTF);

        return new this(this.unmarshall(glTF, { ...(options ?? {}), root: glTF }, {
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
        }, 'GLTF'));
    }

    /**
     * Fetches a glTF file from a URL, then fetches all binary data, and returns a new GLTF instance.
     * @param {string|URL} url - The URL of the glTF file to be loaded.
     * @param {AbortSignal} [signal]
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
     * @param {AbortSignal} [signal]
     * @see https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#glb-file-format-specification
     */
    static async loadFromBuffer(buffer, uri, signal) {
        const header = new Uint32Array(buffer, 0, 4);

        uri = new URL(uri);

        let gltf;
        if (header[0] === MAGIC_NUMBER_BINARY_FORMAT) {
            const length  = header[3];
            const decoder = new TextDecoder();
            const json    = JSON.parse(decoder.decode(new DataView(buffer, 5 * 4, length)));

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
     * @param {AbortSignal} [signal]
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

    static extensions = extensions;
}

export { Accessor                     }
export { AccessorSparse               }
export { AccessorSparseIndices        }
export { AccessorSparseValues         }
export { Animation                    }
export { AnimationChannel             }
export { AnimationChannelTarget       }
export { AnimationSampler             }
export { Asset                        }
export { Buffer                       }
export { BufferView                   }
export { Camera                       }
export { CameraOrthographic           }
export { CameraPerspective            }
export { Image                        }
export { Material                     }
export { MaterialNormalTextureInfo    }
export { MaterialOcclusionTextureInfo }
export { MaterialPBRMetallicRoughness }
export { Mesh                         }
export { MeshPrimitive                }
export { MeshPrimitiveTarget          }
export { Node                         }
export { Sampler                      }
export { Scene                        }
export { Skin                         }
export { Texture                      }
export { TextureInfo                  }

export { extensions, GLTFProperty, NamedGLTFProperty };
