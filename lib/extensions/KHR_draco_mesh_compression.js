import { GLTFProperty } from '../gltf-property.js';
import { BufferView   } from '../buffer-view.js';
import { Accessor     } from '../accessor.js';
import { WorkerHelper } from '../utils/worker-helper.js';
import { extensions   } from '../extensions.js';

/**
 * @see https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression
 * The three.js implementation was used as a reference. @see https://github.com/mrdoob/three.js/blob/dev/examples/js/loaders/DRACOLoader.js
 */

/**
 * @typedef {typeof Float32Array|typeof Int8Array|typeof Int16Array|typeof Int32Array|typeof Uint8Array|typeof Uint16Array|typeof Uint32Array} TypedArray
 * @typedef {'DracoFloat32Array'|'DracoInt8Array'|'DracoInt16Array'|'DracoInt32Array'|'DracoUInt8Array'|'DracoUInt16Array'|'DracoUInt32Array'} DracoType
 * @typedef {(
 *  'GetAttributeFloatForAllPoints' |
 *  'GetAttributeInt8ForAllPoints'  |
 *  'GetAttributeInt16ForAllPoints' |
 *  'GetAttributeInt32ForAllPoints' |
 *  'GetAttributeUInt8ForAllPoints' |
 *  'GetAttributeUInt16ForAllPoints'|
 *  'GetAttributeUInt32ForAllPoints'
 * )} DracoMethod
 *
 * @typedef {import('../../deps/draco3d.js').DracoDecoderModule} DracoDecoderModule
 * @typedef {import('../../deps/draco3d.js').DecoderModule} DecoderModule
 * @typedef {import('../../deps/draco3d.js').Mesh} Mesh
 * @typedef {import('../../deps/draco3d.js').PointCloud} PointCloud
 * @typedef {import('../../deps/draco3d.js').Status} Status
 */

const DRACO_DECODER_URL = import.meta.resolve('../../deps/draco3d.js');
const workerHelper = new WorkerHelper({
    count:  4,
    constants: `const DRACO_DECODER_URL = '${DRACO_DECODER_URL}';`,

    worker: () => {
        const DracoArrayGetters = /** @type {Map<TypedArray, { dracoType: DracoType, method: DracoMethod }>} */(new Map());
        DracoArrayGetters.set(Float32Array, { dracoType: 'DracoFloat32Array', method: 'GetAttributeFloatForAllPoints'  });
        DracoArrayGetters.set(Int8Array,    { dracoType: 'DracoInt8Array',    method: 'GetAttributeInt8ForAllPoints'   });
        DracoArrayGetters.set(Int16Array,   { dracoType: 'DracoInt16Array',   method: 'GetAttributeInt16ForAllPoints'  });
        DracoArrayGetters.set(Int32Array,   { dracoType: 'DracoInt32Array',   method: 'GetAttributeInt32ForAllPoints'  });
        DracoArrayGetters.set(Uint8Array,   { dracoType: 'DracoUInt8Array',   method: 'GetAttributeUInt8ForAllPoints'  });
        DracoArrayGetters.set(Uint16Array,  { dracoType: 'DracoUInt16Array',  method: 'GetAttributeUInt16ForAllPoints' });
        DracoArrayGetters.set(Uint32Array,  { dracoType: 'DracoUInt32Array',  method: 'GetAttributeUInt32ForAllPoints' });

        /** @type {DecoderModule} */
        let draco;
        import(DRACO_DECODER_URL).then(async ({ Draco3dFactory }) => {
            draco = await Draco3dFactory()
            self.postMessage({ taskId: 0 });
        });


        self.onmessage = (message) => {
            const { type, taskId } = message.data;
            if(type === 'decode') {
                try {
                    const { arrayBuffer, byteOffset, byteLength, attributes, indices } = message.data;

                    const decoder = new draco.Decoder();
                    const decoderBuffer = new draco.DecoderBuffer();

                    decoderBuffer.Init(new Int8Array(arrayBuffer, byteOffset, byteLength), byteLength);

                    const geometryType = decoder.GetEncodedGeometryType(decoderBuffer);

                    /**
                     * @type {({ type: 'mesh', geometry: Mesh } | { type: 'point', geometry: PointCloud }) & { status: Status }}
                     */
                    let state;

                    if (geometryType === draco.TRIANGULAR_MESH) {
                        const geometry = new draco.Mesh();
                        const status   = decoder.DecodeBufferToMesh(decoderBuffer, geometry);
                        state = { type: 'mesh', geometry, status }
                    } else if (geometryType === draco.POINT_CLOUD) {
                        const geometry = new draco.PointCloud();
                        const status   = decoder.DecodeBufferToPointCloud(decoderBuffer, geometry);
                        state = { type: 'point', geometry, status }
                    } else {
                        throw new Error(`Unexpected geometry type. ${geometryType}`);
                    }
                    if (!state.status.ok() || state.geometry.ptr === 0) {
                        throw new Error('Decoding failed: ' + state.status.error_msg());
                    }
                    const numPoints = state.geometry.num_points();

                    for (const [name, { typedArray, id }] of Object.entries(attributes)) {

                        const { dracoType, method } = /** @type {{ dracoType: DracoType, method: DracoMethod }} */(DracoArrayGetters.get(typedArray.constructor));

                        const attribute = decoder.GetAttributeByUniqueId(state.geometry, id);
                        const numComponents = attribute.num_components();
                        const numValues = numPoints * numComponents;

                        const dracoArray = new draco[dracoType]();

                        decoder[method](state.geometry, attribute, dracoArray);

                        for (let i = 0; i < numValues; i++) {
                            typedArray[i] = dracoArray.GetValue(i);
                        }

                        attributes[name] = typedArray;

                        draco.destroy(dracoArray);
                    }

                    if (state.type === 'mesh') {
                        const numFaces = state.geometry.num_faces();
                        const typedArray = indices;
                        const dracoArray = new draco.DracoInt32Array();

                        for (let i = 0; i < numFaces; i++) {
                            decoder.GetFaceFromMesh(state.geometry, i, dracoArray);

                            for (let j = 0; j < 3; j++) {
                                typedArray[i * 3 + j] = dracoArray.GetValue(j);
                            }
                        }

                        draco.destroy(dracoArray);
                    }

                    draco.destroy(state.geometry);

                    self.postMessage({ attributes, indices, taskId });
                } catch(error) {
                    self.postMessage({ error, taskId });
                }
            }
        }
    },
});

