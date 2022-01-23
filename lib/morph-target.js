import { GLTFProperty } from './gltf-property.js';

/**
 * Reference to a morphTarget.
 * @typedef {glTFProperty} morphTarget
 * @property {Number} NORMAL - The index of the Accessor containing XYZ vertex normal displacements.
 * @property {Number} [POSITION] - The index of the Accessor containing XYZ vertex position displacements.
 * @property {Number} [TANGENT] - The index of the Accessor containing XYZ vertex tangent displacements.
 * @property {Number} [COLOR_0] - The index of the Accessor containing RGB or RGBA color deltas.
 * @property {Number} [TEXCOORD_0] - The index of the Accessor containing ST texture coordinate displacements.
 * @property {Number} [TEXCOORD_1] - The index of the Accessor containing ST texture coordinate displacements.
 * @see https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#morph-targets
 */

/**
 * A class wrapper around the glTF morphTarget object.
 */
export class MorphTarget extends GLTFProperty {
    /**
     * Creates an instance of MorphTarget.
     * @param {morphTarget} morphTarget - The properties of the morphTarget.
     */
    constructor(morphTarget) {
        super(morphTarget);

        const { NORMAL, POSITION, TANGENT, COLOR_0, TEXCOORD_0, TEXCOORD_1 } = morphTarget;

        /**
         * The Accessor or the index of the Accessor containing XYZ vertex normal displacements.
         * @type {Number|Accessor}
         */
        this.NORMAL = NORMAL;

        /**
         * The Accessor or the index of the Accessor containing XYZ vertex position displacements.
         * @type {Number|Accessor}
         */
        this.POSITION = POSITION;

        /**
         * The Accessor or the index of the Accessor containing XYZ vertex tangent displacements.
         * @type {Number|Accessor}
         */
        this.TANGENT = TANGENT;

        /**
         * The Accessor or the index of the Accessor containing RGB or RGBA color deltas.
         * @type {Number|Accessor}
         */
        this.COLOR_0 = COLOR_0;

        /**
         * The Accessor or the index of the Accessor containing ST texture coordinate displacements.
         * @type {Number|Accessor}
         */
        this.TEXCOORD_0 = TEXCOORD_0;

        /**
         * The Accessor or the index of the Accessor containing ST texture coordinate displacements.
         * @type {Number|Accessor}
         */
        this.TEXCOORD_1 = TEXCOORD_1;
    }

    static referenceFields = [
        { name: 'NORMAL',     type: 'collection', collection: 'accessors' },
        { name: 'POSITION',   type: 'collection', collection: 'accessors' },
        { name: 'TANGENT',    type: 'collection', collection: 'accessors' },
        { name: 'COLOR_0',    type: 'collection', collection: 'accessors' },
        { name: 'TEXCOORD_0', type: 'collection', collection: 'accessors' },
        { name: 'TEXCOORD_1', type: 'collection', collection: 'accessors' },
    ];
}

export default MorphTarget;
