import { GLTFProperty } from '../gltf-property.js';
import { BufferView   } from '../buffer-view.js';
import { extensions   } from '../extensions.js';

/**
 * @typedef {{
 *  coneInnerAngle?: number,
 *  coneOuterAngle?: number,
 *  coneOuterGain?:  number,
 *  distanceModel?:  'inverse' | 'linear' | 'exponential',
 *  maxDistance?:    number,
 *  refDistance?:    number,
 *  rolloffFactor?:  number,
 *  extensions?:     Revelry.GLTF.Extensions.khrAudioPositional,
 * } & import('../gltf-property.js').glTFPropertyData} khrAudioPositional
 */

/**
 * Positional Audio Emitter
 *
 * @see https://github.com/KhronosGroup/glTF/blob/3bed830e001187246d75186b83f5b2469d416f36/extensions/2.0/Khronos/KHR_audio/README.md#positional-audio-emitter-properties
 */
 export class KHRAudioPositional extends GLTFProperty {
    /**
     * @param {{
     *  coneInnerAngle?: number,
     *  coneOuterAngle?: number,
     *  coneOuterGain?:  number,
     *  distanceModel?:  'inverse' | 'linear' | 'exponential',
     *  maxDistance?:    number,
     *  refDistance?:    number,
     *  rolloffFactor?:  number,
     *  extensions?:     Revelry.GLTF.Extensions.KHRAudioPositional,
     * } & import('../gltf-property.js').GLTFPropertyData} khrAudioPositional
     */
    constructor(khrAudioPositional) {
        super(khrAudioPositional);
        const {
            coneInnerAngle = 2 * Math.PI, coneOuterAngle = 2 * Math.PI, coneOuterGain = 0.0, distanceModel = 'inverse',
            maxDistance = 10000.0, refDistance = 1.0, rolloffFactor = 1.0, extensions
        } = khrAudioPositional;

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

        this.extensions = extensions;
    }

    /**
     * @param {khrAudioPositional} khrAudioPositional
     * @param {import('../gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(khrAudioPositional, options) {
        return new this(this.unmarshall(khrAudioPositional, options, {
        }, 'KHRAudioPositional'));
    }
}


/**
 * @typedef {{
 *  uri?:        string,
 *  mimeType?:   string,
 *  bufferView?: number,
 *  extensions?: Revelry.GLTF.Extensions.khrAudioData,
 * } & import('../gltf-property.js').glTFPropertyData} khrAudioData
 */

/**
 * Audio Data
 *
 * @see https://github.com/KhronosGroup/glTF/blob/3bed830e001187246d75186b83f5b2469d416f36/extensions/2.0/Khronos/KHR_audio/README.md#audio-data
 */
export class KHRAudioData extends GLTFProperty {
    /**
     * @type {ArrayBuffer|undefined}
     */
    #arrayBuffer;

    /**
     * @param {{
     *  uri?:        URL,
     *  mimeType?:   string,
     *  bufferView?: BufferView,
     *  extensions?: Revelry.GLTF.Extensions.KHRAudioData,
     * } & import('../gltf-property.js').GLTFPropertyData} khrAudioData
     */
    constructor(khrAudioData) {
        super(khrAudioData);
        const { uri, mimeType, bufferView, extensions } = khrAudioData;

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

        this.extensions = extensions;
    }

    /**
     * @param {khrAudioData} khrAudioData
     * @param {import('../gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(khrAudioData, options) {
        return new this(this.unmarshall(khrAudioData, options, {
            bufferView: { factory: BufferView, collection: 'bufferViews' },
            uri:        { factory: URL                                   },
        }, 'KHRAudioData'));
    }

    /**
     * @param {AbortSignal} [signal]
     */
    async loadBufferAsUint8Array(signal) {
        if(!this.bufferView) throw new Error('Invalid State');

        const { buffer, byteOffset, byteLength } = this.bufferView;
        await buffer.loadOnce(signal);
        return new Uint8Array(buffer.getArrayBuffer(), byteOffset, byteLength);
    }

    /**
     * @param {AbortSignal} [signal]
     */
    async load(signal) {
        await (async () => {
            if(this.uri) {
                this.#arrayBuffer = await fetch(this.uri.href, { signal }).then(res => res.arrayBuffer());
            } else if(this. bufferView) {
                this.#arrayBuffer = await this.loadBufferAsUint8Array(signal);
            }
        })();

        return super.load(signal);
    }

    getArrayBuffer() {
        if(!this.#arrayBuffer) throw new Error('Invalid State');
        return this.#arrayBuffer;
    }
}

/**
 * @typedef {{
 *  autoPlay?:   boolean,
 *  gain?:       number,
 *  loop?:       boolean,
 *  audio?:      number,
 *  extensions?: Revelry.GLTF.Extensions.khrAudioSource,
 * } & import('../gltf-property.js').glTFPropertyData} khrAudioSource
 */

/**
 * Audio Source
 *
 * @see https://github.com/KhronosGroup/glTF/blob/3bed830e001187246d75186b83f5b2469d416f36/extensions/2.0/Khronos/KHR_audio/README.md#audio-sources
 */
export class KHRAudioSource extends GLTFProperty {
    /**
     * @param {{
     *  autoPlay?:    boolean,
     *  gain?:        number,
     *  loop?:        boolean,
     *  audio?:       KHRAudioData,
     *  extensions?: Revelry.GLTF.Extensions.KHRAudioSource,
     * } & import('../gltf-property.js').GLTFPropertyData} khrAudioSource
     */
    constructor(khrAudioSource) {
        super(khrAudioSource);
        const { autoPlay = false, gain = 1.0, loop = false, audio, extensions } = khrAudioSource;

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

        this.extensions = extensions;
    }

    /**
     * @param {khrAudioSource} khrAudioSource
     * @param {import('../gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(khrAudioSource, options) {
        return new this(this.unmarshall(khrAudioSource, options, {
            audio: { factory: KHRAudioData, collection: ['extensions', 'KHR_audio', 'audio'] }
        }, 'KHRAudioSource'));
    }
}

/**
 * @typedef {{
 *  type:        'positional' | 'global'
 *  gain?:       number,
 *  sources?:    number[],
 *  positional?: khrAudioPositional,
 *  extensions?: Revelry.GLTF.Extensions.khrAudioEmitter,
 * } & import('../gltf-property.js').glTFPropertyData} khrAudioEmitter
 */

/**
 * Audio Emitter
 *
 * @see https://github.com/KhronosGroup/glTF/blob/3bed830e001187246d75186b83f5b2469d416f36/extensions/2.0/Khronos/KHR_audio/README.md#audio-emitter
 */
export class KHRAudioEmitter extends GLTFProperty {
    /**
     * @param {{
     *  type:        'positional' | 'global'
     *  gain?:       number,
     *  sources?:    KHRAudioSource[],
     *  positional?: KHRAudioPositional,
     *  extensions?: Revelry.GLTF.Extensions.KHRAudioEmitter,
     * } & import('../gltf-property.js').GLTFPropertyData} khrAudioEmitter
     */
    constructor(khrAudioEmitter) {
        super(khrAudioEmitter);
        const { type, gain = 1.0, sources = [], positional, extensions } = khrAudioEmitter;

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

        this.extensions = extensions;
    }

    /**
     * @param {khrAudioEmitter} khrAudioEmitter
     * @param {import('../gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(khrAudioEmitter, options) {
        return new this(this.unmarshall(khrAudioEmitter, options, {
            sources:    { factory: KHRAudioSource, colleciton: ['extensions', 'KHR_audio', 'sources'] },
            positional: { factory: KHRAudioPositional                                                 },
        }, 'KHRAudioEmitter'));
    }
}

/**
 * @typedef {{
 *  sources:     khrAudioSource[],
 *  emitters:    khrAudioEmitter[],
 *  audio:       khrAudioData[],
 *  extensions?: Revelry.GLTF.Extensions.khrAudio,
 * } & import('../gltf-property.js').glTFPropertyData} khrAudio
 */

/**
 * This extension allows for the addition of spatialized and non-spatialized audio to glTF scenes.
 *
 * @see https://github.com/KhronosGroup/glTF/blob/3bed830e001187246d75186b83f5b2469d416f36/extensions/2.0/Khronos/KHR_audio/README.md
 */
 export class KHRAudio extends GLTFProperty {
    /**
     * @param {{
     *  sources:     KHRAudioSource[],
     *  emitters:    KHRAudioEmitter[],
     *  audio:       KHRAudioData[],
     *  extensions?: Revelry.GLTF.Extensions.KHRAudio,
     * } & import('../gltf-property.js').GLTFPropertyData} khrAudio
     */
    constructor(khrAudio) {
        super(khrAudio);
        const { sources, emitters, audio, extensions } = khrAudio;

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

        this.extensions = extensions;
    }

    /**
     * @param {khrAudio} khrAudio
     * @param {import('../gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(khrAudio, options) {
        return new this(this.unmarshall(khrAudio, options, {
            sources:  { factory: KHRAudioSource  },
            emitters: { factory: KHRAudioEmitter },
            audio:    { factory: KHRAudioData    },
        }, 'KHRAudio'));
    }

    /**
     * @param {AbortSignal} [signal]
     */
    async load(signal) {
        await Promise.all(this.audio.map(audio => {
            return audio.loadOnce(signal);
        }));
        return this;
    }
}

/**
 * @typedef {{
 *  emitter:     number,
 *  extensions?: Revelry.GLTF.Extensions.khrAudioNode,
 * } & import('../gltf-property.js').glTFPropertyData} khrAudioNode
 */

/**
 * Audio emitter node properties
 *
 * @see https://github.com/KhronosGroup/glTF/blob/3bed830e001187246d75186b83f5b2469d416f36/extensions/2.0/Khronos/KHR_audio/README.md#using-audio-emitters
 */
export class KHRAudioNode extends GLTFProperty {
    /**
     * @param {{
     *  emitter: KHRAudioEmitter,
     *  extensions?: Revelry.GLTF.Extensions.KHRAudioNode,
     * } & import('../gltf-property.js').GLTFPropertyData} khrAudioNode
     */
    constructor(khrAudioNode) {
        super(khrAudioNode);
        const { emitter, extensions } = khrAudioNode;

        /**
         * The positional audio emitter referenced by this node. Global audio emitters may not be added to nodes.
         */
        this.emitter = emitter

        this.extensions = extensions;
    }

    /**
     * @param {khrAudioNode} khrAudioNode
     * @param {import('../gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(khrAudioNode, options) {
        return new this(this.unmarshall(khrAudioNode, options, {
            emitter: { factory: KHRAudioEmitter, colleciton: ['extensions', 'KHR_audio', 'emitters'] },
        }, 'KHRAudioNode'));
    }
}

/**
 * @typedef {{
 *  emitters:    number[],
 *  extensions?: Revelry.GLTF.Extensions.khrAudioScene,
 * } & import('../gltf-property.js').glTFPropertyData} khrAudioScene
 */

/**
 * Audio emitter scene properties
 *
 * @see https://github.com/KhronosGroup/glTF/blob/3bed830e001187246d75186b83f5b2469d416f36/extensions/2.0/Khronos/KHR_audio/README.md#using-audio-emitters
 */
export class KHRAudioScene extends GLTFProperty {
    /**
     * @param {{
     *  emitters:    KHRAudioEmitter[],
     *  extensions?: Revelry.GLTF.Extensions.KHRAudioScene,
     * } & import('../gltf-property.js').GLTFPropertyData} khrAudioScene
     */
    constructor(khrAudioScene) {
        super(khrAudioScene);
        const { emitters, extensions } = khrAudioScene;

        /**
         * The positional audio emitter referenced by this node. Global audio emitters may not be added to nodes.
         */
        this.emitters = emitters;

        this.extensions = extensions;
    }

    /**
     * @param {khrAudioScene} khrAudioScene
     * @param {import('../gltf-property.js').FromJSONOptions} options
     */
    static fromJSON(khrAudioScene, options) {
        return new this(this.unmarshall(khrAudioScene, options, {
            emitters: { factory: KHRAudioEmitter, colleciton: ['extensions', 'KHR_audio', 'emitters'] },
        }, 'KHRAudioScene'));
    }
}

extensions.add('KHR_audio', {
    schema: {
        GLTF:  KHRAudio,
        Node:  KHRAudioNode,
        Scene: KHRAudioScene,
    },
});
