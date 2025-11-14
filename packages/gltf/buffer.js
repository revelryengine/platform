/**
 * A buffer points to binary geometry, animation, or skins.
 *
 * [Reference Spec - Buffer](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-buffer)
 *
 * @module
 */

import { NamedGLTFProperty } from './gltf-property.js';

/**
 * @import { namedGLTFPropertyData, NamedGLTFPropertyData, FromJSONGraph } from './gltf-property.js';
 * @import { bufferExtensions, BufferExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @typedef {object} buffer - Buffer JSON representation.
 * @property {string} [uri] - The URI of the buffer.
 * @property {number} byteLength - The length of the buffer in bytes.
 * @property {bufferExtensions} [extensions] - Extension-specific data.
 */

/**
 * Buffer class representation.
 */
export class Buffer extends NamedGLTFProperty {
    #arrayBuffer;

    /**
     * Creates an instance of Buffer.
     * @param {{
     *  uri?:        URL,
     *  byteLength:  number,
     *  extensions?: BufferExtensions,
     * } & NamedGLTFPropertyData} unmarshalled - Unmarshalled buffer object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { uri, byteLength, extensions } = unmarshalled;

        /**
         * The uri of the buffer. Relative paths are relative to the .gltf file. Instead of referencing an external
         * file, the uri can also be a data-uri.
         */
        this.uri = uri;

        /**
         * The length of the buffer in bytes.
         */
        this.byteLength = byteLength;

        this.#arrayBuffer = new ArrayBuffer(this.byteLength);

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {buffer & namedGLTFPropertyData} buffer - The buffer JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(buffer, graph) {
        return this.unmarshall(graph, buffer, {
            uri: { factory: URL }
        }, this);
    }

    /**
     * Fetches the binary data into an array buffer.
     * @param {AbortSignal} [signal] - An optional AbortSignal to cancel the fetch.
     * @override
     */
    async load(signal) {
        if (this.uri) {
            const buffer = await fetch(this.uri, { signal }).then(res => res.arrayBuffer());
            new Uint8Array(this.#arrayBuffer).set(new Uint8Array(buffer, 0, this.byteLength));
        }
        await super.load(signal);

        return this;
    }

    /**
     * Returns the data loaded into memory for this buffer
     */
    getArrayBuffer() {
        return this.#arrayBuffer;
    }
}
