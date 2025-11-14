/**
 * A typed view into a bufferView. A bufferView contains raw binary data.
 * An accessor provides a typed view into a bufferView or a subset of a bufferView similar
 * to how WebGL's vertexAttribPointer() defines an attribute in a buffer.
 *
 * [Reference Spec - Accessor](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-accessor)
 *
 * @module
 */

import { NamedGLTFProperty } from './gltf-property.js';
import { BufferView        } from './buffer-view.js';
import { AccessorSparse    } from './accessor-sparse.js';
import {
    COMPONENTS_PER_TYPE,
    BYTES_PER_COMPONENT,
    TYPEDARRAYS,
} from './constants.js';

/**
 * @import { namedGLTFPropertyData, NamedGLTFPropertyData, FromJSONGraph } from './gltf-property.js';
 * @import { accessorExtensions, AccessorExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @import { GL } from './constants.js';
 * @import { accessorSparse } from './accessor-sparse.js';
 */

/**
 * @typedef {object} accessor - Accessor JSON representation.
 * @property {'SCALAR' | 'VEC2' | 'VEC3' | 'VEC4' | 'MAT2' | 'MAT3' | 'MAT4'} type - Specifies if the attribute is a scalar, vector, or matrix.
 * @property {typeof GL.BYTE | typeof GL.UNSIGNED_BYTE | typeof GL.SHORT | typeof GL.UNSIGNED_SHORT | typeof GL.UNSIGNED_INT | typeof GL.FLOAT} componentType - The datatype of components in the attribute. All valid values correspond to WebGL enums.
 * @property {number} count - The number of attributes referenced by this accessor, not to be confused with the number of bytes or number of components.
 * @property {number} [bufferView] - The index of the bufferView.
 * @property {number} [byteOffset] - The offset relative to the start of the bufferView in bytes.
 * @property {boolean} [normalized] - Specifies whether integer data values should be normalized.
 * @property {number[]} [max] - Maximum value of each component in this attribute.
 * @property {number[]} [min] - Minimum value of each component in this attribute.
 * @property {accessorSparse} [sparse] - Sparse storage of attributes that deviate from their initialization value.
 * @property {accessorExtensions} [extensions] - Extension-specific data.
 */

/**
 * Accessor class representation.
 */
export class Accessor extends NamedGLTFProperty {
    /** @type {SharedArrayBuffer|ArrayBuffer|undefined} */
    #arrayBuffer;

    /** @type {Int8Array|Uint8Array|Int16Array|Uint16Array|Uint32Array|Float32Array|undefined} */
    #typedArray;

    /**
     * Creates an instance of Accessor.
     * @param {{
     *  type:          accessor['type'],
     *  componentType: accessor['componentType'],
     *  count:         number,
     *  bufferView?:   BufferView,
     *  byteOffset?:   number,
     *  normalized?:   boolean,
     *  max?:          number[],
     *  min?:          number[],
     *  sparse?:       AccessorSparse,
     *  extensions?:   AccessorExtensions,
     * } & NamedGLTFPropertyData} unmarshalled - Unmarshalled accessor object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const {
            type,
            componentType,
            count,
            bufferView,
            byteOffset = 0,
            normalized = false,
            max,
            min,
            sparse,
            extensions,
        } = unmarshalled;

        /**
         * The BufferView. When not defined, accessor must be initialized with zeros;
         * sparse property or extensions could override zeros with actual values.
         */
        this.bufferView = bufferView;

        /**
         * The offset relative to the start of the bufferView in bytes.
         * This must be a multiple of the size of the component datatype.
         */
        this.byteOffset = byteOffset;

        /**
         * The datatype of components in the attribute. All valid values correspond to WebGL enums.
         * The corresponding typed arrays are Int8Array, Uint8Array, Int16Array, Uint16Array, Uint32Array, and Float32Array,
         * respectively. 5125 (UNSIGNED_INT) is only allowed when the accessor contains indices, i.e., the accessor is only
         * referenced by primitive.indices.
         *
         * Allowed Values:
         * * 5120 BYTE
         * * 5121 UNSIGNED_BYTE
         * * 5122 SHORT
         * * 5123 UNSIGNED_SHORT
         * * 5125 UNSIGNED_INT
         * * 5126 FLOAT
         */
        this.componentType = componentType;

        /**
         * Specifies whether integer data values should be normalized (true) to [0, 1] (for unsigned types) or [-1, 1]
         * (for signed types), or converted directly (false) when they are accessed. This property is defined only for
         * accessors that contain vertex attributes or animation output data.
         */
        this.normalized = normalized;

        /**
         * The number of attributes referenced by this accessor, not to be confused with the number of bytes or
         * number of components.
         */
        this.count = count;

        /**
         * Specifies if the attribute is a scalar, vector, or matrix.
         *
         * Allowed values:
         * * "SCALAR"
         * * "VEC2"
         * * "VEC3"
         * * "VEC4"
         * * "MAT2"
         * * "MAT3"
         * * "MAT4"
         */
        this.type = type;

        /**
         * Maximum value of each component in this attribute. Array elements must be treated as having the same data
         * type as accessor's {@link componentType}. Both min and max arrays have the same length. The length is
         * determined by the value of the type property; it can be 1, 2, 3, 4, 9, or 16.
         *
         * {@link normalized} property has no effect on array values: they always correspond to the actual values
         * stored in the buffer. When accessor is sparse, this property must contain max values of accessor data with
         * sparse substitution applied.
         */
        this.max = max;

