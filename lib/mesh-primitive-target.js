import { GLTFProperty } from './gltf-property.js';
import { Accessor     } from './accessor.js';

/**
 * @typedef {'POSITION'|'NORMAL'|'TANGENT'|'TEXCOORD_0'|'TEXCOORD_1'} TargetName
 *
 * @typedef {{
 *  [Key in TargetName]: number
 * } & {
 *  extensions?: Revelry.GLTF.Extensions.meshPrimitiveTarget,
 * } & import('./gltf-property.js').glTFPropertyData} meshPrimitiveTarget
 */

/**
 * A morph target is a morphable Mesh where the primitives' attributes are obtained by adding the original attributes to a weighted sum of the target’s attributes.
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#morph-targets
 */
export class MeshPrimitiveTarget extends GLTFProperty {
    /**
     * @param {{
     *   [Key in TargetName]: Accessor
     * }  & {
     *  extensions?: Revelry.GLTF.Extensions.MeshPrimitiveTarget,
     * } & import('./gltf-property.js').GLTFPropertyData} meshPrimitiveTarget
     */
    constructor(meshPrimitiveTarget) {
        super(meshPrimitiveTarget);

        const { POSITION, NORMAL, TANGENT, TEXCOORD_0, TEXCOORD_1 } = meshPrimitiveTarget;

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
    }

    /**
     * @param {meshPrimitiveTarget} meshPrimitiveTarget
     * @param {import('./gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(meshPrimitiveTarget, options) {
        return new this(this.unmarshall(meshPrimitiveTarget, options, {
            POSITION:   { factory: Accessor, collection: 'accessors' },
            NORMAL:     { factory: Accessor, collection: 'accessors' },
            TANGENT:    { factory: Accessor, collection: 'accessors' },
            TEXCOORD_0: { factory: Accessor, collection: 'accessors' },
            TEXCOORD_1: { factory: Accessor, collection: 'accessors' },
        }, 'MeshPrimitiveTarget'));
    }
}
