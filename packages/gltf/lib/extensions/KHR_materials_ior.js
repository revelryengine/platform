import { GLTFProperty } from '../gltf-property.js';
import { extensions   } from './extensions.js';

/**
 * @typedef {{
 *  ior?:        number
 *  extensions?: Revelry.GLTF.Extensions.khrMaterialsIORMaterial,
 * } & import('../gltf-property.js').glTFPropertyData} khrMaterialsIORMaterial
 */

/**
 * The index of refraction of a material is configured by adding the KHR_materials_ior extension to any glTF material.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_ior
 */
export class KHRMaterialsIORMaterial extends GLTFProperty {
    /**
     * @param {{
     *  ior?:        number
     *  extensions?: Revelry.GLTF.Extensions.KHRMaterialsIORMaterial,
     * } & import('../gltf-property.js').GLTFPropertyData} khrMaterialsIORMaterial
     */
    constructor(khrMaterialsIORMaterial) {
        super(khrMaterialsIORMaterial);

        const { ior = 1.5, extensions } = khrMaterialsIORMaterial;

        /**
         * The index of refraction.
         */
        this.ior = ior;

        this.extensions = extensions;
    }

    /**
     * Creates a KHRMaterialsIORMaterial instance from its JSON representation.
     * @param {khrMaterialsIORMaterial} khrMaterialsIORMaterial
     * @param {import('../gltf-property.js').FromJSONOptions} options
     * @override
     */
    static fromJSON(khrMaterialsIORMaterial, options) {
        return new this(this.unmarshall(khrMaterialsIORMaterial, options, {
        }, 'KHRMaterialsIORMaterial'));
    }
}

extensions.add('KHR_materials_ior', {
    schema: {
        Material: KHRMaterialsIORMaterial,
    },
});
