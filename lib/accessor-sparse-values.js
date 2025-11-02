
import { GLTFProperty } from './gltf-property.js';
import { BufferView   } from './buffer-view.js';

/**
 * @typedef {{
 *  bufferView:  number,
 *  byteOffset?: number,
 *  extensions?: Revelry.GLTF.Extensions.accessorSparseValues,
 * } & import('./gltf-property.js').glTFPropertyData} accessorSparseValues
 */

/**
 * An object pointing to a buffer view containing the deviating accessor values.
 * The number of elements is equal to accessor.sparse.count times number of components.
 * The elements have the same component type as the base accessor.
 * The elements are tightly packed. Data MUST be aligned following the same rules as the base accessor.
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-accessor-sparse-values
 */
export class AccessorSparseValues extends GLTFProperty {
    /**
     * @type {ArrayBuffer|undefined}
     */
    #arrayBuffer;

    /**
     * @param {{
     *  bufferView:  BufferView,
     *  byteOffset?: number,
     *  extensions?: Revelry.GLTF.Extensions.AccessorSparseValues,
     * } & import('./gltf-property.js').GLTFPropertyData} accessorSparseValues
     */
    constructor(accessorSparseValues) {
        super(accessorSparseValues);

        const { bufferView, byteOffset = 0, extensions } = accessorSparseValues;

        /**
         * The BufferView with sparse value. Referenced bufferView can't have ARRAY_BUFFER
         * or ELEMENT_ARRAY_BUFFER target.
         */
        this.bufferView = bufferView;

        /**
         * The offset relative to the start of the bufferView in bytes. Must be aligned.
         */
        this.byteOffset = byteOffset;

        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {accessorSparseValues} accessorSparseValues
     * @param {import('./gltf-property.js').FromJSONOptions} options
     * @override
     */
    static fromJSON(accessorSparseValues, options) {
        return new this(this.unmarshall(accessorSparseValues, options, {
            bufferView: { factory: BufferView, collection: 'bufferViews' },
        }));
    }

    /**
     * Loads the sparse values data.
     * @param {AbortSignal} [signal]
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
