import { GLTFProperty } from '../gltf-property.js';
import { extensions   } from './extensions.js';
import { mat3         } from '../../deps/gl-matrix.js';

/**
 * @typedef {{
 *  offset?:     [number, number],
 *  rotation?:   number,
 *  scale?:      [number, number],
 *  texCoord?:   number,
 *  extensions?: Revelry.GLTF.Extensions.khrTextureTransform,
 * } & import('../gltf-property.js').glTFPropertyData} khrTextureTransform
 */

/**
 * This extension adds offset, rotation, and scale properties to textureInfo structures. These properties would typically be implemented as an affine transform on the UV coordinates.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_texture_transform
 */
export class KHRTextureTransform extends GLTFProperty {
    /**
     * @param {{
     *  offset?:     [number, number],
     *  rotation?:   number,
     *  scale?:      [number, number],
     *  texCoord?:   number,
     *  extensions?: Revelry.GLTF.Extensions.KHRTextureTransform,
     * } & import('../gltf-property.js').GLTFPropertyData} khrTextureTransform
     */
    constructor(khrTextureTransform) {
        super(khrTextureTransform);
        const { offset = [0, 0], rotation = 0, scale = [1, 1], texCoord, extensions } = khrTextureTransform;

        /**
         * The offset of the UV coordinate origin as a factor of the texture dimensions.
         */
        this.offset = offset;

        /**
         * Rotate the UVs by this many radians counter-clockwise around the origin.
         */
        this.rotation = rotation;

        /**
         * The scale factor applied to the components of the UV coordinates.
         */
        this.scale = scale;

        /**
         * Overrides the textureInfo texCoord value if supplied, and if this extension is supported.
         */
        this.texCoord = texCoord;

        this.extensions = extensions;
    }

    /**
     * Creates a KHRTextureTransform instance from its JSON representation.
     * @param {khrTextureTransform} khrTextureTransform
     * @param {import('../gltf-property.js').FromJSONOptions} options
     * @override
     */
    static fromJSON(khrTextureTransform, options) {
        return new this(this.unmarshall(khrTextureTransform, options, {
        }, 'KHRTextureTransform'));
    }

    /**
     * Gets the transformation matrix for the texture.
     */
    getTransform() {
        const s  = Math.sin(this.rotation);
        const c  = Math.cos(this.rotation);
        const sX = this.scale[0];
        const sY = this.scale[1];
        const oX = this.offset[0];
        const oY = this.offset[1];

        const rotation = mat3.fromValues(
            c,-s, 0,
            s, c, 0,
            0, 0, 1,
        );

        const scale = mat3.fromValues(
            sX, 0, 0,
            0, sY, 0,
            0,  0, 1,
        );

        const translation = mat3.fromValues(
            1,  0, 0,
            0,  1, 0,
            oX,oY, 1,
        );

        const uvMatrix = mat3.create();
        mat3.multiply(uvMatrix, translation, rotation);
        mat3.multiply(uvMatrix, uvMatrix, scale);
        return uvMatrix;
    }
}

extensions.add('KHR_texture_transform', {
    schema: {
        TextureInfo:                  KHRTextureTransform,
        MaterialNormalTextureInfo:    KHRTextureTransform,
        MaterialOcclusionTextureInfo: KHRTextureTransform,
    },
});
