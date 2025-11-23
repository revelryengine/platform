/**
 * A set of primitives to be rendered. Its global transform is defined by a node that references it.
 *
 * [Reference Spec - Mesh](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-mesh)
 *
 * @module
 */

import { NamedGLTFProperty } from './gltf-property.js';
import { MeshPrimitive     } from './mesh-primitive.js';

/**
 * @import { NamedGLTFPropertyData, ReferenceField } from './gltf-property.types.d.ts';
 * @import { meshExtensions, MeshExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @import { meshPrimitive } from './mesh-primitive.js';
 */

/**
 * @typedef {object} mesh - Mesh JSON representation.
 * @property {meshPrimitive[]} primitives - An array of Primitives, each defining geometry to be rendered with a material.
 * @property {number[]} [weights] - Array of weights to be applied to the Morph Targets.
 * @property {meshExtensions} [extensions] - Extension-specific data.
 */

/**
 * Mesh class representation.
 */
export class Mesh extends NamedGLTFProperty {
    /**
     * Creates an instance of Mesh.
     * @param {{
     *  primitives:  MeshPrimitive[],
     *  weights?:    number[],
     *  extensions?: MeshExtensions,
     * } & NamedGLTFPropertyData} unmarshalled - Unmarshalled mesh object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { primitives = [], weights, extensions } = unmarshalled;

        /**
         * An array of Primitives, each defining geometry to be rendered with a material.
         */
        this.primitives = primitives;

        /**
         * Array of weights to be applied to the Morph Targets.
         */
        this.weights = weights;

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
        primitives: { factory: () => MeshPrimitive },
    };

    /**
     * Loads all primitives associated with this mesh
     * @override
     */
    async load() {
        await Promise.all(this.primitives.map(primitive => primitive.load()));
        return this;
    }
}
