/**
 * Geometry to be rendered with the given material.
 *
 * [Reference Spec - Mesh Primitive](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-mesh-primitive)
 *
 * @module
 */

import { GLTFProperty } from './gltf-property.js';
import { Accessor            } from './accessor.js';
import { MeshPrimitiveTarget } from './mesh-primitive-target.js';
import { Material            } from './material.js';

/**
 * @import { GLTFPropertyData, ReferenceField } from './gltf-property.types.d.ts';
 * @import { meshPrimitiveExtensions, MeshPrimitiveExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @import { GL } from './constants.js';
 * @import { meshPrimitiveTarget } from './mesh-primitive-target.js';
 */

/**
 * @typedef {object} MeshPrimitiveAttributeIndices - A dictionary object, where each key corresponds to an attribute and its unique attribute id stored in the compressed geometry.
 * @property {number} [attributes.POSITION] - The unique attribute id for the POSITION attribute.
 * @property {number} [attributes.NORMAL] - The unique attribute id for the NORMAL attribute.
 * @property {number} [attributes.TANGENT] - The unique attribute id for the TANGENT attribute.
 * @property {number} [attributes.TEXCOORD_0] - The unique attribute id for the TEXCOORD_0 attribute.
 * @property {number} [attributes.TEXCOORD_1] - The unique attribute id for the TEXCOORD_1 attribute.
 * @property {number} [attributes.TEXCOORD_2] - The unique attribute id for the TEXCOORD_2 attribute.
 * @property {number} [attributes.TEXCOORD_3] - The unique attribute id for the TEXCOORD_3 attribute.
 * @property {number} [attributes.COLOR_0] - The unique attribute id for the COLOR_0 attribute.
 * @property {number} [attributes.COLOR_1] - The unique attribute id for the COLOR_1 attribute.
 * @property {number} [attributes.WEIGHTS_0] - The unique attribute id for the WEIGHTS_0 attribute.
 * @property {number} [attributes.WEIGHTS_1] - The unique attribute id for the WEIGHTS_1 attribute.
 * @property {number} [attributes.JOINTS_0] - The unique attribute id for the JOINTS_0 attribute.
 * @property {number} [attributes.JOINTS_1] - The unique attribute id for the JOINTS_1 attribute.
 */

/**
 * @typedef {object} MeshPrimitiveAttributeAccessors - A dictionary object, where each key corresponds to an Accessor.
 * @property {Accessor} [attributes.POSITION] - The POSITION accessor.
 * @property {Accessor} [attributes.NORMAL] - The NORMAL accessor.
 * @property {Accessor} [attributes.TANGENT] - The TANGENT accessor.
 * @property {Accessor} [attributes.TEXCOORD_0] - The TEXCOORD_0 accessor.
 * @property {Accessor} [attributes.TEXCOORD_1] - The TEXCOORD_1 accessor.
 * @property {Accessor} [attributes.TEXCOORD_2] - The TEXCOORD_2 accessor.
 * @property {Accessor} [attributes.TEXCOORD_3] - The TEXCOORD_3 accessor.
 * @property {Accessor} [attributes.COLOR_0] - The COLOR_0 accessor.
 * @property {Accessor} [attributes.COLOR_1] - The COLOR_1 accessor.
 * @property {Accessor} [attributes.WEIGHTS_0] - The WEIGHTS_0 accessor.
 * @property {Accessor} [attributes.WEIGHTS_1] - The WEIGHTS_1 accessor.
 * @property {Accessor} [attributes.JOINTS_0] - The JOINTS_0 accessor.
 * @property {Accessor} [attributes.JOINTS_1] - The JOINTS_1 accessor.
 */


