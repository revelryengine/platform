import { GLTFProperty, NamedGLTFProperty } from '../gltf-property.js';
import { Image                           } from '../image.js';
import { extensions                      } from '../extensions.js';

/**
 * @typedef {{
 *  source:      number,
 *  layer?:      number,
 *  extensions?: Revelry.GLTF.Extensions.khrEnvironmentMapCubemap,
 * } & import('../gltf-property.js').glTFPropertyData} khrEnvironmentMapCubemap
 */

/**
 * The texture cubemap can be seen as a way of representing the environment in which one or more glTF models are placed.
 * The irradiance coefficients contain the non-directed light contribution integrated from the scene, these may be supplied or can be calculated by the implementations.
 */
export class KHREnvironmentMapCubemap extends GLTFProperty {
    /**
     * @param {{
     *  source:      Image,
     *  layer?:      number,
     *  extensions?: Revelry.GLTF.Extensions.KHREnvironmentMapCubemap,
     * } & import('../gltf-property.js').GLTFPropertyData} khrEnvironmentMapCubemap
     */
    constructor(khrEnvironmentMapCubemap) {
        super(khrEnvironmentMapCubemap);

        const { source, layer = 0, extensions } = khrEnvironmentMapCubemap;

        /**
         * Image reference to one of the cubemap images declared by this extension.
         */
        this.source = source;

        /**
         * Layer in the image that contains the cubemap, defaults to 0 if no value supplied.
         */
        this.layer = layer;

        this.extensions = extensions;
    }

    /**
     * @param {khrEnvironmentMapCubemap} khrEnvironmentMapCubemap
     * @param {import('../gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(khrEnvironmentMapCubemap, options) {
        return new this(this.unmarshall(khrEnvironmentMapCubemap, options, {
            source: { factory: Image, collection: ['images'] },
        }, 'KHREnvironmentMapCubemap'));
    }
}

/**
 *
 * @typedef {{
 *  irradianceCoefficients: [
 *      [number, number, number],
 *      [number, number, number],
 *      [number, number, number],
 *      [number, number, number],
 *      [number, number, number],
 *      [number, number, number],
 *      [number, number, number],
 *      [number, number, number],
 *      [number, number, number],
 *  ],
 *  cubemap:        number,
 *  boundingBoxMin: [number, number, number],
 *  boundingBoxMax: [number, number, number],
 *  extensions?:    Revelry.GLTF.Extensions.khrEnvironmentMapData,
 * } & import('../gltf-property.js').namedGLTFPropertyData} khrEnvironmentMapData
 */

/**
 * An image based environment Map.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/KHR_lights_environment/extensions/2.0/Khronos/KHR_lights_environment#declaring-an-environment-map
 */
export class KHREnvironmentMapData extends NamedGLTFProperty {
    /**
     * @param {{
     *  irradianceCoefficients: khrEnvironmentMapData['irradianceCoefficients'],
     *  cubemap:        KHREnvironmentMapCubemap,
     *  boundingBoxMin: [number, number, number],
     *  boundingBoxMax: [number, number, number],
     *  extensions?:    Revelry.GLTF.Extensions.KHREnvironmentMapData,
     * } & import('../gltf-property.js').NamedGLTFPropertyData} khrEnvironmentMapData
     */
    constructor(khrEnvironmentMapData) {
        super(khrEnvironmentMapData);

        const { irradianceCoefficients, cubemap, boundingBoxMin, boundingBoxMax, extensions } = khrEnvironmentMapData;

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

        this.extensions = extensions;
    }

    /**
     * @param {khrEnvironmentMapData} khrEnvironmentMapData
     * @param {import('../gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(khrEnvironmentMapData, options) {
        return new this(this.unmarshall(khrEnvironmentMapData, options, {
            cubemap: { factory: KHREnvironmentMapCubemap, collection: ['extensions', 'KHR_environment_map', 'cubemaps'] },
        }, 'KHREnvironmentMapData'));
    }
}

/**
 * @typedef {{
 *  cubemaps:         khrEnvironmentMapCubemap[],
 *  environment_maps: khrEnvironmentMapData[],
 *  extensions?:      Revelry.GLTF.Extensions.khrEnvironmentMapGLTF,
 * } & import('../gltf-property.js').glTFPropertyData} khrEnvironmentMapGLTF
 */

/**
 * An image based environment Map.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/KHR_lights_environment/extensions/2.0/Khronos/KHR_lights_environment#declaring-an-environment-map
 */
export class KHREnvironmentMapGLTF extends GLTFProperty {
    /**
     * @param {{
     *  cubemaps:         KHREnvironmentMapCubemap[],
     *  environment_maps: KHREnvironmentMapData[],
     *  extensions?:      Revelry.GLTF.Extensions.KHREnvironmentMapGLTF,
     * } & import('../gltf-property.js').GLTFPropertyData} khrEnvironmentMapGLTF
     */
    constructor(khrEnvironmentMapGLTF) {
        super(khrEnvironmentMapGLTF);

        const { environment_maps = [], cubemaps = [], extensions } = khrEnvironmentMapGLTF;

        /**
         * Array of cubemaps that are referenced by the environment light declaration in a scene.
         */
        this.cubemaps = cubemaps;

        /**
         * Array of lights to be used with this extension, referenced from a scene by the lights property.
         */
        this.environment_maps = environment_maps;

        this.extensions = extensions;
    }

    /**
     * @param {khrEnvironmentMapGLTF} khrEnvironmentMapGLTF
     * @param {import('../gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(khrEnvironmentMapGLTF, options) {
        return new this(this.unmarshall(khrEnvironmentMapGLTF, options, {
            cubemaps:         { factory: KHREnvironmentMapCubemap },
            environment_maps: { factory: KHREnvironmentMapData    },
        }, 'KHREnvironmentMapGLTF'));
    }
}

/**
 * @typedef {{
 *  environment_map: number,
 *  extensions?:     Revelry.GLTF.Extensions.khrEnvironmentMapScene,
 * } & import('../gltf-property.js').glTFPropertyData} khrEnvironmentMapScene
 */

/**
 * The environment map is utilized by a scene.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/KHR_lights_environment/extensions/2.0/Khronos/KHR_lights_environment#using-the-environment-map
 */
export class KHREnvironmentMapScene extends GLTFProperty {
    /**
     * @param {{
     *  environment_map: KHREnvironmentMapData,
     *  extensions?:     Revelry.GLTF.Extensions.KHREnvironmentMapScene,
     * } & import('../gltf-property.js').GLTFPropertyData} khrEnvironmentMapScene
     */
    constructor(khrEnvironmentMapScene) {
        super(khrEnvironmentMapScene);

        const { environment_map, extensions } = khrEnvironmentMapScene;

        /**
         * The environment map referenced by this scene.
         */
        this.environment_map = environment_map;

        this.extensions = extensions;
    }

    /**
     * @param {khrEnvironmentMapScene} khrEnvironmentMapScene
     * @param {import('../gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(khrEnvironmentMapScene, options) {
        return new this(this.unmarshall(khrEnvironmentMapScene, options, {
            environment_map: { factory: KHREnvironmentMapData, collection: ['extensions', 'KHR_environment_map', 'environment_maps'] },
        }, 'KHREnvironmentMapScene'));
    }
}

extensions.add('KHR_environment_map', {
    schema: {
        GLTF:  KHREnvironmentMapGLTF,
        Scene: KHREnvironmentMapScene,
    }
});