/**
 * @typedef {import('../mesh-primitive.js').AttributeName} AttributeName
 * @typedef {{
 *  bufferView:  number,
 *  attributes:  {[K in AttributeName]?: number},
 *  extensions?: Revelry.GLTF.Extensions.khrDracoMeshCompressionPrimitive,
 * } & import('../gltf-property.js').glTFPropertyData} khrDracoMeshCompressionPrimitive
 */

/**
 * This extension defines a schema to use Draco geometry compression (non-normative) libraries in glTF format.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_draco_mesh_compression
 */
export class KHRDracoMeshCompressionPrimitive extends GLTFProperty {
    primitive;

    /**
     * @param {{
     *  bufferView:  BufferView,
     *  attributes:  {[K in AttributeName]?: number},
     *  primitive:   { indices: Accessor, attributes: { [K in AttributeName]?: Accessor } },
     *  extensions?: Revelry.GLTF.Extensions.KHRDracoMeshCompressionPrimitive,
     * } & import('../gltf-property.js').GLTFPropertyData} khrDracoMeshCompressionPrimitive
     */
    constructor(khrDracoMeshCompressionPrimitive) {
        super(khrDracoMeshCompressionPrimitive);

        const { bufferView, attributes, primitive, extensions } = khrDracoMeshCompressionPrimitive;

        /**
         * The BufferView.
         */
        this.bufferView = bufferView;

        /**
         * A dictionary object, where each key corresponds to an attribute and its unique
         * attribute or attributes id stored in the compressed geometry.
         */
        this.attributes = attributes;

        this.primitive = primitive;

        this.extensions = extensions;
    }

    /**
     * @param {khrDracoMeshCompressionPrimitive} khrDracoMeshCompressionPrimitive
     * @param {import('../gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(khrDracoMeshCompressionPrimitive, options) {
        const primitive  = /** @type {import('../mesh-primitive.js').meshPrimitive} */(options.parent);
        return new this({
            ...this.unmarshall(khrDracoMeshCompressionPrimitive, options, {
                bufferView: { factory: BufferView, collection: 'bufferViews' },
            }, 'KHRDracoMeshCompressionPrimitive'),
            primitive: {
                ...this.unmarshall({ indices: /** @type {number} */(primitive.indices) }, options, {
                    indices: { factory: Accessor, collection: 'accessors' },
                }),
                attributes: this.unmarshall(primitive.attributes, options, {
                    POSITION:   { factory: Accessor, collection: 'accessors' },
                    NORMAL:     { factory: Accessor, collection: 'accessors' },
                    TANGENT:    { factory: Accessor, collection: 'accessors' },
                    TEXCOORD_0: { factory: Accessor, collection: 'accessors' },
                    TEXCOORD_1: { factory: Accessor, collection: 'accessors' },
                    COLOR_0:    { factory: Accessor, collection: 'accessors' },
                    COLOR_1:    { factory: Accessor, collection: 'accessors' },
                    WEIGHTS_0:  { factory: Accessor, collection: 'accessors' },
                    WEIGHTS_1:  { factory: Accessor, collection: 'accessors' },
                    JOINTS_0:   { factory: Accessor, collection: 'accessors' },
                    JOINTS_1:   { factory: Accessor, collection: 'accessors' }
                }),
            }
        });
    }

    /**
     * @param {AbortSignal} [signal]
     */
    async load(signal) {
        await workerHelper.init();

        const { buffer, byteOffset = 0, byteLength } = this.bufferView;

        await Promise.all([
            buffer.loadOnce(signal), this.primitive.indices.loadOnce(signal),
            ...Object.values(this.primitive.attributes).map(accessor => accessor.loadOnce(signal)),
        ]);

        const arrayBuffer = buffer.getArrayBuffer();
        const attributes = Object.fromEntries(Object.entries(this.attributes).map(([name, id]) => {
            const accessor = this.primitive.attributes[/** @type {AttributeName} */(name)];
            const typedArray =  /** @type {Accessor} */(accessor).getTypedArray();
            return [name, { typedArray, id }];
        }));

        const indices = this.primitive.indices.getTypedArray();
        const response = await workerHelper.postMessage({
            type: 'decode', arrayBuffer, byteOffset, byteLength, attributes, indices
        }, signal);

        if(typeof SharedArrayBuffer === 'undefined') {
            for (const [name, arrayBuffer] of Object.entries(response.attributes)) {
                const accessor = this.primitive.attributes[/** @type {AttributeName} */(name)];
                const accessorArray = /** @type {Accessor} */(accessor).getArrayBuffer();
                new Uint8Array(accessorArray).set(new Uint8Array(arrayBuffer.buffer));
            }
        }

        const accessor = this.primitive.indices;
        new Uint8Array(accessor.getArrayBuffer()).set(new Uint8Array(response.indices.buffer));

        return this;
    }
}

extensions.add('KHR_draco_mesh_compression', {
    schema: {
        MeshPrimitive: KHRDracoMeshCompressionPrimitive,
    },
});
