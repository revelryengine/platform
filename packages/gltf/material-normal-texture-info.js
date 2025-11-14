/**
 * Reference to a texture.
 *
 * [Reference Spec - Material Normal Texture Info](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-material-normaltextureinfo)
 *
 * @module
 */

import { TextureInfo } from './texture-info.js';
import { Texture     } from './texture.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, FromJSONGraph } from './gltf-property.js';
 * @import { materialNormalTextureInfoExtensions, MaterialNormalTextureInfoExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @typedef {object} materialNormalTextureInfo - MaterialNormalTextureInfo JSON representation.
 * @property {number} index - The index of the texture.
 * @property {number} [texCoord] - The set index of texture's TEXCOORD attribute used for texture coordinate mapping.
 * @property {number} [scale] - The scalar multiplier applied to each normal vector of the normal texture.
 * @property {materialNormalTextureInfoExtensions} [extensions] - Extension-specific data.
 */

/**
 * MaterialNormalTextureInfo class representation.
 */
export class MaterialNormalTextureInfo extends TextureInfo {
    /**
     * Creates an instance of MaterialNormalTextureInfo.
     * @param {{
     *  texture:     Texture,
     *  texCoord?:   number,
     *  scale?:      number,
     *  extensions?: MaterialNormalTextureInfoExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled material normal texture info object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { scale = 1, extensions } = unmarshalled;

        /**
         * The scalar multiplier applied to each normal vector of the normal texture.
         * @type {Number}
         */
        this.scale = scale;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {materialNormalTextureInfo & glTFPropertyData} materialNormalTextureInfo - The material normal texture info JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(materialNormalTextureInfo, graph) {
        return this.unmarshall(graph, materialNormalTextureInfo, {
            index: { factory: Texture, collection: 'textures', alias: 'texture' },
        }, this);
    }
}
