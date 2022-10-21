import { extensions   } from '../extensions.js';
import { GLTFProperty } from '../gltf-property.js';

/**
 * @see https://github.com/KhronosGroup/glTF/tree/5d3a2a35d139c72a7001aa4872041572b2e42fae/extensions/2.0/Khronos/KHR_audio
 */

/**
 * KHR_audio positional extension
 * @typedef {glTFProperty} khrAudioPositional
 * @property {Number} [coneInnerAngle=2*Math.PI] - The angle, in radians, of a cone inside of which there will be no volume reduction.
 * @property {Number} [coneOuterAngle=2*Math.PI] - The angle, in radians, of a cone outside of which the volume will be reduced to a constant value of`coneOuterGain`.
 * @property {Number} [coneOuterGain=0.0] - The gain of the audio emitter set when outside the cone defined by the `coneOuterAngle` property. It is a linear value (not dB).
 * @property {String} [distanceModel='inverse'] - Specifies the distance model for the audio emitter.
 * @property {Number} [maxDistance=10000.0] - The maximum distance between the emitter and listener, after which the volume will not be reduced any further. `maximumDistance` may only be applied when the distanceModel is set to linear. Otherwise, it should be ignored.
 * @property {Number} [refDistance=1.0] - A reference distance for reducing volume as the emitter moves further from the listener. For distances less than this, the volume is not reduced.
 * @property {Number} [rolloffFactor=1.0] - Describes how quickly the volume is reduced as the emitter moves away from listener. When distanceModel is set to linear, the maximum value is 1 otherwise there is no upper limit.
 */

/**
 * A class wrapper for the khrAudioPositional object.
 */
 export class KHRAudioPositional extends GLTFProperty {
    /**
     * Creates an instance of KHRAudioPositional.
     * @param {khrAudioPositional} khrAudioPositional - The properties of the KHR_audio source extension.
     */
    constructor(khrAudioPositional) {
        super(khrAudioPositional);
        const { 
            coneInnerAngle = 2 * Math.PI, coneOuterAngle = 2 * Math.PI, coneOuterGain = 0.0, distanceModel = 'inverse',
            maxDistance = 10000.0, refDistance = 1.0, rolloffFactor = 1.0,
        } = khrAudioPositional;
        
        /**
         * The angle, in radians, of a cone inside of which there will be no volume reduction.
         * @type {Number}
         */
        this.coneInnerAngle = coneInnerAngle;
        
        /**
         * The angle, in radians, of a cone outside of which the volume will be reduced to a constant value of`coneOuterGain`.
         * @type {Number}
         */
        this.coneOuterAngle = coneOuterAngle;
        
        /**
         * The gain of the audio emitter set when outside the cone defined by the `coneOuterAngle` property. It is a linear value (not dB).
         * @type {Number}
         */
        this.coneOuterGain = coneOuterGain;

        /**
         * Specifies the distance model for the audio emitter.
         * @type {String}
         */
        this.distanceModel = distanceModel;

        /**
         * The maximum distance between the emitter and listener, after which the volume will not be reduced any further. `maximumDistance` may only be applied when the distanceModel is set to linear. Otherwise, it should be ignored.
         * @type {Number}
         */
        this.maxDistance = maxDistance;
        
        /**
          * A reference distance for reducing volume as the emitter moves further from the listener. For distances less than this, the volume is not reduced.
          * @type {Number}
          */
        this.refDistance = refDistance;
        
        /**
          * Describes how quickly the volume is reduced as the emitter moves away from listener. When distanceModel is set to linear, the maximum value is 1 otherwise there is no upper limit.
          * @type {Number}
          */
        this.rolloffFactor = rolloffFactor;
    }
}

/**
 * KHR_audio source extension
 * @typedef {glTFProperty} khrAudioSource
 * @property {Boolean} [autoPlay=false] - Whether or not to play the specified audio when the glTF is loaded.
 * @property {Number} [gain=1.0] - Unitless multiplier against original audio file volume for determining audio source loudness.
 * @property {Boolean} [loop=false] - Whether or not to loop the specified audio when finished.
 * @property {Number} audio - The index of the audio data assigned to this clip.
 */

