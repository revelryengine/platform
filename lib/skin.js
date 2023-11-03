import { NamedGLTFProperty } from './gltf-property.js';
import { Node              } from './node.js';
import { Accessor          } from './accessor.js';

/**
 * @typedef {{
 *  joints:               number[]
 *  inverseBindMatrices?: number,
 *  skeleton?:            number,
 *  extensions?:          Revelry.GLTF.Extensions.skin,
 * } & import('./gltf-property.js').namedGLTFPropertyData} skin
 */

/**
 * Joints and matrices defining a skin.
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-skin
 */
export class Skin extends NamedGLTFProperty {
    /**
     * @param {{
     *  joints:               Node[]
     *  inverseBindMatrices?: Accessor,
     *  skeleton?:            Node,
     *  extensions?:          Revelry.GLTF.Extensions.Skin,
     * } & import('./gltf-property.js').NamedGLTFPropertyData} skin
     */
    constructor(skin) {
        super(skin);

        const { joints, inverseBindMatrices, skeleton } = skin;

        /**
         * Skeleton Nodes, used as joints in this skin.
         */
        this.joints = joints;

        /**
         * The Accessor containing the floating-point 4x4 inverse-bind matrices. The default is
         * that each matrix is a 4x4 identity matrix, which implies that inverse-bind matrices were pre-applied.
         */
        this.inverseBindMatrices = inverseBindMatrices;

        /**
         * The Node used as a skeleton root. When undefined, joints transforms resolve to scene root.
         */
        this.skeleton = skeleton;
    }

    /**
     * @param {skin} skin
     * @param {import('./gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(skin, options) {
        return new this(this.unmarshall(skin, options, {
            joints:              { factory: Node,     collection: 'nodes'     },
            inverseBindMatrices: { factory: Accessor, collection: 'accessors' },
            skeleton:            { factory: Node,     collection: 'nodes'     },
        }, 'Skin'));
    }
}
