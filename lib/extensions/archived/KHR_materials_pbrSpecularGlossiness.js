import { GLTFProperty } from '../../gltf-property.js';
import { TextureInfo  } from '../../texture-info.js';
import { extensions   } from '../../extensions.js';

/**
 * @typedef {{
 *  diffuseFactor?:             [number, number, number, number],
 *  specularFactor?:            [number, number, number],
 *  glossinessFactor?:          number,
 *  diffuseTexture?:            import('../../texture-info.js').textureInfo,
 *  specularGlossinessTexture?: import('../../texture-info.js').textureInfo,
 *  extensions?:                Revelry.GLTF.Extensions.khrMaterialsPBRSpecularGlossinessMaterial,
 * } & import('../../gltf-property.js').glTFPropertyData} khrMaterialsPBRSpecularGlossinessMaterial
 */

/**
 * This extension defines the specular-glossiness material model from Physically-Based Rendering (PBR). This extensions allows glTF to support this additional workflow.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Archived/KHR_materials_pbrSpecularGlossiness
 */
export class KHRMaterialsPBRSpecularGlossinessMaterial extends GLTFProperty {
    /**
     * @param {{
     *  diffuseFactor?:             [number, number, number, number],
     *  specularFactor?:            [number, number, number],
     *  glossinessFactor?:          number,
     *  diffuseTexture?:            TextureInfo,
     *  specularGlossinessTexture?: TextureInfo,
     *  extensions?:                Revelry.GLTF.Extensions.KHRMaterialsPBRSpecularGlossinessMaterial,
     * } & import('../../gltf-property.js').GLTFPropertyData} khrMaterialsPBRSpecularGlossinessMaterial
     */
    constructor(khrMaterialsPBRSpecularGlossinessMaterial) {
        super(khrMaterialsPBRSpecularGlossinessMaterial);

        const {
            diffuseFactor = [1, 1, 1, 1], specularFactor = [1, 1, 1], glossinessFactor = 1,
            diffuseTexture, specularGlossinessTexture, extensions
        } = khrMaterialsPBRSpecularGlossinessMaterial;

        /**
         * The RGBA components of the reflected diffuse color of the material. Metals have a diffuse value of
         * `[0.0, 0.0, 0.0]`. The fourth component (A) is the alpha coverage of the material. The `alphaMode` property
         * specifies how alpha is interpreted. The values are linear.
         */
        this.diffuseFactor = diffuseFactor;

        /**
         * The specular RGB color of the material. This value is linear.
         */
        this.specularFactor = specularFactor;

        /**
         * The glossiness or smoothness of the material. A value of 1.0 means the material has full glossiness or is
         * perfectly smooth. A value of 0.0 means the material has no glossiness or is completely rough. This value is linear.
         */
        this.glossinessFactor = glossinessFactor;

        /**
         * The diffuse texture. This texture contains RGB components of the reflected diffuse color of the material encoded
         * with the sRGB transfer function. If the fourth component (A) is present, it represents the linear alpha coverage
         * of the material. Otherwise, an alpha of 1.0 is assumed. The `alphaMode` property specifies how alpha is interpreted.
         * The stored texels must not be premultiplied.
         */
        this.diffuseTexture = diffuseTexture;

        /**
         * The specular-glossiness texture is an RGBA texture, containing the specular color (RGB) encoded with the sRGB
         * transfer function and the linear glossiness value (A).
         */
        this.specularGlossinessTexture = specularGlossinessTexture;

        this.extensions = extensions;
    }

    /**
     * @param {khrMaterialsPBRSpecularGlossinessMaterial} khrMaterialsPBRSpecularGlossinessMaterial
     * @param {import('../../gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(khrMaterialsPBRSpecularGlossinessMaterial, options) {
        return new this(this.unmarshall( khrMaterialsPBRSpecularGlossinessMaterial, options, {
            diffuseTexture:            { factory: TextureInfo, assign: { sRGB: true } },
            specularGlossinessTexture: { factory: TextureInfo, assign: { sRGB: true } },
        }, 'KHRMaterialsPBRSpecularGlossinessMaterial'));
    }
}

extensions.add('KHR_materials_pbrSpecularGlossiness', {
    schema: {
        Material: KHRMaterialsPBRSpecularGlossinessMaterial,
    },
});
