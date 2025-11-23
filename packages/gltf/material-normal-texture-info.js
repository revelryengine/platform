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
 * @import { GLTFPropertyData, ReferenceField } from './gltf-property.types.d.ts';
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
     * Reference fields for this class.
     * @type {Record<string, ReferenceField>}
     * @override
     */
    static referenceFields = {
        index: { factory: () => Texture, collection: 'textures', alias: 'texture' },
    };
}
