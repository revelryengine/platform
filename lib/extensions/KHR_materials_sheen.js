import { GLTFProperty } from '../gltf-property.js';
import { TextureInfo  } from '../texture-info.js';
import { extensions   } from '../extensions.js';

/**
 * @typedef {{
 *  sheenColorFactor?:      [number, number, number],
 *  sheenColorTexture?:     import('../texture-info.js').textureInfo,
 *  sheenRoughnessFactor?:  number,
 *  sheenRoughnessTexture?: import('../texture-info.js').textureInfo,
 *  extensions?:            Revelry.GLTF.Extensions.khrMaterialsSheenMaterial,
 * } & import('../gltf-property.js').glTFPropertyData} khrMaterialsSheenMaterial
 */

/**
 * This extension defines a sheen that can be layered on top of an existing glTF material definition.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_sheen
 */
export class KHRMaterialsSheenMaterial extends GLTFProperty {
    /**
     * @param {{
     *  sheenColorFactor?:      [number, number, number],
     *  sheenColorTexture?:     TextureInfo,
     *  sheenRoughnessFactor?:  number,
     *  sheenRoughnessTexture?: TextureInfo,
     *  extensions?:            Revelry.GLTF.Extensions.KHRMaterialsSheenMaterial,
     * } & import('../gltf-property.js').GLTFPropertyData} khrMaterialsSheenMaterial
     */
    constructor(khrMaterialsSheenMaterial) {
        super(khrMaterialsSheenMaterial);

        const { sheenColorFactor = [0, 0, 0], sheenColorTexture, sheenRoughnessFactor = 0, sheenRoughnessTexture, extensions } = khrMaterialsSheenMaterial;

        /**
         * The sheen color in linear space.
         */
        this.sheenColorFactor = sheenColorFactor;

        /**
         * The sheen color (RGB) texture.
         */
        this.sheenColorTexture = sheenColorTexture;

        /**
         * The sheen layer roughness.
         */
        this.sheenRoughnessFactor = sheenRoughnessFactor;

        /**
         * The sheen roughness (Alpha) texture.
         */
        this.sheenRoughnessTexture = sheenRoughnessTexture;

        this.extensions = extensions;
    }

    /**
     * @param {khrMaterialsSheenMaterial} khrMaterialsSheenMaterial
     * @param {import('../gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(khrMaterialsSheenMaterial, options) {
        return new this(this.unmarshall(khrMaterialsSheenMaterial, options, {
            sheenColorTexture:     { factory: TextureInfo },
            sheenRoughnessTexture: { factory: TextureInfo },
        }, 'KHRMaterialsSheenMaterial'));
    }
}

extensions.add('KHR_materials_sheen', {
    schema: {
        Material: KHRMaterialsSheenMaterial,
    },
});
