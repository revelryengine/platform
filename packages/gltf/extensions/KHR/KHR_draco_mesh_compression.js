/// <reference path="./KHR_materials_ior.types.d.ts" />

/**
 * This extension defines a schema to use Draco geometry compression (non-normative) libraries in glTF format.
 *
 * [Reference Spec - KHR_draco_mesh_compression](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_draco_mesh_compression)
 *
 * @privateRemarks
 * The [three.js](https://github.com/mrdoob/three.js/blob/02201339d5429a610a71ec19f5bf36eb4e7d2b04/examples/jsm/loaders/DRACOLoader.js) implementation was used as a reference.
 *
 * @module
 */

import { GLTFProperty     } from '../../gltf-property.js';
import { BufferView       } from '../../buffer-view.js';
import { Accessor         } from '../../accessor.js';
import { registry         } from '../registry.js';
import { WorkerHelperPool } from 'revelryengine/utils/worker-helper.js';


const workerHelper = new WorkerHelperPool(import.meta.resolve('./KHR_draco_mesh_compression.worker.js'), { count: 4, type: 'module' });

/**
 * @import { glTFPropertyData, GLTFPropertyData, FromJSONGraph } from '../../gltf-property.js';
 * @import { meshPrimitiveKHRDracoMeshCompressionExtensions, MeshPrimitiveKHRDracoMeshCompressionExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @import { AttributeName, meshPrimitive, MeshPrimitiveAttributeIndices, MeshPrimitiveAttributeAccessors } from '../../mesh-primitive.js';
 */

/**
 * @typedef {object} meshPrimitiveKHRDracoMeshCompression - KHR_draco_mesh_compression JSON representation.
 * @property {number} bufferView - The index of the bufferView that contains the compressed mesh data.
 * @property {MeshPrimitiveAttributeIndices} attributes - A dictionary object, where each key corresponds to an attribute and its unique attribute id stored in the compressed geometry.
 * @property {meshPrimitiveKHRDracoMeshCompressionExtensions} [extensions] - Extension-specific data.
 */

/**
 * @typedef {object} MeshPrimitiveReference - A reference to the mesh primitive this extension is attached to.
 * @property {Accessor} indices - The accessor for the indices of the mesh primitive.
 * @property {MeshPrimitiveAttributeAccessors} attributes - A dictionary object, where each key corresponds to an Accessor for the mesh primitive.
 */

/**
 * KHR_draco_mesh_compression class representation.
 */
export class MeshPrimitiveKHRDracoMeshCompression extends GLTFProperty {
    /**
     * Creates a new instance of MeshPrimitiveKHRDracoMeshCompression.
     * @param {{
     *  bufferView:  BufferView,
     *  attributes:  MeshPrimitiveAttributeIndices,
     *  primitive:   MeshPrimitiveReference,
     *  extensions?: MeshPrimitiveKHRDracoMeshCompressionExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_draco_mesh_compression object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { bufferView, attributes, primitive, extensions } = unmarshalled;

        /**
         * The BufferView.
         */
        this.bufferView = bufferView;

        /**
         * A dictionary object, where each key corresponds to an attribute and its unique
         * attribute or attributes id stored in the compressed geometry.
         */
        this.attributes = attributes;

        /**
         * The mesh primitive this extension is attached to.
         */
        this.primitive = primitive;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {meshPrimitiveKHRDracoMeshCompression & glTFPropertyData} meshPrimitiveKHRDracoMeshCompression - The KHR_draco_mesh_compression JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(meshPrimitiveKHRDracoMeshCompression, graph) {
        const primitive  = /** @type {meshPrimitive} */(graph.parent);

        return this.unmarshall(graph, {
            ...meshPrimitiveKHRDracoMeshCompression,
            primitive: {
                indices:    primitive.indices,
                attributes: primitive.attributes,
            }
        }, {
            bufferView: { factory: BufferView, collection: 'bufferViews' },
            primitive: { referenceFields: {
                indices: { factory: Accessor, collection: 'accessors' },
                attributes: { referenceFields: {
                    POSITION:   { factory: Accessor, collection: 'accessors' },
                    NORMAL:     { factory: Accessor, collection: 'accessors' },
                    TANGENT:    { factory: Accessor, collection: 'accessors' },
                    TEXCOORD_0: { factory: Accessor, collection: 'accessors' },
                    TEXCOORD_1: { factory: Accessor, collection: 'accessors' },
                    TEXCOORD_2: { factory: Accessor, collection: 'accessors' },
                    TEXCOORD_3: { factory: Accessor, collection: 'accessors' },
                    COLOR_0:    { factory: Accessor, collection: 'accessors' },
                    COLOR_1:    { factory: Accessor, collection: 'accessors' },
                    WEIGHTS_0:  { factory: Accessor, collection: 'accessors' },
                    WEIGHTS_1:  { factory: Accessor, collection: 'accessors' },
                    JOINTS_0:   { factory: Accessor, collection: 'accessors' },
                    JOINTS_1:   { factory: Accessor, collection: 'accessors' },
                } },
            } },
        }, this);
    }

    /**
     * Loads the compressed mesh data and decodes it.
     * @param {AbortSignal} [signal] - An AbortSignal to abort the loading process.
     * @override
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
        const response = await workerHelper.callMethod({
            method: 'decode', args: [{ arrayBuffer, byteOffset, byteLength, attributes, indices }], signal
        });

        const accessor = this.primitive.indices;
        new Uint8Array(accessor.getArrayBuffer()).set(new Uint8Array(response.indices.buffer));

        return this;
    }
}

registry.add('KHR_draco_mesh_compression', {
    schema: {
        MeshPrimitive: MeshPrimitiveKHRDracoMeshCompression,
    },
});
