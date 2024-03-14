import { GLTFProperty, NamedGLTFProperty } from '../gltf-property.js';
import { extensions                      } from '../extensions.js';

/**
 * @typedef {{
 *  innerConeAngle?: number,
 *  outerConeAngle?: number,
 *  extensions?:     Revelry.GLTF.Extensions.khrLightsPunctualSpot,
 * } & import('../gltf-property.js').glTFPropertyData} khrLightsPunctualSpot
 */

/**
 * Punctual Spot Light
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_lights_punctual#spot
 */
export class KHRLightsPunctualSpot extends GLTFProperty {
    /**
     * @param {{
     *  innerConeAngle?: number,
     *  outerConeAngle?: number,
     *  extensions?:     Revelry.GLTF.Extensions.KHRLightsPunctualSpot,
     * } & import('../gltf-property.js').GLTFPropertyData} khrLightsPunctualSpot
     */
    constructor(khrLightsPunctualSpot) {
        super(khrLightsPunctualSpot);

        const { innerConeAngle = 0, outerConeAngle = Math.PI / 4, extensions } = khrLightsPunctualSpot;

        /**
         * Angle in radians from centre of spotlight where falloff begins.
         */
        this.innerConeAngle = innerConeAngle;

        /**
         * Angle in radians from centre of spotlight where falloff ends.
         */
        this.outerConeAngle = outerConeAngle;

        this.extensions = extensions;
    }

    /**
     * @param {khrLightsPunctualSpot} khrLightsPunctualSpot
     * @param {import('../gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(khrLightsPunctualSpot, options) {
        return new this(this.unmarshall(khrLightsPunctualSpot, options, {
        }, 'KHRLightsPunctualSpot'));
    }
}

/**
 * @typedef {{
 *  type:        'directional' | 'point' | 'spot',
 *  range?:       number
 *  color?:      [number, number, number],
 *  intensity?:  number,
 *  spot?:       khrLightsPunctualSpot,
 *  extensions?: Revelry.GLTF.Extensions.khrLightsPunctualLight,
 * } & import('../gltf-property.js').namedGLTFPropertyData} khrLightsPunctualLight
 */

/**
 * All light types share the common set of properties listed below.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_lights_punctual#light-types
 */
export class KHRLightsPunctualLight extends NamedGLTFProperty {
    /**
     * @param {{
     *  type:        'directional' | 'point' | 'spot',
     *  range?:       number
     *  color?:      [number, number, number],
     *  intensity?:  number,
     *  spot?:       KHRLightsPunctualSpot,
     *  extensions?: Revelry.GLTF.Extensions.KHRLightsPunctualLight,
     * } & import('../gltf-property.js').NamedGLTFPropertyData} khrLightsPunctualLight
     */
    constructor(khrLightsPunctualLight) {
        super(khrLightsPunctualLight);

        const { type, range = Infinity, color = [1, 1, 1], intensity = 1, spot, extensions } = khrLightsPunctualLight;

        /**
         * Specifies the light type.
         */
        this.type = type;

        /**
         * A distance cutoff at which the light's intensity may be considered to have reached zero.
         */
        this.range = range;

        /**
         * Color of the light source.
         */
        this.color = color;

        /**
         * Intensity of the light source. `point` and `spot` lights use luminous intensity in candela (lm/sr) while `directional` lights use illuminance in lux (lm/m^2)
         */
        this.intensity = intensity;

        /**
         * A spot light
         */
        this.spot = spot;

        this.extensions = extensions;
    }

    /**
     * @param {khrLightsPunctualLight} khrLightsPunctualLight
     * @param {import('../gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(khrLightsPunctualLight, options) {
        return new this(this.unmarshall(khrLightsPunctualLight, options, {
            spot: { factory: KHRLightsPunctualSpot },
        }, 'KHRLightsPunctualLight'));
    }
}

/**
 * @typedef {{
 *  lights:      khrLightsPunctualLight[],
 *  extensions?: Revelry.GLTF.Extensions.khrLightsPunctualGLTF,
 * } & import('../gltf-property.js').glTFPropertyData} khrLightsPunctualGLTF
 */

/**
 * This extension defines a set of lights for use with glTF 2.0. Lights define light sources within a scene.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_lights_punctual#light-types
 */
export class KHRLightsPunctualGLTF extends GLTFProperty {
    /**
     * @param {{
     *  lights:      KHRLightsPunctualLight[],
     *  extensions?: Revelry.GLTF.Extensions.KHRLightsPunctualGLTF,
     * } & import('../gltf-property.js').GLTFPropertyData} khrLightsPunctualGLTF
     */
    constructor(khrLightsPunctualGLTF) {
        super(khrLightsPunctualGLTF);

        const { lights = [], extensions } = khrLightsPunctualGLTF;

        /**
         * An array of lights.
         */
        this.lights = lights;

        this.extensions = extensions;
    }

    /**
     * @param {khrLightsPunctualGLTF} khrLightsPunctualGLTF
     * @param {import('../gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(khrLightsPunctualGLTF, options) {
        return new this(this.unmarshall(khrLightsPunctualGLTF, options, {
            lights: { factory: KHRLightsPunctualLight },
        }, 'KHRLightsPunctualGLTF'));
    }
}

/**
 * @typedef {{
 *  light:       number,
 *  extensions?: Revelry.GLTF.Extensions.khrLightsPunctualNode,
 * } & import('../gltf-property.js').glTFPropertyData} khrLightsPunctualNode
 */

/**
 * Lights must be attached to a node by defining the extensions.KHR_lights_punctual property and, within that, an index into the lights array using the light property.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_lights_punctual#adding-light-instances-to-nodes
 */
export class KHRLightsPunctualNode extends GLTFProperty {
    /**
     * @param {{
     *  light:       KHRLightsPunctualLight,
     *  extensions?: Revelry.GLTF.Extensions.KHRLightsPunctualNode,
     * } & import('../gltf-property.js').GLTFPropertyData} khrLightsPunctualNode
     */
    constructor(khrLightsPunctualNode) {
        super(khrLightsPunctualNode);

        const { light, extensions } = khrLightsPunctualNode;

        /**
         * The light referenced by this node.
         */
        this.light = light;

        this.extensions = extensions;
    }

    /**
     * @param {khrLightsPunctualNode} khrLightsPunctualNode
     * @param {import('../gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(khrLightsPunctualNode, options) {
        return new this(this.unmarshall(khrLightsPunctualNode, options, {
            light: { factory: KHRLightsPunctualLight, collection: ['extensions', 'KHR_lights_punctual', 'lights'] },
        }, 'KHRLightsPunctualNode'));
    };
}

extensions.add('KHR_lights_punctual', {
    schema: {
        GLTF: KHRLightsPunctualGLTF,
        Node: KHRLightsPunctualNode,
    }
});
