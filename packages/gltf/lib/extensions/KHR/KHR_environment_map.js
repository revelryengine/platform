/// <reference path="./KHR_environment_map.types.d.ts" />

/**
 * An image based environment Map.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/KHR_lights_environment/extensions/2.0/Khronos/KHR_lights_environment#declaring-an-environment-map
 *
 * @module
 */

import { GLTFProperty, NamedGLTFProperty } from '../../gltf-property.js';
import { Image                           } from '../../image.js';
import { registry                        } from '../registry.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, namedGLTFPropertyData, NamedGLTFPropertyData, FromJSONGraph } from '../../gltf-property.js';
 * @import {
 *  glTFKHREnvironmentMapExtensions, GLTFKHREnvironmentMapExtensions,
 *  glTFKHREnvironmentMapCubemapExtensions, GLTFKHREnvironmentMapCubemapExtensions,
 *  glTFKHREnvironmentMapDataExtensions, GLTFKHREnvironmentMapDataExtensions,
 *  sceneKHREnvironmentMapExtensions, SceneKHREnvironmentMapExtensions
 * } from 'virtual-rev-gltf-extensions';
 */

/**
 * @typedef {object} glTFKHREnvironmentMapCubemap - KHR_environment_map Cubemap JSON representation.
 * @property {number} source - Image reference to one of the cubemap images declared by this extension.
 * @property {number} [layer] - Layer in the image that contains the cubemap, defaults to 0 if no value supplied.
 * @property {glTFKHREnvironmentMapCubemapExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_environment_map Cubemap class representation.
 */
export class GLTFKHREnvironmentMapCubemap extends GLTFProperty {
    /**
     * Creates a new instance of GLTFKHREnvironmentMapCubemap.
     * @param {{
     *  source:      Image,
     *  layer?:      number,
     *  extensions?: GLTFKHREnvironmentMapCubemapExtensions,
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
     * @param {glTFKHREnvironmentMapCubemap & glTFPropertyData} glTFKHREnvironmentMapCubemap - The KHR_environment_map Cubemap JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(glTFKHREnvironmentMapCubemap, graph) {
        return this.unmarshall(graph, glTFKHREnvironmentMapCubemap, {
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
 * @typedef {object} glTFKHREnvironmentMapData - KHR_environment_map Environment Map JSON representation.
 * @property {IrradianceCoefficients} irradianceCoefficients - Declares spherical harmonic coefficients for irradiance up to l=2. This is a 9x3 array.
 * @property {number} cubemap - Texture reference to one of the declared cubemaps in this extension.
 * @property {[number, number, number]} boundingBoxMin - Local boundingbox min. The minimum 3D point of the cubemap boundingbox. In world coordinates (meters)
 * @property {[number, number, number]} boundingBoxMax - Local boundingbox max. The maximum 3D point of the cubemap boundingbox. In world coordinates (meters)
 * @property {glTFKHREnvironmentMapDataExtensions} [extensions] - Extension-specific data.
 */

/**
 *  KHR_environment_map Environment Map class representation.
 */
export class GLTFKHREnvironmentMapData extends NamedGLTFProperty {
    /**
     * Creates a new instance of GLTFKHREnvironmentMapData.
     * @param {{
     *  irradianceCoefficients: glTFKHREnvironmentMapData['irradianceCoefficients'],
     *  cubemap:        GLTFKHREnvironmentMapCubemap,
     *  boundingBoxMin: [number, number, number],
     *  boundingBoxMax: [number, number, number],
     *  extensions?:    GLTFKHREnvironmentMapDataExtensions,
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
     * @param {glTFKHREnvironmentMapData & namedGLTFPropertyData} glTFKHREnvironmentMapData - The KHR_environment_map Environment Map JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(glTFKHREnvironmentMapData, graph) {
        return this.unmarshall(graph, glTFKHREnvironmentMapData, {
            cubemap: { factory: GLTFKHREnvironmentMapCubemap, collection: ['extensions', 'KHR_environment_map', 'cubemaps'] },
        }, this);
    }
}

/**
 * @typedef {object} glTFKHREnvironmentMap - KHR_environment_map JSON representation.
 * @property {glTFKHREnvironmentMapCubemap[]} cubemaps - Array of cubemaps that are referenced by the environment light declaration in a scene.
 * @property {glTFKHREnvironmentMapData[]} environment_maps - Array of lights to be used with this extension, referenced from a scene by the lights property.
 * @property {glTFKHREnvironmentMapExtensions} [extensions] - Extension-specific data.
 */

/**
 * An image based environment Map.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/KHR_lights_environment/extensions/2.0/Khronos/KHR_lights_environment#declaring-an-environment-map
 */
export class GLTFKHREnvironmentMap extends GLTFProperty {
    /**
     * Creates a new instance of GLTFKHREnvironmentMap.
     * @param {{
     *  cubemaps:         GLTFKHREnvironmentMapCubemap[],
     *  environment_maps: GLTFKHREnvironmentMapData[],
     *  extensions?:      GLTFKHREnvironmentMapExtensions,
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
     * @param {glTFKHREnvironmentMap & glTFPropertyData} glTFKHREnvironmentMap - The KHR_environment_map JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(glTFKHREnvironmentMap, graph) {
        return this.unmarshall(graph, glTFKHREnvironmentMap, {
            cubemaps:         { factory: GLTFKHREnvironmentMapCubemap },
            environment_maps: { factory: GLTFKHREnvironmentMapData    },
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
     *  environment_map: GLTFKHREnvironmentMapData,
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
            environment_map: { factory: GLTFKHREnvironmentMapData, collection: ['extensions', 'KHR_environment_map', 'environment_maps'] },
        }, this);
    }
}

registry.add('KHR_environment_map', {
    schema: {
        GLTF:  GLTFKHREnvironmentMap,
        Scene: SceneKHREnvironmentMap,
    }
});
