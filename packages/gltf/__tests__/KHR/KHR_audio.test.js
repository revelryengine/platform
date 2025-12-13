import { describe, it, expect, beforeEach } from 'bdd';
import { findItem } from '../__helpers__/find-item.js';
import { expectBufferToMatch } from '../__helpers__/buffer-match.js';

import { GLTF       } from '../../gltf.js';
import { BufferView } from '../../buffer-view.js';

import {
    KHRAudio,
    KHRAudioAudio,
    KHRAudioEmitter,
    KHRAudioEmitterPositional,
    KHRAudioSource,
    NodeKHRAudio,
    SceneKHRAudio,
} from '../../KHR/KHR_audio.js';

const FIXTURE_URL        = new URL('../__fixtures__/audio.gltf', import.meta.url);
const BINARY_FIXTURE_URL = new URL('../__fixtures__/buffers/audio.bin', import.meta.url);

describe('KHR_audio', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    describe('KHRAudioEmitterPositional', () => {
        it('sets the default values', () => {
            const positional = new KHRAudioEmitterPositional({});

            expect(positional.coneInnerAngle).to.equal(2 * Math.PI);
            expect(positional.coneOuterAngle).to.equal(2 * Math.PI);
            expect(positional.coneOuterGain).to.equal(0.0);
            expect(positional.distanceModel).to.equal('inverse');
            expect(positional.maxDistance).to.equal(10000);
            expect(positional.refDistance).to.equal(1);
            expect(positional.rolloffFactor).to.equal(1);

        });
    });

    describe('KHRAudioAudio', () => {
        it('resolves referenceFields', () => {
            const audioWithBufferView = gltf.extensions?.KHR_audio?.audio[0];

            expect(audioWithBufferView?.bufferView).be.instanceOf(BufferView);

            const audioWithURI = gltf.extensions?.KHR_audio?.audio[1];

            expect(audioWithURI?.uri).to.be.instanceOf(URL);
        });

        describe('getAudioData', () => {
            it('throws when buffers have not been loaded yet', () => {
                const audio = new KHRAudioAudio({});

                expect(() => audio.getAudioData()).to.throw('Invalid State');
            });
        });

        describe('load', () => {
            it('loads bufferView backed audio data', async () => {
                const audio = findItem(gltf.extensions?.KHR_audio?.audio, 'BufferAudio');

                await (expectBufferToMatch(audio.getAudioData(), BINARY_FIXTURE_URL));
            });

            it('loads uri backed audio data', async () => {
                const audio = findItem(gltf.extensions?.KHR_audio?.audio, 'UriAudio');

                await (expectBufferToMatch(audio.getAudioData(), BINARY_FIXTURE_URL));
            });

            it('loads embedded data URIs', async () => {
                const audio = findItem(gltf.extensions?.KHR_audio?.audio, 'EmbeddedAudio');

                await (expectBufferToMatch(audio.getAudioData(), BINARY_FIXTURE_URL));
            });
        });

        describe('loadBufferAsUint8Array', () => {
            it('rejects when buffers have not been loaded yet', async () => {
                const audio = new KHRAudioAudio({});

                await expect(audio.loadBufferAsUint8Array()).to.be.rejectedWith('Invalid State');
            });
        });
    });

    describe('KHRAudioSource', () => {
        it('resolves referenceFields', () => {
            const source = gltf.extensions?.KHR_audio?.sources[0];

            expect(source?.audio).to.be.instanceOf(KHRAudioAudio);
        });

        it('sets the default values', () => {
            const source = new KHRAudioSource({ audio: new KHRAudioAudio({}) });

            expect(source.autoPlay).to.be.false;
            expect(source.gain).to.equal(1.0);
            expect(source.loop).to.be.false;
        });
    });

    describe('KHRAudioEmitter', () => {
        it('resolves referenceFields', () => {
            const emitter = gltf.extensions?.KHR_audio?.emitters[0];

            expect(emitter?.sources[0]).to.be.instanceOf(KHRAudioSource);
            expect(emitter?.positional).to.be.instanceOf(KHRAudioEmitterPositional);
        });

        it('sets the default values', () => {
            const emitter = new KHRAudioEmitter({
                type: 'global'
            });

            expect(emitter.gain).to.equal(1.0);
            expect(emitter.sources).to.be.instanceOf(Array);
        });
    });

    describe('KHRAudio', () => {
        it('resolves on GLTF extensions', () => {
            const extension = gltf.extensions?.KHR_audio;

            expect(extension).to.be.instanceOf(KHRAudio);
        });

        it('resolves referenceFields', () => {
            const extension = gltf.extensions?.KHR_audio;

            expect(extension?.sources[0]).to.be.instanceOf(KHRAudioSource);
            expect(extension?.audio[0]).to.be.instanceOf(KHRAudioAudio);
            expect(extension?.emitters[0]).to.be.instanceOf(KHRAudioEmitter);
        });

        describe('load', () => {
            it('loads all audio sources', async () => {
                const extension = gltf.extensions?.KHR_audio;

                expect(extension?.audio[0].getAudioData()).to.be.instanceOf(Uint8Array);
                expect(extension?.audio[1].getAudioData()).to.be.instanceOf(Uint8Array);
            });
        });
    });

    describe('NodeKHRAudio', () => {
        it('resolves on Node extensions', () => {
            const node = gltf.nodes.find(entry => entry.name === 'PositionalNode');
            const extension = node?.extensions?.KHR_audio;

            expect(extension).to.be.instanceOf(NodeKHRAudio);
        });

        it('resolves referenceFields', () => {
            const node = gltf.nodes.find(entry => entry.name === 'PositionalNode');
            const extension = node?.extensions?.KHR_audio;

            expect(extension?.emitter).to.be.instanceOf(KHRAudioEmitter);
        });
    });

    describe('SceneKHRAudio', () => {
        it('resolves on Scene extensions', () => {
            const scene = gltf.scenes[0];
            const extension = scene?.extensions?.KHR_audio;

            expect(extension).to.be.instanceOf(SceneKHRAudio);
        });

        it('resolves referenceFields', () => {
            const scene = gltf.scenes[0];
            const extension = scene?.extensions?.KHR_audio;

            expect(extension?.emitters[0]).to.be.instanceOf(KHRAudioEmitter);
        });
    });
});


