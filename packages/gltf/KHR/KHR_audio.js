/// <reference path="./KHR_audio.types.d.ts" />

/**
 * This extension allows for the addition of spatialized and non-spatialized audio to glTF scenes.
 *
 * [Reference Spec - KHR_audio](https://github.com/KhronosGroup/glTF/blob/3bed830e001187246d75186b83f5b2469d416f36/extensions/2.0/Khronos/KHR_audio)
 *
 * @module
 */

import { GLTFProperty, NamedGLTFProperty } from '../gltf-property.js';
import { BufferView   } from '../buffer-view.js';

/**
 * @import { GLTFPropertyData, NamedGLTFPropertyData, ReferenceField } from '../gltf-property.types.d.ts';
 * @import {
 *  khrAudioExtensions, KHRAudioExtensions,
 *  khrAudioAudioExtensions, KHRAudioAudioExtensions,
 *  khrAudioSourceExtensions, KHRAudioSourceExtensions,
 *  khrAudioEmitterExtensions, KHRAudioEmitterExtensions,
 *  khrAudioEmitterPositionalExtensions, KHRAudioEmitterPositionalExtensions,
 *  nodeKHRAudioExtensions, NodeKHRAudioExtensions,
 *  sceneKHRAudioExtensions, SceneKHRAudioExtensions
 * } from '@revelryengine/gltf/extensions';
 */

/**
 * @typedef {object} khrAudioEmitterPositional - KHR_audio positional audio emitter JSON representation.
 * @property {number} [coneInnerAngle] - The angle, in radians, of a cone inside of which there will be no volume reduction.
 * @property {number} [coneOuterAngle] - The angle, in radians, of a cone outside of which the volume will be reduced to a constant value of `coneOuterGain`.
 * @property {number} [coneOuterGain] - The gain of the audio emitter set when outside the cone defined by the `coneOuterAngle` property. It is a linear value (not dB).
 * @property {'inverse' | 'linear' | 'exponential'} [distanceModel] - Specifies the distance model for the audio emitter.
 * @property {number} [maxDistance] - The maximum distance between the emitter and listener, after which the volume will not be reduced any further.
 * @property {number} [refDistance] - A reference distance for reducing volume as the emitter moves further from the listener.
 * @property {number} [rolloffFactor] - Describes how quickly the volume is reduced as the emitter moves away from listener.
 * @property {khrAudioEmitterPositionalExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_audio positional audio emitter class representation.
 */
 export class KHRAudioEmitterPositional extends GLTFProperty {
    /**
     * Creates a new instance of KHRAudioEmitterPositional.
     * @param {{
     *  coneInnerAngle?: number,
     *  coneOuterAngle?: number,
     *  coneOuterGain?:  number,
     *  distanceModel?:  'inverse' | 'linear' | 'exponential',
     *  maxDistance?:    number,
     *  refDistance?:    number,
     *  rolloffFactor?:  number,
     *  extensions?:     KHRAudioEmitterPositionalExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_audio positional audio emitter object
     */
    constructor(unmarshalled) {
        super(unmarshalled);
        const {
            coneInnerAngle = 2 * Math.PI, coneOuterAngle = 2 * Math.PI, coneOuterGain = 0.0, distanceModel = 'inverse',
            maxDistance = 10000.0, refDistance = 1.0, rolloffFactor = 1.0, extensions
        } = unmarshalled;

        /**
         * The angle, in radians, of a cone inside of which there will be no volume reduction.
         */
        this.coneInnerAngle = coneInnerAngle;

        /**
         * The angle, in radians, of a cone outside of which the volume will be reduced to a constant value of `coneOuterGain`.
         */
        this.coneOuterAngle = coneOuterAngle;

        /**
         * The gain of the audio emitter set when outside the cone defined by the `coneOuterAngle` property. It is a linear value (not dB).
         */
        this.coneOuterGain = coneOuterGain;

        /**
         * Specifies the distance model for the audio emitter.
         *
         * Allowed Values:
         * * "linear"
         * * "inverse"
         * * "exponential"
         */
        this.distanceModel = distanceModel;

        /**
         * The maximum distance between the emitter and listener, after which the volume will not be reduced any further. `maximumDistance` may only be applied when the distanceModel is set to linear. Otherwise, it should be ignored.
         */
        this.maxDistance = maxDistance;

        /**
          * A reference distance for reducing volume as the emitter moves further from the listener. For distances less than this, the volume is not reduced.
          */
        this.refDistance = refDistance;

        /**
          * Describes how quickly the volume is reduced as the emitter moves away from listener. When distanceModel is set to linear, the maximum value is 1 otherwise there is no upper limit.
          */
        this.rolloffFactor = rolloffFactor;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }
}


