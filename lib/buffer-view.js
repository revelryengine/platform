
import { NamedGLTFProperty } from './gltf-property.js';
import { Buffer            } from './buffer.js';

const GL = WebGL2RenderingContext;

/**
 * @typedef {{
 *  buffer:      number,
 *  byteLength:  number,
 *  byteOffset?: number,
 *  byteStride?: number,
 *  target?:     typeof GL.ARRAY_BUFFER | typeof GL.ELEMENT_ARRAY_BUFFER,
 *  extensions?: Revelry.GLTF.Extensions.bufferView,
 * } & import('./gltf-property.js').namedGLTFPropertyData} bufferView
 */

/**
 * A view into a buffer generally representing a subset of the buffer.
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-bufferview
 */
export class BufferView extends NamedGLTFProperty {
    /**
     * @param {{
     *  buffer:      Buffer,
     *  byteLength:  number,
     *  byteOffset?: number,
     *  byteStride?: number,
     *  target?:     bufferView['target'],
     *  extensions?: Revelry.GLTF.Extensions.BufferView,
     * } & import('./gltf-property.js').NamedGLTFPropertyData} bufferView
     */
    constructor(bufferView) {
        super(bufferView);

        const { buffer, byteOffset = 0, byteLength, byteStride, target } = bufferView;

        /**
         * The Buffer.
         * @type {Buffer}
         */
        this.buffer = buffer;

        /**
         * The offset into the buffer in bytes.
         */
        this.byteOffset = byteOffset;

        /**
         * The length of the bufferView in bytes.
         */
        this.byteLength = byteLength;

        /**
         * The stride, in bytes, between vertex attributes. When this is not defined, data is tightly packed.
         * When two or more accessors use the same bufferView, this field must be defined.
         */
        this.byteStride = byteStride;

        /**
         * The target that the GPU buffer should be bound to.
         * Allowed Values:
         * * 34962 ARRAY_BUFFER
         * * 34963 ELEMENT_ARRAY_BUFFER
         */
        this.target = target;
    }

    /**
     * @param {bufferView} bufferView
     * @param {import('./gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(bufferView, options) {
        return new this(this.unmarshall(bufferView, options, {
            buffer: { factory: Buffer, collection: 'buffers' },
        }, 'BufferView'));
    }
}
