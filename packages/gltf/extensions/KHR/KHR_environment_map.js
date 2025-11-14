/// <reference path="./KHR_environment_map.types.d.ts" />

/**
 * An image based environment Map.
 *
 * [Reference Spec - KHR_environment_map](https://github.com/KhronosGroup/glTF/tree/KHR_lights_environment/extensions/2.0/Khronos/KHR_lights_environment)
 *
 * @module
 */

import { GLTFProperty, NamedGLTFProperty } from '../../gltf-property.js';
import { Image                           } from '../../image.js';
import { registry                        } from '../registry.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, namedGLTFPropertyData, NamedGLTFPropertyData, FromJSONGraph } from '../../gltf-property.js';
 * @import {
 *  khrEnvironmentMapExtensions, KHREnvironmentMapExtensions,
 *  khrEnvironmentMapCubemapExtensions, KHREnvironmentMapCubemapExtensions,
 *  khrEnvironmentMapDataExtensions, KHREnvironmentMapDataExtensions,
 *  sceneKHREnvironmentMapExtensions, SceneKHREnvironmentMapExtensions
 * } from '@revelryengine/gltf/extensions';
 */

/**
 * @typedef {object} khrEnvironmentMapCubemap - KHR_environment_map Cubemap JSON representation.
 * @property {number} source - Image reference to one of the cubemap images declared by this extension.
 * @property {number} [layer] - Layer in the image that contains the cubemap, defaults to 0 if no value supplied.
 * @property {khrEnvironmentMapCubemapExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_environment_map Cubemap class representation.
 */
export class KHREnvironmentMapCubemap extends GLTFProperty {
    /**
     * Creates a new instance of KHREnvironmentMapCubemap.
     * @param {{
     *  source:      Image,
     *  layer?:      number,
     *  extensions?: KHREnvironmentMapCubemapExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_environment_map Cubemap object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { source, layer = 0, extensions } = unmarshalled;

        /**
         * Image reference to one of the cubemap images declared by this extension.
         */
        this.source = source;

        /**
         * Layer in the image that contains the cubemap, defaults to 0 if no value supplied.
         */
        this.layer = layer;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {khrEnvironmentMapCubemap & glTFPropertyData} khrEnvironmentMapCubemap - The KHR_environment_map Cubemap JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(khrEnvironmentMapCubemap, graph) {
        return this.unmarshall(graph, khrEnvironmentMapCubemap, {
            source: { factory: Image, collection: ['images'] },
        }, this);
    }
}

/**
 * @typedef {[
 *   [number, number, number],
 *   [number, number, number],
 *   [number, number, number],
 *   [number, number, number],
 *   [number, number, number],
 *   [number, number, number],
 *   [number, number, number],
 *   [number, number, number],
 *   [number, number, number],
 * ]} IrradianceCoefficients - A 9x3 array represention the coefficients for spherical harmonics up to l=2.
 *
 * @typedef {object} khrEnvironmentMapData - KHR_environment_map Environment Map JSON representation.
 * @property {IrradianceCoefficients} irradianceCoefficients - Declares spherical harmonic coefficients for irradiance up to l=2. This is a 9x3 array.
 * @property {number} cubemap - Texture reference to one of the declared cubemaps in this extension.
 * @property {[number, number, number]} boundingBoxMin - Local boundingbox min. The minimum 3D point of the cubemap boundingbox. In world coordinates (meters)
 * @property {[number, number, number]} boundingBoxMax - Local boundingbox max. The maximum 3D point of the cubemap boundingbox. In world coordinates (meters)
 * @property {khrEnvironmentMapDataExtensions} [extensions] - Extension-specific data.
 */

/**
 *  KHR_environment_map Environment Map class representation.
 */
