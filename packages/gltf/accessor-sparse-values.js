
/**
 * An object pointing to a buffer view containing the deviating accessor values.
 * The number of elements is equal to accessor.sparse.count times number of components.
 * The elements have the same component type as the base accessor.
 * The elements are tightly packed. Data MUST be aligned following the same rules as the base accessor.
 *
 * [Reference Spec - Accessor Sparse Values](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-accessor-sparse-values)
 *
 * @module
 */

import { GLTFProperty } from './gltf-property.js';
import { BufferView   } from './buffer-view.js';

/**
 * @import { GLTFPropertyData, ReferenceField } from './gltf-property.types.d.ts';
 * @import { accessorSparseValuesExtensions, AccessorSparseValuesExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @typedef {object} accessorSparseValues - Accessor sparse values JSON representation.
 * @property {number} bufferView - The bufferView with sparse value. Referenced bufferView can't have ARRAY_BUFFER or ELEMENT_ARRAY_BUFFER target.
 * @property {number} [byteOffset] - The offset relative to the start of the bufferView in bytes. Must be aligned.
 * @property {accessorSparseValuesExtensions} [extensions] - Extension-specific data.
 */

/**
 * AccessorSparseValues class representation.
 */
export class AccessorSparseValues extends GLTFProperty {
    /**
     * @type {ArrayBuffer|undefined}
     */
    #arrayBuffer;

    /**
     * Creates an instance of AccessorSparseValues.
     * @param {{
     *  bufferView:  BufferView,
     *  byteOffset?: number,
     *  extensions?: AccessorSparseValuesExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled accessor sparse values object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { bufferView, byteOffset = 0, extensions } = unmarshalled;

        /**
         * The BufferView with sparse value. Referenced bufferView can't have ARRAY_BUFFER
         * or ELEMENT_ARRAY_BUFFER target.
         */
        this.bufferView = bufferView;

        /**
         * The offset relative to the start of the bufferView in bytes. Must be aligned.
         */
        this.byteOffset = byteOffset;

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
    };

    /**
     * Loads the sparse values data.
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
