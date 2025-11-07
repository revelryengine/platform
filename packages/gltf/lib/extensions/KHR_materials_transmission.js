import { GLTFProperty } from '../gltf-property.js';
import { TextureInfo  } from '../texture-info.js';
import { extensions   } from './extensions.js';

/**
 * @typedef {{
 *  transmissionFactor?:  number,
 *  transmissionTexture?: import('../texture-info.js').textureInfo,
 *  extensions?:          Revelry.GLTF.Extensions.khrMaterialsTransmissionMaterial,
 * } & import('../gltf-property.js').glTFPropertyData} khrMaterialsTransmissionMaterial
 */

/**
 * A transparent material is defined by adding the KHR_materials_transmission extension to any glTF material.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_transmission
 */
export class KHRMaterialsTransmissionMaterial extends GLTFProperty {
    /**
     * @param {{
     *  transmissionFactor?:  number,
     *  transmissionTexture?: TextureInfo,
     *  extensions?:          Revelry.GLTF.Extensions.KHRMaterialsTransmissionMaterial,
     * } & import('../gltf-property.js').GLTFPropertyData} khrMaterialsTransmissionMaterial
     */
    constructor(khrMaterialsTransmissionMaterial) {
        super(khrMaterialsTransmissionMaterial);

        const { transmissionFactor = 0, transmissionTexture, extensions } = khrMaterialsTransmissionMaterial;

        /**
         * The base percentage of light that is transmitted through the surface.
         */
        this.transmissionFactor = transmissionFactor;


        /**
         * A texture that defines the transmission percentage of the surface, stored in the R channel. This will be multiplied by transmissionFactor.
         */
        this.transmissionTexture = transmissionTexture;

        this.extensions = extensions;
    }

    /**
     * Creates a KHRMaterialsTransmissionMaterial instance from its JSON representation.
     * @param {khrMaterialsTransmissionMaterial} khrMaterialsTransmissionMaterial
     * @param {import('../gltf-property.js').FromJSONOptions} options
     * @override
     */
    static fromJSON(khrMaterialsTransmissionMaterial, options) {
        return new this(this.unmarshall(khrMaterialsTransmissionMaterial, options, {
            transmissionTexture: { factory: TextureInfo },
        }, 'KHRMaterialsTransmissionMaterial'));
    }
}

extensions.add('KHR_materials_transmission', {
    schema: {
        Material: KHRMaterialsTransmissionMaterial,
    },
});
