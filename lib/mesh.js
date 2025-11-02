import { NamedGLTFProperty } from './gltf-property.js';
import { MeshPrimitive     } from './mesh-primitive.js';

/**
 * @typedef {{
 *  primitives:  import('./mesh-primitive.js').meshPrimitive[],
 *  weights?:    number[],
 *  extensions?: Revelry.GLTF.Extensions.mesh,
 * } & import('./gltf-property.js').namedGLTFPropertyData} mesh
 */

/**
 * A set of primitives to be rendered. Its global transform is defined by a node that references it.
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-mesh
 */
export class Mesh extends NamedGLTFProperty {
    /**
     * @param {{
     *  primitives:  MeshPrimitive[],
     *  weights?:    number[],
     *  extensions?: Revelry.GLTF.Extensions.Mesh,
     * } & import('./gltf-property.js').NamedGLTFPropertyData} mesh
     */
    constructor(mesh) {
        super(mesh);

        const { primitives = [], weights, extensions } = mesh;

        /**
         * An array of Primitives, each defining geometry to be rendered with a material.
         */
        this.primitives = primitives;

        /**
         * Array of weights to be applied to the Morph Targets.
         */
        this.weights = weights;

        this.extensions = extensions;
    }

    /**
     * Creates a Mesh instance from a JSON representation.
     * @param {mesh} mesh
     * @param {import('./gltf-property.js').FromJSONOptions} options
     * @override
     */
    static fromJSON(mesh, options) {
        return new this(this.unmarshall(mesh, options, {
            primitives: { factory: MeshPrimitive },
        }, 'Mesh'));
    }

    /**
     * Loads all primitives associated with this mesh
     * @override
     */
    async load() {
        await Promise.all(this.primitives.map(primitive => primitive.load()));
        return this;
    }
}
