
import { GLTFProperty } from './gltf-property.js';
import { BufferView   } from './buffer-view.js';

const GL = WebGL2RenderingContext;

/**
 * @typedef {{
 *  bufferView:    number,
 *  componentType: typeof GL.UNSIGNED_BYTE | typeof GL.UNSIGNED_SHORT | typeof GL.UNSIGNED_INT,
 *  byteOffset?:   number,
 *  extensions?:   Revelry.GLTF.Extensions.accessorSparseIndices,
 * } & import('./gltf-property.js').glTFPropertyData} accessorSparseIndices
 */

/**
 * An object pointing to a buffer view containing the indices of deviating accessor values.
 * The number of indices is equal to accessor.sparse.count. Indices MUST strictly increase.
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-accessor-sparse-indices
 */
export class AccessorSparseIndices extends GLTFProperty {
    /**
     * @type {ArrayBuffer|undefined}
     */
    #arrayBuffer;

    /**
     * @param {{
     *  bufferView:    BufferView,
     *  componentType: typeof GL.UNSIGNED_BYTE | typeof GL.UNSIGNED_SHORT | typeof GL.UNSIGNED_INT,
     *  byteOffset?:   number,
     *  extensions?:   Revelry.GLTF.Extensions.AccessorSparseIndices,
     * } & import('./gltf-property.js').GLTFPropertyData} accessorSparseIndices
     */
    constructor(accessorSparseIndices) {
        super(accessorSparseIndices);

        const { bufferView, byteOffset = 0, componentType, extensions } = accessorSparseIndices;

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

        this.extensions = extensions;
    }

    /**
     * @param {accessorSparseIndices} accessorSparseIndices
     * @param {import('./gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(accessorSparseIndices, options) {
        return new this(this.unmarshall(accessorSparseIndices, options, {
            bufferView: { factory: BufferView, collection: 'bufferViews' },
        }, 'AccessorSparseIndices'));
    }

    /**
     * @param {AbortSignal} [signal]
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
