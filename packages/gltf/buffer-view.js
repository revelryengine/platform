/**
 * A view into a buffer generally representing a subset of the buffer.
 *
 * [Reference Spec - Buffer View](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-bufferview)
 *
 * @module
 */

import { NamedGLTFProperty } from './gltf-property.js';
import { Buffer            } from './buffer.js';

/**
 * @import { NamedGLTFPropertyData, ReferenceField } from './gltf-property.types.d.ts';
 * @import { bufferViewExtensions, BufferViewExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @import { GL } from './constants.js';
 */

/**
 * @typedef {object} bufferView - BufferView JSON representation.
 * @property {number} buffer - The index of the buffer.
 * @property {number} byteLength - The length of the bufferView in bytes.
 * @property {number} [byteOffset] - The offset into the buffer in bytes.
 * @property {number} [byteStride] - The stride, in bytes, between vertex attributes.
 * @property {typeof GL.ARRAY_BUFFER | typeof GL.ELEMENT_ARRAY_BUFFER} [target] - The target that the GPU buffer should be bound to.
 * @property {bufferViewExtensions} [extensions] - Extension-specific data.
 */

/**
 * BufferView class representation.
 */
export class BufferView extends NamedGLTFProperty {
    /**
     * Creates an instance of BufferView.
     * @param {{
     *  buffer:      Buffer,
     *  byteLength:  number,
     *  byteOffset?: number,
     *  byteStride?: number,
     *  target?:     bufferView['target'],
     *  extensions?: BufferViewExtensions,
     * } & NamedGLTFPropertyData} unmarshalled - Unmarshalled buffer view object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { buffer, byteOffset = 0, byteLength, byteStride, target, extensions } = unmarshalled;

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
        buffer: { factory: () => Buffer, collection: 'buffers' },
    };
}
