/**
 * Sparse storage of attributes that deviate from their initialization value.
 *
 * [Reference Spec - Accessor Sparse](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-accessor-sparse)
 *
 * @module
 */

import { GLTFProperty } from './gltf-property.js';
import { AccessorSparseIndices } from './accessor-sparse-indices.js';
import { AccessorSparseValues  } from './accessor-sparse-values.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, FromJSONGraph } from './gltf-property.js';
 * @import { accessorSparseExtensions, AccessorSparseExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @typedef {object} accessorSparse - Accessor sparse JSON representation.
 * @property {number} count - Number of entries stored in the sparse array.
 * @property {import('./accessor-sparse-indices.js').accessorSparseIndices} indices - Index array of size count that points to those accessor attributes that deviate from their initialization value.
 * @property {import('./accessor-sparse-values.js').accessorSparseValues} values - Array of size count times number of components, storing the displaced accessor attributes pointed by indices.
 * @property {accessorSparseExtensions} [extensions] - Extension-specific data.
 */

/**
 * AccessorSparse class representation.
 */
export class AccessorSparse extends GLTFProperty {
    /**
     * Creates an instance of AccessorSparse.
     * @param {{
     *  count:       number,
     *  indices:     AccessorSparseIndices,
     *  values:      AccessorSparseValues,
     *  extensions?: AccessorSparseExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled accessor sparse object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { count, indices, values, extensions } = unmarshalled;

        /**
         * Number of entries stored in the sparse array.
         */
        this.count = count;

        /**
         * Index array of size count that points to those accessor attributes that deviate from their initialization value.
         * Indices must strictly increase.
         */
        this.indices = indices;

        /**
         * Array of size count times number of components, storing the displaced accessor attributes pointed by indices.
         * Substituted values must have the same componentType and number of components as the base accessor.
         */
        this.values = values;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {accessorSparse & glTFPropertyData} accessorSparse - The accessor sparse JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(accessorSparse, graph) {
        return this.unmarshall(graph, accessorSparse, {
            indices: { factory: AccessorSparseIndices },
            values:  { factory: AccessorSparseValues  },
        }, this);
    }

    /**
     * Loads the sparse data.
     * @param {AbortSignal} [signal] - An optional AbortSignal to cancel the load.
     * @override
     */
    async load(signal) {
        await this.indices.loadOnce(signal);
        await this.values.loadOnce(signal);

        return this;
    }
}
