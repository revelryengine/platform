import { GLTFProperty     } from '../gltf-property.js';
import { BufferView       } from '../buffer-view.js';
import { Accessor         } from '../accessor.js';
import { extensions       } from '../extensions.js';
import { WorkerHelperPool } from '../../deps/utils.js';

/**
 * @see https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression
 * The three.js implementation was used as a reference. @see https://github.com/mrdoob/three.js/blob/dev/examples/js/loaders/DRACOLoader.js
 */


const workerHelper = new WorkerHelperPool(import.meta.resolve('./KHR_draco_mesh_compression.worker.js'), 4);

/**
 * @typedef {{
 *  bufferView:  number,
 *  attributes:  {[K in import('../mesh-primitive.js').AttributeName]?: number},
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
     *  attributes:  {[K in import('../mesh-primitive.js').AttributeName]?: number},
     *  primitive:   { indices: Accessor, attributes: { [K in import('../mesh-primitive.js').AttributeName]?: Accessor } },
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
            const accessor = this.primitive.attributes[/** @type {import('../mesh-primitive.js').AttributeName} */(name)];
            const typedArray =  /** @type {Accessor} */(accessor).getTypedArray();
            return [name, { typedArray, id }];
        }));

        const indices = this.primitive.indices.getTypedArray();
        const response = await workerHelper.callMethod({
            method: 'decode', args: [{ arrayBuffer, byteOffset, byteLength, attributes, indices }], transfer: [arrayBuffer], signal
        });

        if(typeof SharedArrayBuffer === 'undefined') {
            for (const [name, arrayBuffer] of Object.entries(response.attributes)) {
                const accessor = this.primitive.attributes[/** @type {import('../mesh-primitive.js').AttributeName} */(name)];
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
