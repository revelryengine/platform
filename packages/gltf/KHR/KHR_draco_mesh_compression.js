/// <reference path="revelryengine/settings.d.ts" />
/// <reference path="./KHR_draco_mesh_compression.types.d.ts" />

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

import { GLTFProperty     } from '../gltf-property.js';
import { BufferView       } from '../buffer-view.js';
import { Accessor         } from '../accessor.js';
import { WorkerHelperPool } from 'revelryengine/utils/worker-helper.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, FromJSONGraph, ReferenceField } from '../gltf-property.types.d.ts';
 * @import { meshPrimitiveKHRDracoMeshCompressionExtensions, MeshPrimitiveKHRDracoMeshCompressionExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @import { AttributeName, meshPrimitive, MeshPrimitiveAttributeIndices, MeshPrimitiveAttributeAccessors } from '../mesh-primitive.js';
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
     * Reference fields for this class.
     * @type {Record<string, ReferenceField>}
     * @override
     */
    static referenceFields = {
        bufferView: { factory: () => BufferView, collection: 'bufferViews' },
        primitive: { referenceFields: {
            indices: { factory: () => Accessor, collection: 'accessors' },
            attributes: { referenceFields: {
                POSITION:   { factory: () => Accessor, collection: 'accessors' },
                NORMAL:     { factory: () => Accessor, collection: 'accessors' },
                TANGENT:    { factory: () => Accessor, collection: 'accessors' },
                TEXCOORD_0: { factory: () => Accessor, collection: 'accessors' },
                TEXCOORD_1: { factory: () => Accessor, collection: 'accessors' },
                TEXCOORD_2: { factory: () => Accessor, collection: 'accessors' },
                TEXCOORD_3: { factory: () => Accessor, collection: 'accessors' },
                COLOR_0:    { factory: () => Accessor, collection: 'accessors' },
                COLOR_1:    { factory: () => Accessor, collection: 'accessors' },
                WEIGHTS_0:  { factory: () => Accessor, collection: 'accessors' },
                WEIGHTS_1:  { factory: () => Accessor, collection: 'accessors' },
                JOINTS_0:   { factory: () => Accessor, collection: 'accessors' },
                JOINTS_1:   { factory: () => Accessor, collection: 'accessors' },
            } },
        } },
    };

    /**
     * Prepares JSON with attached primitive references prior to unmarshalling.
     * @param {meshPrimitiveKHRDracoMeshCompression & glTFPropertyData} meshPrimitiveKHRDracoMeshCompression - JSON representation.
     * @param {Partial<FromJSONGraph>} graph - Graph context.
     * @override
     */
    static prepareJSON(meshPrimitiveKHRDracoMeshCompression, graph) {
        const primitive = /** @type {meshPrimitive} */(graph.parent);

        return super.prepareJSON(
            {
                ...meshPrimitiveKHRDracoMeshCompression,
                primitive: {
                    indices:    primitive.indices,
                    attributes: primitive.attributes,
                },
            },
            graph
        );
    }

    /**
     * Loads the compressed mesh data and decodes it.
     * @param {AbortSignal} [signal] - An AbortSignal to abort the loading process.
     * @override
     */
    async load(signal) {
        await MeshPrimitiveKHRDracoMeshCompression.workerPool.connect(globalThis.REV?.KHR_draco_mesh_compression?.workerCount ?? 4);

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
        const response = await MeshPrimitiveKHRDracoMeshCompression.workerPool.callMethod({
            method: 'decode', args: [{ arrayBuffer, byteOffset, byteLength, attributes, indices }], signal
        });

        // This loop can be removed if we use SharedArrayBuffer in Accessor, but support for this is tricky so will revisit.
        for (const [name, arrayBuffer] of Object.entries(response.attributes)) {
            const accessor = this.primitive.attributes[/** @type {AttributeName} */(name)];
            const accessorArray = /** @type {Accessor} */(accessor).getArrayBuffer();
            new Uint8Array(accessorArray).set(new Uint8Array(arrayBuffer.buffer));
        }

        const accessor = this.primitive.indices;
        new Uint8Array(accessor.getArrayBuffer()).set(new Uint8Array(response.indices.buffer));

        return this;
    }

    /**
     * Worker helper pool for decompressing meshes.
     */
    static workerPool = new WorkerHelperPool(import.meta.resolve('./KHR_draco_mesh_compression.worker.js'), { type: 'module' });
}

GLTFProperty.extensions.add('KHR_draco_mesh_compression', {
    schema: {
        MeshPrimitive: MeshPrimitiveKHRDracoMeshCompression,
    },
});
