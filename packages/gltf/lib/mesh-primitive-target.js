/**
 * A morph target is a morphable Mesh where the primitives' attributes are obtained by adding the original attributes to a weighted sum of the target’s attributes.
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#morph-targets
 *
 * @module
 */

import { GLTFProperty } from './gltf-property.js';
import { Accessor     } from './accessor.js';

/**
 * @import { GLTFPropertyData, glTFPropertyData, FromJSONGraph } from './gltf-property.js';
 * @import { meshPrimitiveTargetExtensions, MeshPrimitiveTargetExtensions } from 'virtual-rev-gltf-extensions';
 */

/**
 * @typedef {object} meshPrimitiveTarget - Mesh Primitive Target JSON representation.
 * @property {number} [POSITION] - The index of the Accessor containing XYZ vertex position displacements.
 * @property {number} [NORMAL] - The index of the Accessor containing XYZ vertex normal displacements.
 * @property {number} [TANGENT] - The index of the Accessor containing XYZ vertex tangent displacements.
 * @property {number} [TEXCOORD_0] - The index of the Accessor containing ST texture coordinate displacements.
 * @property {number} [TEXCOORD_1] - The index of the Accessor containing ST texture coordinate displacements.
 * @property {meshPrimitiveTargetExtensions} [extensions] - Extension-specific data.
 */

/**
 * MeshPrimitiveTarget class representation.
 */
export class MeshPrimitiveTarget extends GLTFProperty {
    /**
     * Creates an instance of MeshPrimitiveTarget.
     * @param {{
     *   POSITION?:   Accessor,
     *   NORMAL?:     Accessor,
     *   TANGENT?:    Accessor,
     *   TEXCOORD_0?: Accessor,
     *   TEXCOORD_1?: Accessor,
     *   extensions?: MeshPrimitiveTargetExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled mesh primitive target object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { POSITION, NORMAL, TANGENT, TEXCOORD_0, TEXCOORD_1, extensions } = unmarshalled;

        /**
         * The Accessor containing XYZ vertex position displacements.
         */
        this.POSITION = POSITION;

        /**
         * The Accessor containing XYZ vertex normal displacements.
         */
        this.NORMAL = NORMAL;


        /**
         * The Accessor containing XYZ vertex tangent displacements.
         */
        this.TANGENT = TANGENT;

        /**
         * The Accessor containing ST texture coordinate displacements.
         */
        this.TEXCOORD_0 = TEXCOORD_0;

        /**
         * The Accessor containing ST texture coordinate displacements.
         */
        this.TEXCOORD_1 = TEXCOORD_1;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {meshPrimitiveTarget & glTFPropertyData} meshPrimitiveTarget - The mesh primitive target JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(meshPrimitiveTarget, graph) {
        return this.unmarshall(graph, meshPrimitiveTarget, {
            POSITION:   { factory: Accessor, collection: 'accessors' },
            NORMAL:     { factory: Accessor, collection: 'accessors' },
            TANGENT:    { factory: Accessor, collection: 'accessors' },
            TEXCOORD_0: { factory: Accessor, collection: 'accessors' },
            TEXCOORD_1: { factory: Accessor, collection: 'accessors' },
        }, this);
    }
}
