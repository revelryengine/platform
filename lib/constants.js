export const GL = /** @type {const} */({
    BYTE:           5120,
    UNSIGNED_BYTE:  5121,
    SHORT:          5122,
    UNSIGNED_SHORT: 5123,
    INT:            5124,
    UNSIGNED_INT:   5125,
    FLOAT:          5126,

    ARRAY_BUFFER:         34962,
    ELEMENT_ARRAY_BUFFER: 34963,

    NEAREST:                0x2600,
    LINEAR:                 0x2601,
    NEAREST_MIPMAP_NEAREST: 0x2700,
    LINEAR_MIPMAP_NEAREST:  0x2701,
    NEAREST_MIPMAP_LINEAR:  0x2702,
    LINEAR_MIPMAP_LINEAR:   0x2703,
    CLAMP_TO_EDGE:          0x812F,
    MIRRORED_REPEAT:        0x8370,
    REPEAT:                 0x2901,


    POINTS:         0,
    LINES:          1,
    LINE_STRIP:     3,
    TRIANGLES:      4,
    TRIANGLE_STRIP: 5,
});

export const COMPONENTS_PER_TYPE = {
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
    MAT2: 4,
    MAT3: 9,
    MAT4: 16,
};

export const BYTES_PER_COMPONENT = {
    [GL.BYTE]: 1,
    [GL.UNSIGNED_BYTE]: 1,
    [GL.SHORT]: 2,
    [GL.UNSIGNED_SHORT]: 2,
    [GL.UNSIGNED_INT]: 4,
    [GL.FLOAT]: 4,
};

export const TYPEDARRAYS = /** @type {Record<number, new (buffer: SharedArrayBuffer, offset: number, count: number) => (Int8Array|Uint8Array|Int16Array|Uint16Array|Uint32Array|Float32Array)>}*/({
    [GL.BYTE]:           Int8Array,
    [GL.UNSIGNED_BYTE]:  Uint8Array,
    [GL.SHORT]:          Int16Array,
    [GL.UNSIGNED_SHORT]: Uint16Array,
    [GL.UNSIGNED_INT]:   Uint32Array,
    [GL.FLOAT]:          Float32Array,
});