/**
 * A class wrapper for the khrAudioSource object.
 */
 export class KHRAudioSource extends GLTFProperty {
    /**
     * Creates an instance of KHRAudioSource.
     * @param {khrAudioSource} khrAudioSource - The properties of the KHR_audio source extension.
     */
    constructor(khrAudioSource) {
        super(khrAudioSource);
        const { autoPlay = false, gain = 1.0, loop = false, audio } = khrAudioSource;
        
        /**
         * Whether or not to play the specified audio when the glTF is loaded.
         * @type {Boolean}
         */
        this.autoPlay = autoPlay;
        
        /**
         * Unitless multiplier against original audio file volume for determining audio source loudness.
         * @type {Number}
         */
        this.gain = gain;
        
        /**
         * Whether or not to loop the specified audio when finished.
         * @type {Boolean}
         */
        this.loop = loop;

        /**
         * The audio data or the index of the audio data assigned to this clip.
         * @type {Number|KHRAudioAudio}
         */
        this.audio = audio;
    }

    static referenceFields = [
        { name: 'audio', type: 'collection', collection: ['extensions', 'KHR_audio', 'audio'] },
    ];
}

/**
 * KHR_audio emitter extension
 * @typedef {glTFProperty} khrAudioEmitter
 * @property {String} type - Specifies the audio emitter type.
 * @property {Number} [gain=1.0] - Unitless multiplier against original audio file volume for determining audio emitter loudness.
 * @property {Number} [sources] - An array of audio source indices used by the audio emitter. This array may be empty.
 * @property {Object} [positional] - 
 */

/**
 * A class wrapper for the khrAudioEmitter object.
 */
 export class KHRAudioEmitter extends GLTFProperty {
    /**
     * Creates an instance of KHRAudioEmitter.
     * @param {khrAudioEmitter} khrAudioEmitter - The properties of the KHR_audio emitter extension.
     */
    constructor(khrAudioEmitter) {
        super(khrAudioEmitter);
        const { type, gain = 1.0, sources = [], positional } = khrAudioEmitter;
        
        /**
         * Specifies the audio emitter type.
         * @type {String}
         */
        this.type = type;
        
        /**
         * Unitless multiplier against original audio file volume for determining audio source loudness.
         * @type {Number}
         */
        this.gain = gain;
        
        /**
         * An array of audio sources or indices used by the audio emitter. This array may be empty.
         * @type {Number[]|KHRAudioSource[]}
         */
        this.sources = sources;

        /*
         * @type {KHRAudioPositional}
         */
        this.positional = type === 'positional' ? new KHRAudioPositional(positional) : undefined;
    }

    static referenceFields = [
        { name: 'sources', type: 'collection', collection: ['extensions', 'KHR_audio', 'sources'] },
    ];
}

/**
 * KHR_audio audio extension
 * @typedef {glTFProperty} khrAudioAudio
 * @property {String} [uri] - The uri of the audio file.
 * @property {String} [mimeType] - The audio's MIME type. Required if `bufferView` is defined. Unless specified by another extension, the only supported mimeType is `audio/mpeg`.
 * @property {Number} [bufferView] - The index of the bufferView that contains the audio data. Use this instead of the audio source's uri property.
 */

/**
 * A class wrapper for the khrAudioAudio object.
 */
export class KHRAudioAudio extends GLTFProperty {
    #arrayBuffer;
    #pending;

    /**
     * Creates an instance of KHRAudioAudio.
     * @param {khrAudioAudio} khrAudioAudio - The properties of the KHR_audio audio extension.
     */
    constructor(khrAudioAudio) {
        super(khrAudioAudio);
        const { uri, mimeType, bufferView, } = khrAudioAudio;
        
        /**
         * The uri of the audio file. Relative paths are relative to the .gltf file.
         * @type {String}
         */
        this.uri = uri;
        
        /**
         * The audio's MIME type. Required if `bufferView` is defined. Unless specified by another extension, the only supported mimeType is `audio/mpeg`.
         * @type {String}
         */
        this.mimeType = mimeType;
        
        /**
         * The bufferview or the index of the bufferView that contains the audio data. Use this instead of the audio source's uri property.
         * @type {Number|BufferView}
         */
        this.bufferView = bufferView;
    }

    static referenceFields = [
        { name: 'bufferView', type: 'collection', collection: 'bufferViews' },
        { name: 'uri',        type: 'uri' },
    ];

    async loadBufferAsUint8Array(abortCtl) {
        const { buffer, byteOffset, byteLength } = this.bufferView;
        await buffer.loadOnce(abortCtl);
        return new Uint8Array(buffer.getArrayBuffer(), byteOffset, byteLength);
    }

