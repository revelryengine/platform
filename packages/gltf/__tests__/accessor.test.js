import { describe, it, expect, beforeEach } from 'bdd';
import { findItem } from './__helpers__/find-item.js';

import { GLTF           } from '../gltf.js';
import { Accessor       } from '../accessor.js';
import { AccessorSparse } from '../accessor-sparse.js';
import { BufferView     } from '../buffer-view.js';
import { GL             } from '../constants.js';

const FIXTURE_URL = new URL('./__fixtures__/accessor.gltf', import.meta.url);

describe('Accessor', () => {
    /** @type {GLTF} */
    let gltf;

    beforeEach(async () => {
        gltf = await GLTF.load(FIXTURE_URL);
    });

    it('resolves referenceFields', async () => {
        const accessor = findItem(gltf.accessors, 'SparseAccessor');

        expect(accessor.bufferView).to.be.instanceOf(BufferView);
        expect(accessor.sparse).to.be.instanceOf(AccessorSparse);
    });

    it('sets default values', () => {
        const accessor = findItem(gltf.accessors, 'PackedPositions');

        expect(accessor.byteOffset).to.equal(0);
    });

    describe('getArrayBuffer', () => {
        it('throws when buffers have not been loaded yet', () => {
            const accessor = new Accessor({
                name: 'ManualAccessor',
                type: 'SCALAR',
                componentType: GL.FLOAT,
                count: 1,
            });

            expect(() => accessor.getArrayBuffer()).to.throw('Invalid State');
        });
    });

    describe('getTypedArray', () => {
        it('throws when buffers have not been loaded yet', () => {
            const accessor = new Accessor({
                name: 'ManualAccessor',
                type: 'SCALAR',
                componentType: GL.FLOAT,
                count: 1,
            });

            expect(() => accessor.getTypedArray()).to.throw('Invalid State');
        });
    });

    describe('getNumberOfBytes', () => {
        it('calculates the correct byte size for various accessor types', () => {
            const byte   = new Accessor({ type: 'SCALAR', componentType: GL.BYTE,           count: 1 });
            const ubyte  = new Accessor({ type: 'SCALAR', componentType: GL.UNSIGNED_BYTE,  count: 1 });
            const short  = new Accessor({ type: 'SCALAR', componentType: GL.SHORT,          count: 1 });
            const ushort = new Accessor({ type: 'SCALAR', componentType: GL.UNSIGNED_SHORT, count: 1 });
            const uint   = new Accessor({ type: 'SCALAR', componentType: GL.UNSIGNED_INT,   count: 1 });
            const float  = new Accessor({ type: 'SCALAR', componentType: GL.FLOAT,          count: 4 });

            expect(byte.getNumberOfBytes()).to.equal(1);
            expect(ubyte.getNumberOfBytes()).to.equal(1);
            expect(short.getNumberOfBytes()).to.equal(2);
            expect(ushort.getNumberOfBytes()).to.equal(2);
            expect(uint.getNumberOfBytes()).to.equal(4);
            expect(float.getNumberOfBytes()).to.equal(4);
        });
    });

    describe('getNumberOfComponents', () => {
        it('calculates the correct number of components for various accessor types', () => {
            const scalar   = new Accessor({ type: 'SCALAR', componentType: GL.FLOAT, count: 1 });
            const vec2     = new Accessor({ type: 'VEC2',   componentType: GL.FLOAT, count: 1 });
            const vec3     = new Accessor({ type: 'VEC3',   componentType: GL.FLOAT, count: 1 });
            const vec4     = new Accessor({ type: 'VEC4',   componentType: GL.FLOAT, count: 1 });
            const mat2     = new Accessor({ type: 'MAT2',   componentType: GL.FLOAT, count: 1 });
            const mat3     = new Accessor({ type: 'MAT3',   componentType: GL.FLOAT, count: 1 });
            const mat4     = new Accessor({ type: 'MAT4',   componentType: GL.FLOAT, count: 1 });

            expect(scalar.getNumberOfComponents()).to.equal(1);
            expect(vec2.getNumberOfComponents()).to.equal(2);
            expect(vec3.getNumberOfComponents()).to.equal(3);
            expect(vec4.getNumberOfComponents()).to.equal(4);
            expect(mat2.getNumberOfComponents()).to.equal(4);
            expect(mat3.getNumberOfComponents()).to.equal(9);
            expect(mat4.getNumberOfComponents()).to.equal(16);
        });
    });

    describe('getElementSize', () => {
        it('calculates the correct element size for various accessor types', () => {
            const scalar   = new Accessor({ type: 'SCALAR', componentType: GL.BYTE,           count: 1 });
            const vec2     = new Accessor({ type: 'VEC2',   componentType: GL.UNSIGNED_BYTE,  count: 1 });
            const vec3     = new Accessor({ type: 'VEC3',   componentType: GL.SHORT,          count: 1 });
            const vec4     = new Accessor({ type: 'VEC4',   componentType: GL.UNSIGNED_SHORT, count: 1 });
            const mat2     = new Accessor({ type: 'MAT2',   componentType: GL.UNSIGNED_INT,   count: 1 });
            const mat3     = new Accessor({ type: 'MAT3',   componentType: GL.FLOAT,          count: 1 });
            const mat4     = new Accessor({ type: 'MAT4',   componentType: GL.FLOAT,          count: 1 });


            expect(scalar.getElementSize()).to.equal(1 * 1);
            expect(vec2.getElementSize()).to.equal(2 * 1);
            expect(vec3.getElementSize()).to.equal(3 * 2);
            expect(vec4.getElementSize()).to.equal(4 * 2);
            expect(mat2.getElementSize()).to.equal(4 * 4);
            expect(mat3.getElementSize()).to.equal(9 * 4);
            expect(mat4.getElementSize()).to.equal(16 * 4);
        });
    });

    describe('createTypedView', () => {
        it('creates typed views over slices of the accessor data', () => {
            const accessor = findItem(gltf.accessors, 'PackedPositions');

            const slice = accessor.createTypedView(0, 2);
            expect(Array.from(slice)).to.deep.equal([1, 2, 3, 10, 10, 10]);
        });

        it('throws when buffers have not been loaded yet', () => {
            const accessor = new Accessor({
                name: 'ManualAccessor',
                type: 'SCALAR',
                componentType: GL.FLOAT,
                count: 1,
            });

            expect(() => accessor.createTypedView()).to.throw('Invalid State');
        });
    });

    describe('load', () => {
        it('loads buffer-backed data and applies sparse overrides', () => {
            const accessor = findItem(gltf.accessors, 'SparseAccessor');

            expect(Array.from(accessor.getTypedArray())).to.deep.equal([
                1, 2, 3,
                10, 10, 10,
                20, 20, 20,
            ]);
            expect(accessor.getArrayBuffer()).to.be.instanceOf(ArrayBuffer);
        });

        it('initializes zero-filled typed arrays when bufferView is omitted', async () => {
            const accessor = findItem(gltf.accessors, 'ZeroAccessor');

            await accessor.load();

            expect(Array.from(accessor.getTypedArray())).to.deep.equal([0, 0, 0, 0]);
        });
    });

    describe('interleaved', () => {
        it('returns true for accessors with a byte stride that does not match the element size', () => {
            const accessor = findItem(gltf.accessors, 'InterleavedAccessor');

            expect(accessor.interleaved).to.be.true;
        });

        it('returns false for accessors with no buffer view', () => {
            const accessor = findItem(gltf.accessors, 'ZeroAccessor');

            expect(accessor.interleaved).to.be.false;
        });

        it('returns false for accessors with no byte stride defined', () => {
            const accessor = findItem(gltf.accessors, 'PackedPositions');

            expect(accessor.interleaved).to.be.false;
        });
    });
});
