
/**
 * An object pointing to a buffer view containing the indices of deviating accessor values.
 * The number of indices is equal to accessor.sparse.count. Indices MUST strictly increase.
 *
 * [Reference Spec - Accessor Sparse Indices](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-accessor-sparse-indices)
 *
 * @module
 */

import { GLTFProperty } from './gltf-property.js';
import { BufferView   } from './buffer-view.js';

/**
 * @import { GLTFPropertyData, ReferenceField } from './gltf-property.types.d.ts';
 * @import { accessorSparseIndicesExtensions, AccessorSparseIndicesExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @import {GL} from './constants.js';
 */

/**
 * @typedef {object} accessorSparseIndices - Accessor sparse indices JSON representation.
 * @property {number} bufferView - The bufferView with sparse indices. Referenced bufferView can't have ARRAY_BUFFER or ELEMENT_ARRAY_BUFFER target.
 * @property {number} componentType - The indices data type. Valid values correspond to WebGL enums: `5121` (UNSIGNED_BYTE), `5123` (UNSIGNED_SHORT), `5125` (UNSIGNED_INT).
 * @property {number} [byteOffset] - The offset relative to the start of the bufferView in bytes. Must be aligned.
 * @property {accessorSparseIndicesExtensions} [extensions] - Extension-specific data.
 */

/**
 * AccessorSparseIndices class representation.
 */
export class AccessorSparseIndices extends GLTFProperty {
    /**
     * @type {ArrayBuffer|undefined}
     */
    #arrayBuffer;

    /**
     * Creates an instance of AccessorSparseIndices.
     * @param {{
     *  bufferView:    BufferView,
     *  componentType: typeof GL.UNSIGNED_BYTE | typeof GL.UNSIGNED_SHORT | typeof GL.UNSIGNED_INT,
     *  byteOffset?:   number,
     *  extensions?:   AccessorSparseIndicesExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled accessor sparse indices object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { bufferView, byteOffset = 0, componentType, extensions } = unmarshalled;

        /**
         * The BufferView with sparse indices. Referenced bufferView can't have ARRAY_BUFFER
         * or ELEMENT_ARRAY_BUFFER target.
         */
        this.bufferView = bufferView;

        /**
         * The offset relative to the start of the bufferView in bytes. Must be aligned.
         */
        this.byteOffset = byteOffset;

        /**
         * The indices data type.  Valid values correspond to WebGL enums: `5121` (UNSIGNED_BYTE), `5123` (UNSIGNED_SHORT), `5125` (UNSIGNED_INT).
         */
        this.componentType = componentType;

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
    }

    /**
     * Loads the sparse indices data.
     * @param {AbortSignal} [signal] - An optional AbortSignal to cancel the load.
     * @override
     */
    async load(signal) {
        const { bufferView } = this;

        await bufferView.buffer.loadOnce(signal);

        this.#arrayBuffer = bufferView.buffer.getArrayBuffer();

        await super.load(signal);

        return this;
    }

    /**
     * Returns the data loaded into memory for this accessor.
     */
    getArrayBuffer() {
        if(!this.#arrayBuffer) throw new Error('Invalid State');
        return this.#arrayBuffer;
    }
}
