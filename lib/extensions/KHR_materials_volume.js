import { GLTFProperty } from '../gltf-property.js';
import { TextureInfo  } from '../texture-info.js';
import { extensions   } from './extensions.js';

/**
 * KHR_materials_volume material extension
 * @typedef {{
 *  thicknessFactor?:     number,
 *  thicknessTexture?:    import('../texture-info.js').textureInfo,
 *  attenuationDistance?: number,
 *  attenuationColor?:    [number, number, number],
 *  extensions?:          Revelry.GLTF.Extensions.khrMaterialsVolumeMaterial,
 * } & import('../gltf-property.js').glTFPropertyData} khrMaterialsVolumeMaterial
 */

/**
 * By default, a glTF 2.0 material describes the scattering properties of a surface enclosing an infinitely thin volume.
 * The surface defined by the mesh represents a thin wall. The volume extension makes it possible to turn the surface into an interface between volumes.
 * The mesh to which the material is attached defines the boundaries of an homogeneous medium and therefore must be manifold.
 * Volumes provide effects like refraction, absorption and scattering. Scattering is not subject of this extension.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_volume
 */
export class KHRMaterialsVolumeMaterial extends GLTFProperty {
    /**
     * @param {{
     *  thicknessFactor?:     number,
     *  thicknessTexture?:    TextureInfo,
     *  attenuationDistance?: number,
     *  attenuationColor?:    [number, number, number],
     *  extensions?:          Revelry.GLTF.Extensions.KHRMaterialsVolumeMaterial,
     * } & import('../gltf-property.js').GLTFPropertyData} khrMaterialsVolumeMaterial
     */
    constructor(khrMaterialsVolumeMaterial) {
        super(khrMaterialsVolumeMaterial);

        const { thicknessFactor = 0, thicknessTexture, attenuationDistance = 0, attenuationColor = [1, 1, 1], extensions } = khrMaterialsVolumeMaterial;

        /**
         * The thickness of the volume beneath the surface. The value is given in the coordinate space of the mesh. If the value is 0 the material is thin-walled. Otherwise the material is a volume boundary. The doubleSided property has no effect on volume boundaries.
         */
        this.thicknessFactor = thicknessFactor;


        /**
         * A texture that defines the thickness, stored in the G channel. This will be multiplied by thicknessFactor.
         */
        this.thicknessTexture = thicknessTexture;

        /**
         * Density of the medium given as the average distance that light travels in the medium before interacting with a particle. The value is given in world space.
         *
         * Defaults to 0 which is how Infinity is represented in the shader code
         */
        this.attenuationDistance = attenuationDistance;

        /**
         * The color that white light turns into due to absorption when reaching the attenuation distance.
         */
        this.attenuationColor = attenuationColor;

        this.extensions = extensions;
    }

    /**
     * Creates a KHRMaterialsVolumeMaterial instance from its JSON representation.
     * @param {khrMaterialsVolumeMaterial} khrMaterialsVolumeMaterial
     * @param {import('../gltf-property.js').FromJSONOptions} options
     * @override
     */
    static fromJSON(khrMaterialsVolumeMaterial, options) {
        return new this(this.unmarshall(khrMaterialsVolumeMaterial, options, {
            thicknessTexture: { factory: TextureInfo },
        }, 'KHRMaterialsVolumeMaterial'));
    }
}

extensions.add('KHR_materials_volume', {
    schema: {
        Material: KHRMaterialsVolumeMaterial,
    },
});
