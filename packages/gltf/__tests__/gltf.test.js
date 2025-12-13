import { describe, it, expect, sinon } from 'bdd';
import { expectBufferToMatch } from './__helpers__/buffer-match.js';

import { GLTF       } from '../gltf.js';
import { Asset      } from '../asset.js';
import { Accessor   } from '../accessor.js';
import { Animation  } from '../animation.js';
import { Buffer     } from '../buffer.js';
import { BufferView } from '../buffer-view.js';
import { Camera     } from '../camera.js';
import { Image      } from '../image.js';
import { Material   } from '../material.js';
import { Mesh       } from '../mesh.js';
import { Node       } from '../node.js';
import { Sampler    } from '../sampler.js';
import { Scene      } from '../scene.js';
import { Skin       } from '../skin.js';
import { Texture    } from '../texture.js';

const JSON_FIXTURE_URL   = new URL('./__fixtures__/asset.gltf', import.meta.url);
const GLB_FIXTURE_URL    = new URL('./__fixtures__/asset.glb', import.meta.url);
const BINARY_FIXTURE_URL = new URL('./__fixtures__/buffers/image.bin', import.meta.url);

const ALL_COLLECTIONS = {
    asset:       { version: '2.0' },
    accessors:   [ { name: 'Accessor',  componentType: 5126, count: 3, type: 'VEC3' } ],
    animations:  [ { name: 'Animation' } ],
    buffers:     [ { name: 'Buffer', byteLength: 12 } ],
    bufferViews: [ { name: 'BufferView', buffer: 0, byteLength: 12 } ],
    cameras:     [ { name: 'Camera', type: 'perspective', perspective: {} } ],
    images:      [ { name: 'Image', uri: 'textures/baseColor.png' } ],
    materials:   [ { name: 'Material' } ],
    meshes:      [ { name: 'Mesh', primitives: [] } ],
    nodes:       [ { name: 'Node' } ],
    samplers:    [ { name: 'Sampler' } ],
    scenes:      [ { name: 'Scene' } ],
    skins:       [ { name: 'Skin', joints: [] } ],
    textures:    [ { name: 'Texture', sampler: 0, source: 0 } ],
    scene: 0,
}