    async load(abortCtl) {
        if(this.#pending) return this.#pending;
        
        this.#pending = (async () => {
            if(this.uri) {
                this.#arrayBuffer = await fetch(this.uri.href, abortCtl).then(res => res.arrayBuffer());
            } else if(this. bufferView) {
                this.#arrayBuffer = await loadBufferAsUint8Array(abortCtl);
            }
        })();

        await super.load(abortCtl);
        return this.#pending;
    }

    getArrayBuffer() {
        return this.#arrayBuffer;
    }
}

/**
 * KHR_audio gtlf extension
 * @typedef {glTFProperty} khrAudio
 * @property {khrAudioSource[]} sources - An array of audio sources to be used in audio emitters.
 * @property {khrAudioEmitter[]} emitters - An array of positional or global audio emitters that can be referenced by nodes or scenes.
 * @property {khrAudioAudio[]} audio - An array of audio that can be referenced by nodes.
 */

/**
 * A class wrapper for the khrAudio object.
 */
 export class KHRAudio extends GLTFProperty {
    /**
     * Creates an instance of KHRAudio.
     * @param {khrAudio} khrAudio - The properties of the KHR_audio extension.
     */
    constructor(khrAudio) {
        super(khrAudio);
        const { sources, emitters, audio } = khrAudio;
        
        /**
         * An array of audio sources to be used in audio emitters.
         * @type {KHRAudioSource[]}
         */
        this.sources = sources.map(s => new KHRAudioSource(s));
        
        /**
         * An array of positional or global audio emitters that can be referenced by nodes or scenes.
         * @type {KHRAudioEmitter[]}
         */
        this.emitters = emitters.map(e => new KHRAudioEmitter(e));
        
        /**
         * An array of audio that can be referenced by nodes.
         * @type {KHRAudioAudio[]}
         */
        this.audio = audio.map(a => new KHRAudioAudio(a));
    }

    static referenceFields = [
        { name: 'sources',  type: 'sub' },
        { name: 'emitters', type: 'sub' },
        { name: 'audio',    type: 'sub' },
    ];

    async load(abortCtl) {
        await Promise.all(this.audio.map(audio => {
            return audio.loadOnce(abortCtl);
        }));
    }
}

/**
 * KHR_audio node extension
 * @typedef {glTFProperty} khrAudioNode
 * @property {Number} emitter - The id of the positional audio emitter referenced by this node. Global audio emitters may not be added to nodes.
 */

/**
 * A class wrapper for the khrAudioNode object.
 */
 export class KHRAudioNode extends GLTFProperty {
    /**
     * Creates an instance of KHRAudioNode.
     * @param {khrAudioNode} khrAudioNode - The properties of the KHR_audio node extension.
     */
    constructor(khrAudioNode) {
        super(khrAudioNode);
        const { emitter } = khrAudioNode;
        
        /**
         * The positional audio emitter or the id of the positional audio emitter referenced by this node. Global audio emitters may not be added to nodes.
         * @type {Number|KHRAudioEmitter}
         */
        this.emitter = emitter
    }

    static referenceFields = [
        { name: 'emitter', type: 'collection', collection: ['extensions', 'KHR_audio', 'emitters'] },
    ];
}

/**
 * KHR_audio scene extension
 * @typedef {glTFProperty} khrAudioScene
 * @property {Number} emitters - The indices of each global audio emitter. Positional audio emitters may not be added to the scene node.
 */

/**
 * A class wrapper for the khrAudioNode object.
 */
 export class KHRAudioScene extends GLTFProperty {
    /**
     * Creates an instance of KHRAudio.
     * @param {khrAudioScene} khrAudioScene - The properties of the KHR_audio node extension.
     */
    constructor(khrAudioScene) {
        super(khrAudioScene);
        const { emitters } = khrAudioScene;
        
        /**
         * The positional audio emitter or the id of the positional audio emitter referenced by this node. Global audio emitters may not be added to nodes.
         * @type {Number[]|KHRAudioEmitter[]}
         */
        this.emitters = emitters
    }

    static referenceFields = [
        { name: 'emitters', type: 'collection', collection: ['extensions', 'KHR_audio', 'emitters'] },
    ];
}

extensions.set('KHR_audio', {
    schema: {
        GLTF:  KHRAudio,
        Node:  KHRAudioNode,
        Scene: KHRAudioScene,
    },
});