/**
 * @typedef {(
 *  'POSITION'   | 'NORMAL'     | 'TANGENT'    |
 *  'TEXCOORD_0' | 'TEXCOORD_1' | 'TEXCOORD_2' | 'TEXCOORD_3' |
 *  'COLOR_0'    | 'COLOR_1'    |
 *  'WEIGHTS_0'  | 'WEIGHTS_1'  |
 *  'JOINTS_0'   | 'JOINTS_1'
 * )} AttributeName - The list of supported attribute names.
 *
 * @typedef {object} meshPrimitive - Mesh Primitive JSON representation.
 * @property {MeshPrimitiveAttributeIndices} attributes - A dictionary object, where each key corresponds to mesh attribute semantic and each value is the index of the Accessor containing attribute's data.
 * @property {number} [indices] - The index of the Accessor that contains the indices.
 * @property {number} [material] - The index of the Material to apply to this primitive when rendering.
 * @property {typeof GL.POINTS | typeof GL.LINES | typeof GL.LINE_STRIP | typeof GL.TRIANGLES | typeof GL.TRIANGLE_STRIP} [mode=4] - The type of primitives to render.
 * @property {meshPrimitiveTarget[]} [targets] - An array of Morph Targets, each Morph Target is a dictionary mapping attributes (only `POSITION`, `NORMAL`, `TANGENT`, `TEXCOORD_0`, and `TEXCOORD_1` supported) to their deviations in the Morph Target.
 * @property {meshPrimitiveExtensions} [extensions] - Extension-specific data.
 */

let ids = 0;

/**
 * MeshPrimitive class representation.
 */
export class MeshPrimitive extends GLTFProperty {

    #id;
    /**
     * An auto incremented identifier for the mesh primitive.
     */
    get $id() {
        return this.#id;
    }

    /**
     * Creates an instance of MeshPrimitive.
     * @param {{
     *   attributes:  MeshPrimitiveAttributeAccessors
     *   indices?:    Accessor,
     *   material?:   Material,
     *   mode?:       typeof GL.POINTS | typeof GL.LINES | typeof GL.LINE_STRIP | typeof GL.TRIANGLES | typeof GL.TRIANGLE_STRIP,
     *   targets?:    MeshPrimitiveTarget[],
     *   extensions?: MeshPrimitiveExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled mesh primitive object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        this.#id = ids++;

        const { attributes, indices, material, mode = 4, targets, extensions } = unmarshalled;

        /**
         * A dictionary object, where each key corresponds to mesh attribute semantic and each value is the Accssor or the
         * index of the Accessor containing attribute's data.
         */
        this.attributes = attributes;

        /**
         * The Accessor that contains the indices.
         */
        this.indices = indices;

        /**
         * The Material to apply to this primitive when rendering.
         */
        this.material = material;

        /**
         * The type of primitives to render.
         */
        this.mode = mode;

        /**
         * An array of Morph Targets, each Morph Target is a dictionary mapping attributes (only
         * `POSITION`, `NORMAL`, `TANGENT`, `TEXCOORD_0`, and `TEXCOORD_1` supported) to their deviations in the Morph Target.
         */
        this.targets = targets;

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
        indices:  { factory: () => Accessor, collection: 'accessors' },
        material: { factory: () => Material, collection: 'materials' },
        targets:  { factory: () => MeshPrimitiveTarget },
        attributes: { referenceFields: {
            POSITION:   { factory: () => Accessor, collection: 'accessors' },
            NORMAL:     { factory: () => Accessor, collection: 'accessors' },
            TANGENT:    { factory: () => Accessor, collection: 'accessors' },
            TEXCOORD_0: { factory: () => Accessor, collection: 'accessors' },
            TEXCOORD_1: { factory: () => Accessor, collection: 'accessors' },
            TEXCOORD_2: { factory: () => Accessor, collection: 'accessors' },
            TEXCOORD_3: { factory: () => Accessor, collection: 'accessors' },
            COLOR_0:    { factory: () => Accessor, collection: 'accessors' },
            COLOR_1:    { factory: () => Accessor, collection: 'accessors' },
            WEIGHTS_0:  { factory: () => Accessor, collection: 'accessors' },
            WEIGHTS_1:  { factory: () => Accessor, collection: 'accessors' },
            JOINTS_0:   { factory: () => Accessor, collection: 'accessors' },
            JOINTS_1:   { factory: () => Accessor, collection: 'accessors' },
        } },
    };
}