export class KHREnvironmentMapData extends NamedGLTFProperty {
    /**
     * Creates a new instance of KHREnvironmentMapData.
     * @param {{
     *  irradianceCoefficients: khrEnvironmentMapData['irradianceCoefficients'],
     *  cubemap:        KHREnvironmentMapCubemap,
     *  boundingBoxMin: [number, number, number],
     *  boundingBoxMax: [number, number, number],
     *  extensions?:    KHREnvironmentMapDataExtensions,
     * } & NamedGLTFPropertyData} unmarshalled - Unmarshalled KHR_environment_map Environment Map object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { irradianceCoefficients, cubemap, boundingBoxMin, boundingBoxMax, extensions } = unmarshalled;

        /**
         * Declares spherical harmonic coefficients for irradiance up to l=2. This is a 9x3 array.
         */
        this.irradianceCoefficients = irradianceCoefficients;

        /**
         * Texture reference to one of the declared cubemaps in this extension.
         */
        this.cubemap = cubemap;

        /**
         * Local boundingbox min. The minimum 3D point of the cubemap boundingbox. In world coordinates (meters)
         */
        this.boundingBoxMin = boundingBoxMin;

        /**
         * Local boundingbox max. The maximum 3D point of the cubemap boundingbox. In world coordinates (meters)
         */
        this.boundingBoxMax = boundingBoxMax;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {khrEnvironmentMapData & namedGLTFPropertyData} khrEnvironmentMapData - The KHR_environment_map Environment Map JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(khrEnvironmentMapData, graph) {
        return this.unmarshall(graph, khrEnvironmentMapData, {
            cubemap: { factory: KHREnvironmentMapCubemap, collection: ['extensions', 'KHR_environment_map', 'cubemaps'] },
        }, this);
    }
}

/**
 * @typedef {object} khrEnvironmentMap - KHR_environment_map JSON representation.
 * @property {khrEnvironmentMapCubemap[]} cubemaps - Array of cubemaps that are referenced by the environment light declaration in a scene.
 * @property {khrEnvironmentMapData[]} environment_maps - Array of lights to be used with this extension, referenced from a scene by the lights property.
 * @property {khrEnvironmentMapExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_environment_map class representation.
 */
export class KHREnvironmentMap extends GLTFProperty {
    /**
     * Creates a new instance of KHREnvironmentMap.
     * @param {{
     *  cubemaps:         KHREnvironmentMapCubemap[],
     *  environment_maps: KHREnvironmentMapData[],
     *  extensions?:      KHREnvironmentMapExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_environment_map object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { environment_maps = [], cubemaps = [], extensions } = unmarshalled;

        /**
         * Array of cubemaps that are referenced by the environment light declaration in a scene.
         */
        this.cubemaps = cubemaps;

        /**
         * Array of lights to be used with this extension, referenced from a scene by the lights property.
         */
        this.environment_maps = environment_maps;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {khrEnvironmentMap & glTFPropertyData} khrEnvironmentMap - The KHR_environment_map JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(khrEnvironmentMap, graph) {
        return this.unmarshall(graph, khrEnvironmentMap, {
            cubemaps:         { factory: KHREnvironmentMapCubemap },
            environment_maps: { factory: KHREnvironmentMapData    },
        }, this);
    }
}

/**
 * @typedef {object} sceneKHREnvironmentMap - KHR_environment_map Scene JSON representation.
 * @property {number} environment_map - The index of the environment map in the environment_maps array.
 * @property {sceneKHREnvironmentMapExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_environment_map Scene class representation.
 */
export class SceneKHREnvironmentMap extends GLTFProperty {
    /**
     * Creates a new instance of SceneKHREnvironmentMap.
     * @param {{
     *  environment_map: KHREnvironmentMapData,
     *  extensions?:     SceneKHREnvironmentMapExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_environment_map Scene object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { environment_map, extensions } = unmarshalled;

        /**
         * The environment map referenced by this scene.
         */
        this.environment_map = environment_map;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {sceneKHREnvironmentMap & glTFPropertyData} sceneKHREnvironmentMap - The KHR_environment_map Scene JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(sceneKHREnvironmentMap, graph) {
        return this.unmarshall(graph, sceneKHREnvironmentMap, {
            environment_map: { factory: KHREnvironmentMapData, collection: ['extensions', 'KHR_environment_map', 'environment_maps'] },
        }, this);
    }
}

registry.add('KHR_environment_map', {
    schema: {
        GLTF:  KHREnvironmentMap,
        Scene: SceneKHREnvironmentMap,
    }
});
