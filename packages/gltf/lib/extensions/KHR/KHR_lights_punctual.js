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
 *  glTFKHRLightsPunctualExtensions, GLTFKHRLightsPunctualExtensions,
 *  glTFKHRLightsPunctualLightExtensions, GLTFKHRLightsPunctualLightExtensions,
 *  glTFKHRLightsPunctualLightSpotExtensions, GLTFKHRLightsPunctualLightSpotExtensions,
 *  nodeKHRLightsPunctualExtensions, NodeKHRLightsPunctualExtensions,
 * } from 'virtual-rev-gltf-extensions';
 */

/**
 * @typedef {object} glTFKHRLightsPunctualLightSpot - KHR_lights_punctual Spot Light JSON representation.
 * @property {number} [innerConeAngle] - Angle in radians from centre of spotlight where falloff begins.
 * @property {number} [outerConeAngle] - Angle in radians from centre of spotlight where falloff ends.
 * @property {glTFKHRLightsPunctualLightSpotExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_lights_punctual Spot Light class representation.
 */
export class GLTFKHRLightsPunctualLightSpot extends GLTFProperty {
    /**
     * Creates a new instance of GLTFKHRLightsPunctualLightSpot.
     * @param {{
     *  innerConeAngle?: number,
     *  outerConeAngle?: number,
     *  extensions?:     GLTFKHRLightsPunctualLightSpotExtensions,
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
     * @param {glTFKHRLightsPunctualLightSpot & glTFPropertyData} glTFKHRLightsPunctualLightSpot - The KHR_lights_punctual Spot Light JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(glTFKHRLightsPunctualLightSpot, graph) {
        return this.unmarshall(graph, glTFKHRLightsPunctualLightSpot, {
            // No reference fields
        }, this);
    }
}

/**
 * @typedef {object} glTFKHRLightsPunctualLight - KHR_lights_punctual Light JSON representation.
 * @property {string} type - Specifies the light type.
 * @property {number} [range] - A distance cutoff at which the light's intensity may be considered to have reached zero.
 * @property {[number, number, number]} [color] - Color of the light source.
 * @property {number} [intensity] - Intensity of the light source.
 * @property {glTFKHRLightsPunctualLightSpot} [spot] - A spot light
 * @property {glTFKHRLightsPunctualLightExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_lights_punctual Light class representation.
 */
export class GLTFKHRLightsPunctualLight extends NamedGLTFProperty {
    /**
     * Creates a new instance of GLTFKHRLightsPunctualLight.
     * @param {{
     *  type:        'directional' | 'point' | 'spot',
     *  range?:       number
     *  color?:      [number, number, number],
     *  intensity?:  number,
     *  spot?:       GLTFKHRLightsPunctualLightSpot,
     *  extensions?: GLTFKHRLightsPunctualLightExtensions,
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
     * @param {glTFKHRLightsPunctualLight & namedGLTFPropertyData} glTFKHRLightsPunctualLight - The KHR_lights_punctual Light JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(glTFKHRLightsPunctualLight, graph) {
        return this.unmarshall(graph, glTFKHRLightsPunctualLight, {
            spot: { factory: GLTFKHRLightsPunctualLightSpot },
        }, this);
    }
}

/**
 * @typedef {object} glTFKHRLightsPunctual - KHR_lights_punctual JSON representation.
 * @property {glTFKHRLightsPunctualLight[]} lights - An array of lights.
 * @property {glTFKHRLightsPunctualExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_lights_punctual class representation.
 */
export class GLTFKHRLightsPunctual extends GLTFProperty {
    /**
     * Creates a new instance of GLTFKHRLightsPunctual.
     * @param {{
     *  lights:      GLTFKHRLightsPunctualLight[],
     *  extensions?: GLTFKHRLightsPunctualExtensions,
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
     * @param {glTFKHRLightsPunctual & glTFPropertyData} glTFKHRLightsPunctual - The KHR_lights_punctual JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(glTFKHRLightsPunctual, graph) {
        return this.unmarshall(graph, glTFKHRLightsPunctual, {
            lights: { factory: GLTFKHRLightsPunctualLight },
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
     *  light:       GLTFKHRLightsPunctualLight,
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
            light: { factory: GLTFKHRLightsPunctualLight, collection: ['extensions', 'KHR_lights_punctual', 'lights'] },
        }, this);
    };
}

registry.add('KHR_lights_punctual', {
    schema: {
        GLTF: GLTFKHRLightsPunctual,
        Node: NodeKHRLightsPunctual,
    }
});
