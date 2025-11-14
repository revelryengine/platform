/// <reference path="./KHR_materials_volume.types.d.ts" />

/**
 * By default, a glTF 2.0 material describes the scattering properties of a surface enclosing an infinitely thin volume.
 * The surface defined by the mesh represents a thin wall. The volume extension makes it possible to turn the surface into an interface between volumes.
 * The mesh to which the material is attached defines the boundaries of an homogeneous medium and therefore must be manifold.
 * Volumes provide effects like refraction, absorption and scattering. Scattering is not subject of this extension.
 *
 * [Reference Spec - KHR_materials_volume](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_volume)
 *
 * @module
 */

import { GLTFProperty } from '../../gltf-property.js';
import { TextureInfo  } from '../../texture-info.js';
import { registry     } from '../registry.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, FromJSONGraph } from '../../gltf-property.js';
 * @import { materialKHRMaterialsVolumeExtensions, MaterialKHRMaterialsVolumeExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @import { textureInfo } from '../../texture-info.js';
 */

/**
 * @typedef {object} materialKHRMaterialsVolume - KHR_materials_volume JSON representation.
 * @property {number} [thicknessFactor] - The thickness of the volume beneath the surface. The value is given in the coordinate space of the mesh. If the value is 0 the material is thin-walled. Otherwise the material is a volume boundary. The doubleSided property has no effect on volume boundaries.
 * @property {textureInfo} [thicknessTexture] - A texture that defines the thickness, stored in the G channel. This will be multiplied by thicknessFactor.
 * @property {number} [attenuationDistance] - Density of the medium given as the average distance that light travels in the medium before interacting with a particle.
 * @property {[number, number, number]} [attenuationColor] - The color that white light turns into due to absorption when reaching the attenuation distance.
 * @property {materialKHRMaterialsVolumeExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_materials_volume class representation.
 */
export class MaterialKHRMaterialsVolume extends GLTFProperty {
    /**
     * Creates a new instance of MaterialKHRMaterialsVolume.
     * @param {{
     *  thicknessFactor?:     number,
     *  thicknessTexture?:    TextureInfo,
     *  attenuationDistance?: number,
     *  attenuationColor?:    [number, number, number],
     *  extensions?:          MaterialKHRMaterialsVolumeExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_materials_volume object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { thicknessFactor = 0, thicknessTexture, attenuationDistance = 0, attenuationColor = [1, 1, 1], extensions } = unmarshalled;

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

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {materialKHRMaterialsVolume & glTFPropertyData} materialKHRMaterialsVolume - The KHR_materials_volume JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(materialKHRMaterialsVolume, graph) {
        return this.unmarshall(graph, materialKHRMaterialsVolume, {
            thicknessTexture: { factory: TextureInfo },
        }, this);
    }
}

registry.add('KHR_materials_volume', {
    schema: {
        Material: MaterialKHRMaterialsVolume,
    },
});
