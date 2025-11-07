import { GLTFProperty } from '../gltf-property.js';
import { extensions   } from './extensions.js';

/**
 * @typedef {{
 *  extensions?: Revelry.GLTF.Extensions.khrMaterialsUnlitMaterial,
 * } & import('../gltf-property.js').glTFPropertyData} khrMaterialsUnlitMaterial
 */

/**
 * This extension defines an unlit shading model for use in glTF 2.0 materials, as an alternative to the Physically Based Rendering (PBR) shading models provided by the core specification.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_unlit
 */
export class KHRMaterialsUnlitMaterial extends GLTFProperty {
    /**
     * @param {{
     *  extensions?: Revelry.GLTF.Extensions.KHRMaterialsUnlitMaterial,
     * } & import('../gltf-property.js').GLTFPropertyData} khrMaterialsUnlitMaterial
     */
    constructor(khrMaterialsUnlitMaterial) {
        super(khrMaterialsUnlitMaterial);

        const { extensions } = khrMaterialsUnlitMaterial;

        this.extensions = extensions;
    }

    /**
     * Creates a KHRMaterialsUnlitMaterial instance from its JSON representation.
     * @param {khrMaterialsUnlitMaterial} khrMaterialsUnlitMaterial
     * @param {import('../gltf-property.js').FromJSONOptions} options
     * @override
     */
    static fromJSON(khrMaterialsUnlitMaterial, options) {
        return new this(this.unmarshall(khrMaterialsUnlitMaterial, options, {
        }, 'KHRMaterialsUnlitMaterial'));
    }
}

extensions.add('KHR_materials_unlit', {
    schema: {
        Material: KHRMaterialsUnlitMaterial,
    },
});