describe('GLTF', () => {
    it('resolves referenceFields', async () => {
        const gltf = GLTF.fromJSON(ALL_COLLECTIONS, { uri: JSON_FIXTURE_URL });

        expect(gltf.asset).to.be.instanceOf(Asset);
        expect(gltf.accessors[0]).to.be.instanceOf(Accessor);
        expect(gltf.animations[0]).to.be.instanceOf(Animation);
        expect(gltf.buffers[0]).to.be.instanceOf(Buffer);
        expect(gltf.bufferViews[0]).to.be.instanceOf(BufferView);
        expect(gltf.cameras[0]).to.be.instanceOf(Camera);
        expect(gltf.images[0]).to.be.instanceOf(Image);
        expect(gltf.materials[0]).to.be.instanceOf(Material);
        expect(gltf.meshes[0]).to.be.instanceOf(Mesh);
        expect(gltf.nodes[0]).to.be.instanceOf(Node);
        expect(gltf.samplers[0]).to.be.instanceOf(Sampler);
        expect(gltf.scenes[0]).to.be.instanceOf(Scene);
        expect(gltf.skins[0]).to.be.instanceOf(Skin);
        expect(gltf.textures[0]).to.be.instanceOf(Texture);
    });

    it('sets default values', () => {
        const gltf = GLTF.fromJSON({
            asset: { version: '2.0' },
            scenes: [
                { name: 'PrimaryScene' }
            ]
        });

        expect(gltf.accessors).to.be.instanceOf(Array);
        expect(gltf.animations).to.be.instanceOf(Array);
        expect(gltf.buffers).to.be.instanceOf(Array);
        expect(gltf.bufferViews).to.be.instanceOf(Array);
        expect(gltf.cameras).to.be.instanceOf(Array);
        expect(gltf.images).to.be.instanceOf(Array);
        expect(gltf.materials).to.be.instanceOf(Array);
        expect(gltf.meshes).to.be.instanceOf(Array);
        expect(gltf.nodes).to.be.instanceOf(Array);
        expect(gltf.samplers).to.be.instanceOf(Array);
        expect(gltf.scenes).to.be.instanceOf(Array);
        expect(gltf.skins).to.be.instanceOf(Array);
        expect(gltf.textures).to.be.instanceOf(Array);
        expect(gltf.scene.name).to.equal('PrimaryScene');
    });

    describe('prepareJSON', () => {
        it('throws when the glTF version is unsupported', () => {
            const jsonA = { asset: { version: '1.0' } };
            const jsonB = { asset: { version: '2.1' } };

            expect(() => GLTF.prepareJSON(jsonA, {})).to.throw('Unsupported glTF version 1.0');
            expect(() => GLTF.prepareJSON(jsonB, {})).to.throw('Unsupported glTF version 2.1');
        });

        it('does not throw when minVersion is less than or equal to the supported version', () => {
            const jsonA = { asset: { version: '2.1', minVersion: '2.0' } };
            expect(() => GLTF.prepareJSON(jsonA, {})).to.not.throw();
        });

        it('throws when required extensions are not registered', () => {
            const json = {
                asset: { version: '2.0' },
                extensionsRequired: ['UNREGISTERED_extension'],
            };

            expect(() => GLTF.prepareJSON(json, {})).to.throw('Unsupported glTF extension UNREGISTERED_extension');
        });
    });

    describe('load', () => {
        it('loads gltf files', async () => {
            const gltf = await GLTF.load(JSON_FIXTURE_URL);
            const buffer = gltf.buffers[0];

            await expectBufferToMatch(new Uint8Array(buffer.getArrayBuffer()), BINARY_FIXTURE_URL);
        });

        it('loads glb files', async () => {
            const gltf = await GLTF.load(GLB_FIXTURE_URL);
            const buffer = gltf.buffers[0];

            await expectBufferToMatch(new Uint8Array(buffer.getArrayBuffer()), BINARY_FIXTURE_URL);
        });

        it('calls load on all collections', async () => {
            const gltf = GLTF.fromJSON(ALL_COLLECTIONS, { uri: JSON_FIXTURE_URL });

            const assetLoadSpy      = sinon.spy(gltf.asset, 'load');
            const accessorLoadSpy   = sinon.spy(gltf.accessors[0], 'load');
            const animationLoadSpy  = sinon.spy(gltf.animations[0], 'load');
            const bufferLoadSpy     = sinon.spy(gltf.buffers[0], 'load');
            const bufferViewLoadSpy = sinon.spy(gltf.bufferViews[0], 'load');
            const cameraLoadSpy     = sinon.spy(gltf.cameras[0], 'load');
            const imageLoadSpy      = sinon.spy(gltf.images[0], 'load');
            const materialLoadSpy   = sinon.spy(gltf.materials[0], 'load');
            const meshLoadSpy       = sinon.spy(gltf.meshes[0], 'load');
            const nodeLoadSpy       = sinon.spy(gltf.nodes[0], 'load');
            const samplerLoadSpy    = sinon.spy(gltf.samplers[0], 'load');
            const sceneLoadSpy      = sinon.spy(gltf.scenes[0], 'load');
            const skinLoadSpy       = sinon.spy(gltf.skins[0], 'load');
            const textureLoadSpy    = sinon.spy(gltf.textures[0], 'load');

            await gltf.load();

            expect(assetLoadSpy).to.have.been.calledOnce;
            expect(accessorLoadSpy).to.have.been.calledOnce;
            expect(animationLoadSpy).to.have.been.calledOnce;
            expect(bufferLoadSpy).to.have.been.calledOnce;
            expect(bufferViewLoadSpy).to.have.been.calledOnce;
            expect(cameraLoadSpy).to.have.been.calledOnce;
            expect(imageLoadSpy).to.have.been.calledOnce;
            expect(materialLoadSpy).to.have.been.calledOnce;
            expect(meshLoadSpy).to.have.been.calledOnce;
            expect(nodeLoadSpy).to.have.been.calledOnce;
            expect(samplerLoadSpy).to.have.been.calledOnce;
            expect(sceneLoadSpy).to.have.been.calledOnce;
            expect(skinLoadSpy).to.have.been.calledOnce;
            expect(textureLoadSpy).to.have.been.calledOnce;
        });
    });

    describe('loadFromBuffer', () => {
        it('parses the JSON document from the buffer and loads', async () => {
            const jsonBytes = await fetch(JSON_FIXTURE_URL).then(res => res.arrayBuffer());
            const gltf      = await GLTF.loadFromBuffer(jsonBytes, JSON_FIXTURE_URL);
            const buffer    = gltf.buffers[0];

            await expectBufferToMatch(new Uint8Array(buffer.getArrayBuffer()), BINARY_FIXTURE_URL);
        });
    });
});
