import { GLTFProperty } from '../gltf-property.js';
import { TextureInfo  } from '../texture-info.js';
import { extensions   } from '../extensions.js';

/**
 * @see https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_specular
 */

/**
 * @typedef {{
 *  specularFactor?:       number,
 *  specularTexture?:      import('../texture-info.js').textureInfo,
 *  specularColorFactor?:  [number, number, number],
 *  specularColorTexture?: import('../texture-info.js').textureInfo,
 *  extensions?:           Revelry.GLTF.Extensions.khrMaterialsSpecularMaterial,
 * } & import('../gltf-property.js').glTFPropertyData} khrMaterialsSpecularMaterial
 */

/**
 * This extension adds two parameters to the metallic-roughness material: specular and specularColor.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_specular
 */
export class KHRMaterialsSpecularMaterial extends GLTFProperty {
    /**
     * @param {{
     *  specularFactor?:       number,
     *  specularTexture?:      TextureInfo,
     *  specularColorFactor?:  [number, number, number],
     *  specularColorTexture?: TextureInfo,
     *  extensions?:           Revelry.GLTF.Extensions.KHRMaterialsSpecularMaterial,
     * } & import('../gltf-property.js').GLTFPropertyData} khrMaterialsSpecularMaterial
     */
    constructor(khrMaterialsSpecularMaterial) {
        super(khrMaterialsSpecularMaterial);

        const { specularFactor = 1, specularTexture, specularColorFactor = [1, 1, 1], specularColorTexture, extensions } = khrMaterialsSpecularMaterial;

        /**
         * The specular channel.
         */
        this.specularFactor = specularFactor;


        /**
         * A texture that defines the strength of the specular reflection, stored in the alpha (A) channel. This will be multiplied by specularFactor.
         */
        this.specularTexture = specularTexture;

        /**
         * The F0 color of the specular reflection (linear RGB).
         */
        this.specularColorFactor = specularColorFactor;

        /**
         * A texture that defines the F0 color of the specular reflection, stored in the RGB channels and encoded in sRGB. This texture will be multiplied by specularColorFactor.
         */
        this.specularColorTexture = specularColorTexture;

        this.extensions = extensions;
    }

    /**
     * @param {khrMaterialsSpecularMaterial} khrMaterialsSpecularMaterial
     * @param {import('../gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(khrMaterialsSpecularMaterial, options) {
        return new this(this.unmarshall(khrMaterialsSpecularMaterial, options, {
            specularTexture:      { factory: TextureInfo },
            specularColorTexture: { factory: TextureInfo },
        }, 'KHRMaterialsSpecularMaterial'));
    }
}

extensions.add('KHR_materials_specular', {
    schema: {
        Material: KHRMaterialsSpecularMaterial,
    },
});