/**
 * @typedef {object} khrAudioAudio - KHR_audio audio data JSON representation.
 * @property {string} [uri] - The uri of the audio file. Relative paths are relative to the .gltf file.
 * @property {string} [mimeType] - The audio's MIME type. Required if `bufferView` is defined. Unless specified by another extension, the only supported mimeType is `audio/mpeg`.
 * @property {number} [bufferView] - The bufferview that contains the audio data. Use this instead of the audio source's uri property.
 * @property {khrAudioAudioExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_audio audio data class representation.
 */
export class KHRAudioAudio extends NamedGLTFProperty {
    /**
     * @type {Uint8Array|undefined}
     */
    #audioData;

    /**
     * Creates a new instance of KHRAudioAudio.
     * @param {{
     *  uri?:        URL,
     *  mimeType?:   string,
     *  bufferView?: BufferView,
     *  extensions?: KHRAudioAudioExtensions,
     * } & NamedGLTFPropertyData} unmarshalled - Unmarshalled KHR_audio audio data object
     */
    constructor(unmarshalled) {
        super(unmarshalled);
        const { uri, mimeType, bufferView, extensions } = unmarshalled;

        /**
         * The uri of the audio file. Relative paths are relative to the .gltf file.
         */
        this.uri = uri;

        /**
         * The audio's MIME type. Required if `bufferView` is defined. Unless specified by another extension, the only supported mimeType is `audio/mpeg`.
         */
        this.mimeType = mimeType;

        /**
         * The bufferview that contains the audio data. Use this instead of the audio source's uri property.
         */
        this.bufferView = bufferView;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Reference fields for this class.
     * @type {Record<string, ReferenceField>}
     * @override
     */
    static referenceFields = {
        bufferView: { factory: () => BufferView, collection: 'bufferViews' },
        uri:        { factory: () => URL                                   },
    };

    /**
     * Loads the audio data as a Uint8Array.
     * @param {AbortSignal} [signal] - An optional AbortSignal to abort the loading process.
     */
    async loadBufferAsUint8Array(signal) {
        if(!this.bufferView) throw new Error('Invalid State');

        const { buffer, byteOffset, byteLength } = this.bufferView;
        await buffer.loadOnce(signal);
        return new Uint8Array(buffer.getArrayBuffer(), byteOffset, byteLength);
    }

    /**
     * Loads the audio data.
     * @param {AbortSignal} [signal] - An optional AbortSignal to abort the loading process.
     * @override
     */
    async load(signal) {
        await (async () => {
            if(this.uri) {
                const buffer = await fetch(this.uri.href, { signal }).then(res => res.arrayBuffer());
                this.#audioData = new Uint8Array(buffer);
            } else if(this.bufferView) {
                this.#audioData = await this.loadBufferAsUint8Array(signal);
            }
        })();

        return super.load(signal);
    }

    /**
     * Gets the audio data as a Uint8Array.
     */
    getAudioData() {
        if(!this.#audioData) throw new Error('Invalid State');
        return this.#audioData;
    }
}

/**
 * @typedef {object} khrAudioSource - KHR_audio source JSON representation.
 * @property {boolean} [autoPlay] - Whether or not to play the specified audio when the glTF is loaded.
 * @property {number} [gain] - Unitless multiplier against original audio file volume for determining audio source loudness.
 * @property {boolean} [loop] - Whether or not to loop the specified audio when finished.
 * @property {number} audio - The index of the audio data assigned to this clip.
 * @property {khrAudioSourceExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_audio source class representation.
 */
export class KHRAudioSource extends NamedGLTFProperty {
    /**
     * Creates a new instance of KHRAudioSource.
     * @param {{
     *  autoPlay?:    boolean,
     *  gain?:        number,
     *  loop?:        boolean,
     *  audio:        KHRAudioAudio,
     *  extensions?:  KHRAudioSourceExtensions,
     * } & NamedGLTFPropertyData} unmarshalled - Unmarshalled KHR_audio source object
     */
    constructor(unmarshalled) {
        super(unmarshalled);
        const { autoPlay = false, gain = 1.0, loop = false, audio, extensions } = unmarshalled;

        /**
         * Whether or not to play the specified audio when the glTF is loaded.
         */
        this.autoPlay = autoPlay;

        /**
         * Unitless multiplier against original audio file volume for determining audio source loudness.
         */
        this.gain = gain;

        /**
         * Whether or not to loop the specified audio when finished.
         */
        this.loop = loop;

        /**
         * The audio data assigned to this clip.
         */
        this.audio = audio;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Reference fields for this class.
     * @type {Record<string, ReferenceField>}
     * @override
     */
    static referenceFields = {
        audio: { factory: () => KHRAudioAudio, collection: ['extensions', 'KHR_audio', 'audio'] },
    };
}

/**
 * @typedef {object} khrAudioEmitter - KHR_audio emitter JSON representation.
 * @property {'positional' | 'global'} type - Specifies the audio emitter type.
 * @property {number} [gain] - Unitless multiplier against original audio file volume for determining audio source loudness.
 * @property {number[]} [sources] - An array of audio sources or indices used by the audio emitter. This array may be empty.
 * @property {khrAudioEmitterPositional} [positional] - An object containing the positional audio emitter properties. This may only be defined if `type` is set to `positional`.
 * @property {khrAudioEmitterExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_audio emitter class representation.
 */
export class KHRAudioEmitter extends NamedGLTFProperty {
    /**
     * Creates a new instance of KHRAudioEmitter.
     * @param {{
     *  type:        'positional' | 'global'
     *  gain?:       number,
     *  sources?:    KHRAudioSource[],
     *  positional?: KHRAudioEmitterPositional,
     *  extensions?: KHRAudioEmitterExtensions,
     * } & NamedGLTFPropertyData} unmarshalled - Unmarshalled KHR_audio emitter object
     */
    constructor(unmarshalled) {
        super(unmarshalled);
        const { type, gain = 1.0, sources = [], positional, extensions } = unmarshalled;

        /**
         * Specifies the audio emitter type.
         */
        this.type = type;

        /**
         * Unitless multiplier against original audio file volume for determining audio source loudness.
         */
        this.gain = gain;

        /**
         * An array of audio sources or indices used by the audio emitter. This array may be empty.
         */
        this.sources = sources;

        /**
         * An object containing the positional audio emitter properties. This may only be defined if `type` is set to `positional`.
         */
        this.positional = positional;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Reference fields for this class.
     * @type {Record<string, ReferenceField>}
     * @override
     */
    static referenceFields = {
        sources:    { factory: () => KHRAudioSource,           collection: ['extensions', 'KHR_audio', 'sources'] },
        positional: { factory: () => KHRAudioEmitterPositional                                                    },
    };
}

/**
 * @typedef {object} khrAudio - KHR_audio JSON representation.
 * @property {khrAudioSource[]} sources - An array of audio sources to be used in audio emitters.
 * @property {khrAudioEmitter[]} emitters - An array of positional or global audio emitters that can be referenced by nodes or scenes.
 * @property {khrAudioAudio[]} audio - An array of audio that can be referenced by nodes.
 * @property {khrAudioExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_audio class representation.
 */
 export class KHRAudio extends GLTFProperty {
    /**
     * Creates a new instance of KHRAudio.
     * @param {{
     *  sources:     KHRAudioSource[],
     *  emitters:    KHRAudioEmitter[],
     *  audio:       KHRAudioAudio[],
     *  extensions?: KHRAudioExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_audio object
     */
    constructor(unmarshalled) {
        super(unmarshalled);
        const { sources, emitters, audio, extensions } = unmarshalled;

        /**
         * An array of audio sources to be used in audio emitters.
         */
        this.sources = sources;

        /**
         * An array of positional or global audio emitters that can be referenced by nodes or scenes.
         */
        this.emitters = emitters;

        /**
         * An array of audio that can be referenced by nodes.
         */
        this.audio = audio;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Reference fields for this class.
     * @type {Record<string, ReferenceField>}
     * @override
     */
    static referenceFields = {
        sources:  { factory: () => KHRAudioSource  },
        emitters: { factory: () => KHRAudioEmitter },
        audio:    { factory: () => KHRAudioAudio   },
    };

    /**
     * Loads the audio data.
     * @param {AbortSignal} [signal] - An optional AbortSignal to abort the loading process.
     * @override
     */
    async load(signal) {
        await Promise.all(this.audio.map(audio => {
            return audio.loadOnce(signal);
        }));
        return this;
    }
}

/**
 * @typedef {object} nodeKHRAudio - KHR_audio Node JSON representation.
 * @property {number} emitter - The index of the emitter in the emitters array.
 * @property {nodeKHRAudioExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_audio Node class representation.
 */
export class NodeKHRAudio extends GLTFProperty {
    /**
     * Creates a new instance of NodeKHRAudio.
     * @param {{
     *  emitter: KHRAudioEmitter,
     *  extensions?: NodeKHRAudioExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_audio Node object
     */
    constructor(unmarshalled) {
        super(unmarshalled);
        const { emitter, extensions } = unmarshalled;

        /**
         * The positional audio emitter referenced by this node. Global audio emitters may not be added to nodes.
         */
        this.emitter = emitter

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Reference fields for this class.
     * @type {Record<string, ReferenceField>}
     * @override
     */
    static referenceFields = {
        emitter: { factory: () => KHRAudioEmitter, collection: ['extensions', 'KHR_audio', 'emitters'] },
    };
}

/**
 * @typedef {object} sceneKHRAudio - KHR_audio scene JSON representation.
 * @property {number[]} emitters - An array of indices of the emitters in the emitters array.
 * @property {sceneKHRAudioExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_audio Scene class representation.
 */
export class SceneKHRAudio extends GLTFProperty {
    /**
     * Creates a new instance of SceneKHRAudio.
     * @param {{
     *  emitters:    KHRAudioEmitter[],
     *  extensions?: SceneKHRAudioExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_audio Scene object
     */
    constructor(unmarshalled) {
        super(unmarshalled);
        const { emitters, extensions } = unmarshalled;

        /**
         * The positional audio emitter referenced by this node. Global audio emitters may not be added to nodes.
         */
        this.emitters = emitters;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Reference fields for this class.
     * @type {Record<string, ReferenceField>}
     * @override
     */
    static referenceFields = {
        emitters: { factory: () => KHRAudioEmitter, collection: ['extensions', 'KHR_audio', 'emitters'] },
    };
}

GLTFProperty.extensions.add('KHR_audio', {
    schema: {
        GLTF:  KHRAudio,
        Node:  NodeKHRAudio,
        Scene: SceneKHRAudio,
    },
});