        /**
         * Minimum value of each component in this attribute. Array elements must be treated as having the same data
         * type as accessor's {@link componentType}. Both min and max arrays have the same length. The length is
         * determined by the value of the type property; it can be 1, 2, 3, 4, 9, or 16.
         *
         * {@link normalized} property has no effect on array values: they always correspond to the actual values
         * stored in the buffer. When accessor is sparse, this property must contain min values of accessor data with
         * sparse substitution applied.
         */
        this.min = min;

        /**
         * Sparse storage of attributes that deviate from their initialization value.
         */
        this.sparse = sparse;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {accessor & namedGLTFPropertyData} accessor - The accessor JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(accessor, graph) {
        return this.unmarshall(graph, accessor, {
            bufferView: { factory: BufferView, collection: 'bufferViews' },
            sparse:     { factory: AccessorSparse }
        }, this);
    }

    /**
     * Loads the accessor data.
     * @param {AbortSignal} [signal] - An optional AbortSignal to cancel the load.
     * @override
     */
    async load(signal) {
        await this.bufferView?.buffer.loadOnce(signal);
        await this.sparse?.loadOnce(signal);
        await super.load(signal);

        this.initBufferData();

        return this;
    }

    /**
     * Initializes the buffer data for the accessor.
     */
    initBufferData() {
        const { bufferView, byteOffset, count, componentType } = this;

        const numberOfBytes = this.getNumberOfBytes();
        const numberOfComponents = this.getNumberOfComponents();
        let start = byteOffset;

        if (!bufferView) {
            this.#arrayBuffer = new SharedArrayBuffer(
                count * numberOfComponents * numberOfBytes,
            );

            this.#typedArray = new TYPEDARRAYS[componentType](
                // @ts-ignore - SharedArrayBuffer is compatible
                this.#arrayBuffer,
                byteOffset,
                count * numberOfComponents,
            );
        } else {
            start += bufferView.byteOffset;

            this.#arrayBuffer = bufferView.buffer.getArrayBuffer();
            this.#typedArray = new TYPEDARRAYS[componentType](
                this.#arrayBuffer,
                start,
                count * numberOfComponents,
            );
        }

        if (this.sparse && this.#typedArray) {
            const { indices, values, count } = this.sparse;

            const indicesBuffer = indices.getArrayBuffer();
            const indicesOffset = indices.byteOffset +
                indices.bufferView.byteOffset;
            const indicesTypedArray =
                new TYPEDARRAYS[this.sparse.indices.componentType](
                    indicesBuffer,
                    indicesOffset,
                    count,
                );

            const valuesBuffer = values.getArrayBuffer();
            const valuesOffset = values.byteOffset +
                values.bufferView.byteOffset;
            const valuesTypedArray = new TYPEDARRAYS[componentType](
                valuesBuffer,
                valuesOffset,
                count * numberOfComponents,
            );

            for (let i = 0; i < count; i++) {
                for (let n = 0; n < numberOfComponents; n++) {
                    this.#typedArray[
                        (indicesTypedArray[i] * numberOfComponents) + n
                    ] = valuesTypedArray[(i * numberOfComponents) + n];
                }
            }
        }
    }

    /**
     * Returns true if accessor has a bufferView whose byteStride does not match the element size.
     */
    get interleaved() {
        const byteStride = this.bufferView?.byteStride ?? 0;
        return !!byteStride && byteStride !== this.getElementSize();
    }

    /**
     * Returns the data loaded into memory for this accessor.
     * If a bufferView is defined the arrayBuffer is the same as the bufferView.buffer's arrayBuffer.
     * If a bufferView is not defined, the arrayBuffer is an arrayBuffer initialized with zeros.
     */
    getArrayBuffer() {
        if(!this.#arrayBuffer) throw new Error('Invalid State');
        return this.#arrayBuffer;
    }

    /**
     * Returns the typed ArrayBuffer for the componentType. (Int8Array, Uint8Array, Int16Array, Uint16Array, Uint32Array,
     * or Float32Array)
     * This array will not be useful for interleaved attributes
     */
    getTypedArray() {
        if(!this.#typedArray) throw new Error('Invalid State');
        if(this.interleaved) console.warn('Interleaved Attribute not compatible with getTypedArray');
        return this.#typedArray;
    }

    /**
     * Returns the number of bytes for the componentType. (1, 2, or 4)
     */
    getNumberOfBytes() {
        return BYTES_PER_COMPONENT[this.componentType];
    }

    /**
     * Returns the number of components for the type. (1, 2, 3, 4, 9 or 16)
     */
    getNumberOfComponents() {
        return COMPONENTS_PER_TYPE[this.type];
    }

    /**
     * Returns the size of the element in bytes
     */
    getElementSize() {
        return this.getNumberOfBytes() * this.getNumberOfComponents();
    }

    /**
     * Creates a typed ArrayBuffer from the accessor with offset and count.
     * @param {number} [offset] - The offset in number of elements.
     * @param {number} [count] - The number of elements.
     */
    createTypedView(offset = 0, count = this.count) {
        if(!this.#arrayBuffer) throw new Error('Array Buffer does not exist');

        const { bufferView, byteOffset, componentType } = this;
        const numberOfComponents = this.getNumberOfComponents();
        const start = (offset * this.getNumberOfBytes()) + byteOffset + (bufferView?.byteOffset ?? 0);
        return new TYPEDARRAYS[componentType](
            // @ts-ignore - SharedArrayBuffer is compatible
            this.#arrayBuffer,
            start,
            count * numberOfComponents,
        );
    }
}
