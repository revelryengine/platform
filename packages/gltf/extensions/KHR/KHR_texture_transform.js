/// <reference path="./KHR_texture_transform.types.d.ts" />

/**
 * This extension adds offset, rotation, and scale properties to textureInfo structures. These properties would typically be implemented as an affine transform on the UV coordinates.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_texture_transform
 *
 * @module
 */

import { GLTFProperty } from '../../gltf-property.js';
import { registry     } from '../registry.js';
import { mat3         } from "revelryengine/deps/gl-matrix.js";

/**
 * @import { glTFPropertyData, GLTFPropertyData, FromJSONGraph } from '../../gltf-property.js';
 * @import { textureInfoKHRTextureTransformExtensions, TextureInfoKHRTextureTransformExtensions } from 'virtual-rev-gltf-extensions';
 */

/**
 * @typedef {object} textureInfoKHRTextureTransform - KHR_texture_transform JSON representation.
 * @property {[number, number]} [offset] - The offset of the UV coordinate origin as a factor of the texture dimensions.
 * @property {number} [rotation] - Rotate the UVs by this many radians counter-clockwise around the origin.
 * @property {[number, number]} [scale] - The scale factor applied to the components of the UV coordinates.
 * @property {number} [texCoord] - Overrides the textureInfo texCoord value if supplied, and if this extension is supported.
 * @property {textureInfoKHRTextureTransformExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_texture_transform class representation.
 */
export class TextureInfoKHRTextureTransform extends GLTFProperty {
    /**
     * Creates a new instance of TextureInfoKHRTextureTransform.
     * @param {{
     *  offset?:     [number, number],
     *  rotation?:   number,
     *  scale?:      [number, number],
     *  texCoord?:   number,
     *  extensions?: TextureInfoKHRTextureTransformExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_texture_transform object
     */
    constructor(unmarshalled) {
        super(unmarshalled);
        const { offset = [0, 0], rotation = 0, scale = [1, 1], texCoord, extensions } = unmarshalled;

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

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {textureInfoKHRTextureTransform & glTFPropertyData} textureInfoKHRTextureTransform - The KHR_texture_transform JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(textureInfoKHRTextureTransform, graph) {
        return this.unmarshall(graph, textureInfoKHRTextureTransform, {
            // No reference fields
        }, this);
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

registry.add('KHR_texture_transform', {
    schema: {
        TextureInfo:                  TextureInfoKHRTextureTransform,
        MaterialNormalTextureInfo:    TextureInfoKHRTextureTransform,
        MaterialOcclusionTextureInfo: TextureInfoKHRTextureTransform,
    },
});
