import { extensions                      } from '../extensions.js';
import { GLTFProperty, NamedGLTFProperty } from '../gltf-property.js';

/**
* @see https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_lights_punctual
*/

/**
* light/spot.
* @typedef {glTFProperty} khrLightsPunctualSpot
* @property {Number} [innerConeAngle=0] - Angle in radians from centre of spotlight where falloff begins.
* @property {Number} [outerConeAngle=Math.PI/4] - Angle in radians from centre of spotlight where falloff ends.
*/

/**
* A class wrapper for the gltf khrLightsPunctualSpot object.
*/
export class KHRLightsPunctualSpot extends GLTFProperty {
    /**
    * Creates an instance of KHRLightsPunctualSpot.
    * @param {khrLightsPunctualSpot} khrLightsPunctualSpot - The properties of the khrLightsPunctualSpot.
    */
    constructor(khrLightsPunctualSpot) {
        super(khrLightsPunctualSpot);
        
        const { innerConeAngle = 0, outerConeAngle = Math.PI / 4 } = khrLightsPunctualSpot;
        
        /**
        * Angle in radians from centre of spotlight where falloff begins.
        * @type {Number}
        */
        this.innerConeAngle = innerConeAngle;
        
        /**
        * Angle in radians from centre of spotlight where falloff ends.
        * @type {Number}
        */
        this.outerConeAngle = outerConeAngle;
    }
}

/**
* A directional, point, or spot light.
* @typedef {namedGLTFProperty} khrLightsPunctualLight
* @property {Number[]} [color=[1,1,1]] - Color of the light source.
* @property {Number} [intensity=1] - Intensity of the light source. `point` and `spot` lights use luminous intensity in candela (lm/sr) while `directional` lights use illuminance in lux (lm/m^2)
* @property {khrLightsPunctualSpot} [spot] - A spot light
* @property {("directional"|"point"|"spot")} type - Specifies the light type.
* @property {Number} range - A distance cutoff at which the light's intensity may be considered to have reached zero.
*/

/**
* A class wrapper for the gltf khrLightsPunctualLight object.
*/
export class KHRLightsPunctualLight extends NamedGLTFProperty {
    /**
    * Creates an instance of KHRLightsPunctualLight.
    * @param {khrLightsPunctualLight} khrLightsPunctualLight - The properties of the khrLightsPunctualLight.
    */
    constructor(khrLightsPunctualLight) {
        super(khrLightsPunctualLight);
        
        const { color = [1, 1, 1], intensity = 1, spot, type, range } = khrLightsPunctualLight;
        
        /**
        * Color of the light source.
        * @type {Number[]}
        */
        this.color = color;
        
        /**
        * Intensity of the light source. `point` and `spot` lights use luminous intensity in candela (lm/sr) while `directional` lights use illuminance in lux (lm/m^2)
        * @type {Number}
        */
        this.intensity = intensity;
        
        /**
        * A spot light
        * @type {KHRLightsPunctualSpot}
        */
        this.spot = spot && new KHRLightsPunctualSpot(spot);
        
        /**
        * Specifies the light type.
        * @type {("directional"|"point"|"spot")}
        */
        this.type = type;
        
        /**
        * A distance cutoff at which the light's intensity may be considered to have reached zero.
        * @type {Number}
        */
        this.range = range;
    }
}

/**
* KHR_lights_punctual glTF extension
* @typedef {glTFProperty} khrLightsPunctualGLTF
* @property {khrLightsPunctualLight[]} lights - An array of lights.
*/

/**
* A class wrapper for the gltf khrLightsPunctualGLTF object.
*/
export class KHRLightsPunctualGLTF extends GLTFProperty {
    /**
    * Creates an instance of KHRLightsPunctualGLTF.
    * @param {khrLightsPunctualGLTF} khrLightsPunctualGLTF - The properties of the KHR_lights_punctual glTF extension.
    */
    constructor(khrLightsPunctualGLTF) {
        super(khrLightsPunctualGLTF);
        
        const { lights = [] } = khrLightsPunctualGLTF;
        
        /**
        * An array of lights.
        * @type {KHRLightsPunctualLight[]}
        */
        this.lights = lights.map((light) => new KHRLightsPunctualLight(light));
    }
}

/**
* KHR_lights_punctual node extension
* @typedef {glTFProperty} khrLightsPunctualNode
* @property {Number} light - The id of the light referenced by this node.
*/

/**
* A class wrapper for the gltf khrLightsPunctualNode object.
*/
export class KHRLightsPunctualNode extends GLTFProperty {
    /**
    * Creates an instance of KHRLightsPunctualNode.
    * @param {khrLightsPunctualNode} khrLightsPunctualNode - The properties of the KHR_lights_punctual node extension.
    */
    constructor(khrLightsPunctualNode) {
        super(khrLightsPunctualNode);
        
        const { light } = khrLightsPunctualNode;
        
        /**
        * The light or the index of the light referenced by this node.
        * @type {Number|KHRLightsPunctualLight}
        */
        this.light = light;
    }
    
    static referenceFields = [
        { name: 'light', type: 'collection', collection: ['extensions', 'KHR_lights_punctual', 'lights'] },
    ];
}

extensions.set('KHR_lights_punctual', {
    schema: {
        GLTF: KHRLightsPunctualGLTF,
        Node: KHRLightsPunctualNode,
    }
});
