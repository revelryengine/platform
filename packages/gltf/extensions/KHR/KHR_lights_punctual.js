/// <reference path="./KHR_lights_punctual.types.d.ts" />

/**
 * This extension defines a set of lights for use with glTF 2.0. Lights define light sources within a scene.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_lights_punctual
 *
 * @module
 */

import { GLTFProperty, NamedGLTFProperty } from '../../gltf-property.js';
import { registry                        } from '../registry.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, namedGLTFPropertyData, NamedGLTFPropertyData, FromJSONGraph } from '../../gltf-property.js';
 * @import {
 *  khrLightsPunctualExtensions, KHRLightsPunctualExtensions,
 *  khrLightsPunctualLightExtensions, KHRLightsPunctualLightExtensions,
 *  khrLightsPunctualLightSpotExtensions, KHRLightsPunctualLightSpotExtensions,
 *  nodeKHRLightsPunctualExtensions, NodeKHRLightsPunctualExtensions,
 * } from '@revelryengine/gltf/extensions';
 */

/**
 * @typedef {object} khrLightsPunctualLightSpot - KHR_lights_punctual Spot Light JSON representation.
 * @property {number} [innerConeAngle] - Angle in radians from centre of spotlight where falloff begins.
 * @property {number} [outerConeAngle] - Angle in radians from centre of spotlight where falloff ends.
 * @property {khrLightsPunctualLightSpotExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_lights_punctual Spot Light class representation.
 */
export class KHRLightsPunctualLightSpot extends GLTFProperty {
    /**
     * Creates a new instance of KHRLightsPunctualLightSpot.
     * @param {{
     *  innerConeAngle?: number,
     *  outerConeAngle?: number,
     *  extensions?:     KHRLightsPunctualLightSpotExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_lights_punctual Spot Light object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { innerConeAngle = 0, outerConeAngle = Math.PI / 4, extensions } = unmarshalled;

        /**
         * Angle in radians from centre of spotlight where falloff begins.
         */
        this.innerConeAngle = innerConeAngle;

        /**
         * Angle in radians from centre of spotlight where falloff ends.
         */
        this.outerConeAngle = outerConeAngle;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {khrLightsPunctualLightSpot & glTFPropertyData} khrLightsPunctualLightSpot - The KHR_lights_punctual Spot Light JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(khrLightsPunctualLightSpot, graph) {
        return this.unmarshall(graph, khrLightsPunctualLightSpot, {
            // No reference fields
        }, this);
    }
}

/**
 * @typedef {object} khrLightsPunctualLight - KHR_lights_punctual Light JSON representation.
 * @property {string} type - Specifies the light type.
 * @property {number} [range] - A distance cutoff at which the light's intensity may be considered to have reached zero.
 * @property {[number, number, number]} [color] - Color of the light source.
 * @property {number} [intensity] - Intensity of the light source.
 * @property {khrLightsPunctualLightSpot} [spot] - A spot light
 * @property {khrLightsPunctualLightExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_lights_punctual Light class representation.
 */
export class KHRLightsPunctualLight extends NamedGLTFProperty {
    /**
     * Creates a new instance of KHRLightsPunctualLight.
     * @param {{
     *  type:        'directional' | 'point' | 'spot',
     *  range?:       number
     *  color?:      [number, number, number],
     *  intensity?:  number,
     *  spot?:       KHRLightsPunctualLightSpot,
     *  extensions?: KHRLightsPunctualLightExtensions,
     * } & NamedGLTFPropertyData} unmarshalled - Unmarshalled KHR_lights_punctual Light object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { type, range = Infinity, color = [1, 1, 1], intensity = 1, spot, extensions } = unmarshalled;

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

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {khrLightsPunctualLight & namedGLTFPropertyData} khrLightsPunctualLight - The KHR_lights_punctual Light JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(khrLightsPunctualLight, graph) {
        return this.unmarshall(graph, khrLightsPunctualLight, {
            spot: { factory: KHRLightsPunctualLightSpot },
        }, this);
    }
}

/**
 * @typedef {object} khrLightsPunctual - KHR_lights_punctual JSON representation.
 * @property {khrLightsPunctualLight[]} lights - An array of lights.
 * @property {khrLightsPunctualExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_lights_punctual class representation.
 */
export class KHRLightsPunctual extends GLTFProperty {
    /**
     * Creates a new instance of KHRLightsPunctual.
     * @param {{
     *  lights:      KHRLightsPunctualLight[],
     *  extensions?: KHRLightsPunctualExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_lights_punctual object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { lights = [], extensions } = unmarshalled;

        /**
         * An array of lights.
         */
        this.lights = lights;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {khrLightsPunctual & glTFPropertyData} khrLightsPunctual - The KHR_lights_punctual JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(khrLightsPunctual, graph) {
        return this.unmarshall(graph, khrLightsPunctual, {
            lights: { factory: KHRLightsPunctualLight },
        }, this);
    }
}

/**
 * @typedef {object} nodeKHRLightsPunctual - KHR_lights_punctual Node JSON representation.
 * @property {number} light - The index of the light in the lights array.
 * @property {nodeKHRLightsPunctualExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_lights_punctual Node class representation.
 */
export class NodeKHRLightsPunctual extends GLTFProperty {
    /**
     * Creates a new instance of NodeKHRLightsPunctual.
     * @param {{
     *  light:       KHRLightsPunctualLight,
     *  extensions?: NodeKHRLightsPunctualExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_lights_punctual Node object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { light, extensions } = unmarshalled;

        /**
         * The light referenced by this node.
         */
        this.light = light;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {nodeKHRLightsPunctual & glTFPropertyData} nodeKHRLightsPunctual - The KHR_lights_punctual Node JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(nodeKHRLightsPunctual, graph) {
        return this.unmarshall(graph, nodeKHRLightsPunctual, {
            light: { factory: KHRLightsPunctualLight, collection: ['extensions', 'KHR_lights_punctual', 'lights'] },
        }, this);
    };
}

registry.add('KHR_lights_punctual', {
    schema: {
        GLTF: KHRLightsPunctual,
        Node: NodeKHRLightsPunctual,
    }
});
