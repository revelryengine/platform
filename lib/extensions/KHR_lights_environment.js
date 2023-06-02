import { extensions                      } from '../extensions.js';
import { GLTFProperty, NamedGLTFProperty } from '../gltf-property.js';
import { Image                           } from '../image.js';

/**
 * KHR_lights_environment has not been ratified yet so this may change
 * @see https://github.com/KhronosGroup/glTF/tree/KHR_lights_environment/extensions/2.0/Khronos/KHR_lights_environment
 */

/**
 * Cubemap definition used for environment lights.
 * @typedef {glTFProperty} khrLightsEnvironmentCubemap
 * @property {Number} source - Image reference to one of the cubemap images declared by this extension.
 * @property {Number} [layer=0]  - Layer in the image that contains the cubemap, defaults to 0 if no value supplied.
 */

/**
 * A class wrapper for the gltf khrLightsEnvironmentCubemap object.
 */
export class KHRLightsEnvironmentCubemap extends GLTFProperty {
    /**
     * Creates an instance of KHRLightsEnvironmentCubemap.
     * @param {khrLightsEnvironmentCubemap} khrLightsEnvironmentCubemap - The properties of the khrLightsEnvironmentCubemap.
     */
    constructor(khrLightsEnvironmentCubemap) {
        super(khrLightsEnvironmentCubemap);
        
        const { source, layer = 0 } = khrLightsEnvironmentCubemap;
        
        /**
         * Image reference to one of the cubemap images declared by this extension.
         * @type {Number|KTXImage}
         */
        this.source = source;
        
        /**
         * Layer in the image that contains the cubemap, defaults to 0 if no value supplied.
         * @type {Number}
         */
        this.layer = layer;
    }

    static referenceFields = [
        { name: 'source', type: 'collection', collection: ['extensions', 'KHR_lights_environment', 'images'] },
    ];
}

/**
 * An image based environment light.
 * @typedef {namedGLTFProperty} khrLightsEnvironmentLight
 * @property {Number[]} irradianceCoefficients - Declares spherical harmonic coefficients for irradiance up to l=2. This is a 9x3 array.
 * @property {Number} cubemap - Texture reference to one of the declared cubemaps in this extension.
 * @property {Number[]} boundingBoxMin - Local boundingbox min. The minimum 3D point of the cubemap boundingbox. In world coordinates (meters)
 * @property {Number[]} boundingBoxMax - Local boundingbox max. The maximum 3D point of the cubemap boundingbox. In world coordinates (meters)
 */

/**
 * A class wrapper for the gltf khrLightsEnvironmentLight object.
 */
export class KHRLightsEnvironmentLight extends NamedGLTFProperty {
    /**
     * Creates an instance of KHRLightsEnvironmentLight.
     * @param {khrLightsEnvironmentLight} khrLightsEnvironmentLight - The properties of the khrLightsEnvironmentLight.
     */
    constructor(khrLightsEnvironmentLight) {
        super(khrLightsEnvironmentLight);
        
        const { irradianceCoefficients, cubemap, boundingBoxMin, boundingBoxMax } = khrLightsEnvironmentLight;
        
        /**
         * Declares spherical harmonic coefficients for irradiance up to l=2. This is a 9x3 array.
         * @type {Number[]}
         */
        this.irradianceCoefficients = irradianceCoefficients;
        
        /**
         * Texture reference to one of the declared cubemaps in this extension.
         * @type {Number|KHRLightsEnvironmentCubemap}
         */
        this.cubemap = cubemap;
        
        /**
         * Local boundingbox min. The minimum 3D point of the cubemap boundingbox. In world coordinates (meters)
         * @type {Number[]}
         */
        this.boundingBoxMin = boundingBoxMin;
        
        /**
         * Local boundingbox max. The maximum 3D point of the cubemap boundingbox. In world coordinates (meters)
         * @type {Number[]}
         */
        this.boundingBoxMax = boundingBoxMax;
    }

    static referenceFields = [
        { name: 'cubemap', type: 'collection', collection: ['extensions', 'KHR_lights_environment', 'cubemaps'] },
    ];
}

/**
 * KHR_lights_environment glTF extension
 * @typedef {glTFProperty} khrLightsEnvironmentGLTF
 * @property {khrLightsEnvironmentLight[]} lights - Array of lights to be used with this extension, referenced from a scene by the lights property.
 * @property {Image[]} images - Array of image declarations, each image shall point to a KTX V2 file containing at least one cubemap.
 * @property {khrLighsEnvironmentCubemap[]} cubemaps - Array of cubemaps that are referenced by the environment light declaration in a scene.
 */

/**
 * A class wrapper for the gltf khrLightsEnvironmentGLTF object.
 */
export class KHRLightsEnvironmentGLTF extends GLTFProperty {
    /**
     * Creates an instance of KHRLightsEnvironmentGLTF.
     * @param {khrLightsEnvironmentGLTF} khrLightsEnvironmentGLTF - The properties of the KHR_lights_environment glTF extension.
     */
    constructor(khrLightsEnvironmentGLTF) {
        super(khrLightsEnvironmentGLTF);
        
        const { lights = [], images = [], cubemaps = [] } = khrLightsEnvironmentGLTF;
        
        /**
         * Array of lights to be used with this extension, referenced from a scene by the lights property.
         * @type {KHRLightsEnvironmentLight[]}
         */
        this.lights = lights.map((light) => new KHRLightsEnvironmentLight(light));

        /**
         * Array of image declarations, each image shall point to a KTX V2 file containing at least one cubemap.
         * @type {Image[]}
         */
        this.images = images.map((image) => new Image(image));

        /**
         * Array of cubemaps that are referenced by the environment light declaration in a scene.
         * @type {Image[]}
         */
        this.cubemaps = cubemaps.map((cubemap) => new KHRLightsEnvironmentCubemap(cubemap));
    }

    static referenceFields = [
        { name: 'lights',   type: 'sub' },
        { name: 'images',   type: 'sub' },
        { name: 'cubemaps', type: 'sub' },
    ];

    /**
     * @param {AbortSignal} [signal]
     */
    async load(signal) {
        await Promise.all(this.images.map(img => {
            return img.loadOnce(signal);
        }));
    }
}

/**
 * KHR_lights_environment scene extension
 * @typedef {glTFProperty} khrLightsEnvironmentScene
 * @property {Number} light - The id of the light referenced by this scene.
 */

/**
 * A class wrapper for the gltf khrLightsEnvironmentScene object.
 */
export class KHRLightsEnvironmentScene extends GLTFProperty {
    /**
     * Creates an instance of KHRLightsEnvironmentScene.
     * @param {khrLightsEnvironmentScene} khrLightsEnvironmentScene - The properties of the KHR_lights_environment scene extension.
     */
    constructor(khrLightsEnvironmentScene) {
        super(khrLightsEnvironmentScene);
        
        const { light } = khrLightsEnvironmentScene;
        
        /**
         * The light or the index of the light referenced by this scene.
         * @type {Number|KHRLightsEnvironmentLight}
         */
        this.light = light;
    }
    
    static referenceFields = [
        { name: 'light', type: 'collection', collection: ['extensions', 'KHR_lights_environment', 'lights'] },
    ];
}

extensions.set('KHR_lights_environment', {
    schema: {
        GLTF:  KHRLightsEnvironmentGLTF,
        Scene: KHRLightsEnvironmentScene,
    }
});
