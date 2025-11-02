import { GLTFProperty } from './gltf-property.js';
import { AccessorSparseIndices } from './accessor-sparse-indices.js';
import { AccessorSparseValues  } from './accessor-sparse-values.js';

/**
 * @typedef {{
 *  count:       number,
 *  indices:     import('./accessor-sparse-indices.js').accessorSparseIndices,
 *  values:      import('./accessor-sparse-values.js').accessorSparseValues,
 *  extensions?: Revelry.GLTF.Extensions.accessorSparse,
 * } & import('./gltf-property.js').glTFPropertyData} accessorSparse
 */

/**
 * Sparse storage of attributes that deviate from their initialization value.
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-accessor-sparse
 */
export class AccessorSparse extends GLTFProperty {
    /**
     * @param {{
     *  count:       number,
     *  indices:     AccessorSparseIndices,
     *  values:      AccessorSparseValues,
     *  extensions?: Revelry.GLTF.Extensions.AccessorSparse,
     * } & import('./gltf-property.js').GLTFPropertyData} accessorSparse
     */
    constructor(accessorSparse) {
        super(accessorSparse);

        const { count, indices, values, extensions } = accessorSparse;

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

        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {accessorSparse} accessorSparse
     * @param {import('./gltf-property.js').FromJSONOptions} options
     * @override
     */
    static fromJSON(accessorSparse, options) {
        return new this(this.unmarshall(accessorSparse, options, {
            indices: { factory: AccessorSparseIndices },
            values:  { factory: AccessorSparseValues  },
        }, 'AccessorSparse'));
    }

    /**
     * Loads the sparse data.
     * @param {AbortSignal} [signal]
     * @override
     */
    async load(signal) {
        await this.indices.loadOnce(signal);
        await this.values.loadOnce(signal);

        return this;
    }
}
