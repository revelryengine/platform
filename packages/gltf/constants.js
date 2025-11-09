/**
 * GLTF Libary Constants
 *
 * @module
 */

/**
 * GLTF supported version 2.0
 */
export const GLTF_SUPPORTED_VERSION = /** @type {const} */({
    /** glTF Spec major version */
    major: 2,
    /** glTF Spec minor version */
    minor: 0,
});

/**
 * glTF binary format magic number 'glTF' in ASCII. Used to decode binary glb files.
 */
export const GLTF_MAGIC_NUMBER_BINARY_FORMAT = 0x46546C67;

/**
 * WebGL constants used in glTF.
 */
export const GL = /** @type {const} */({
    /** WebGL2RenderingContext.BYTE */
    BYTE:           5120,
    /** WebGL2RenderingContext.UNSIGNED_BYTE */
    UNSIGNED_BYTE:  5121,
    /** WebGL2RenderingContext.SHORT */
    SHORT:          5122,
    /** WebGL2RenderingContext.UNSIGNED_SHORT */
    UNSIGNED_SHORT: 5123,
    /** WebGL2RenderingContext.INT */
    INT:            5124,
    /** WebGL2RenderingContext.UNSIGNED_INT */
    UNSIGNED_INT:   5125,
    /** WebGL2RenderingContext.FLOAT */
    FLOAT:          5126,

    /** WebGL2RenderingContext.ARRAY_BUFFER */
    ARRAY_BUFFER:         34962,
    /** WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER */
    ELEMENT_ARRAY_BUFFER: 34963,

    /** WebGL2RenderingContext.NEAREST */
    NEAREST:                0x2600,
    /** WebGL2RenderingContext.LINEAR */
    LINEAR:                 0x2601,
    /** WebGL2RenderingContext.NEAREST_MIPMAP_NEAREST */
    NEAREST_MIPMAP_NEAREST: 0x2700,
    /** WebGL2RenderingContext.LINEAR_MIPMAP_NEAREST */
    LINEAR_MIPMAP_NEAREST:  0x2701,
    /** WebGL2RenderingContext.NEAREST_MIPMAP_LINEAR */
    NEAREST_MIPMAP_LINEAR:  0x2702,
    /** WebGL2RenderingContext.LINEAR_MIPMAP_LINEAR */
    LINEAR_MIPMAP_LINEAR:   0x2703,
    /** WebGL2RenderingContext.CLAMP_TO_EDGE */
    CLAMP_TO_EDGE:          0x812F,
    /** WebGL2RenderingContext.MIRRORED_REPEAT */
    MIRRORED_REPEAT:        0x8370,
    /** WebGL2RenderingContext.REPEAT */
    REPEAT:                 0x2901,

    /** WebGL2RenderingContext.POINTS */
    POINTS:         0,
    /** WebGL2RenderingContext.LINES */
    LINES:          1,
    /** WebGL2RenderingContext.LINE_STRIP */
    LINE_STRIP:     3,
    /** WebGL2RenderingContext.TRIANGLES */
    TRIANGLES:      4,
    /** WebGL2RenderingContext.TRIANGLE_STRIP */
    TRIANGLE_STRIP: 5,
});

/**
 * Number of components per glTF type.
 */
export const COMPONENTS_PER_TYPE = {
    /** Number of components in SCALAR type */
    SCALAR: 1,
    /** Number of components in VEC3 type */
    VEC2: 2,
    /** Number of components in VEC3 type */
    VEC3: 3,
    /** Number of components in VEC4 type */
    VEC4: 4,
    /** Number of components in MAT2 type */
    MAT2: 4,
    /** Number of components in MAT3 type */
    MAT3: 9,
    /** Number of components in MAT4 type */
    MAT4: 16,
};

/**
 * Bytes per component for glTF component types.
 */
export const BYTES_PER_COMPONENT = {
    /** Number of bytes in BYTE type */
    [GL.BYTE]: 1,
    /** Number of bytes in UNSIGNED_BYTE type */
    [GL.UNSIGNED_BYTE]: 1,
    /** Number of bytes in SHORT type */
    [GL.SHORT]: 2,
    /** Number of bytes in UNSIGNED_SHORT type */
    [GL.UNSIGNED_SHORT]: 2,
    /** Number of bytes in UNSIGNED_INT type */
    [GL.UNSIGNED_INT]: 4,
    /** Number of bytes in FLOAT type */
    [GL.FLOAT]: 4,
};

/**
 * Typed array constructors for glTF component types.
 */
export const TYPEDARRAYS = /** @type {const} */({
    /** TypedArray type for BYTE type */
    [GL.BYTE]:           Int8Array,
    /** TypedArray type for UNSIGNED_BYTE type */
    [GL.UNSIGNED_BYTE]:  Uint8Array,
    /** TypedArray type for SHORT type */
    [GL.SHORT]:          Int16Array,
    /** TypedArray type for UNSIGNED_SHORT type */
    [GL.UNSIGNED_SHORT]: Uint16Array,
    /** TypedArray type for UNSIGNED_INT type */
    [GL.UNSIGNED_INT]:   Uint32Array,
    /** TypedArray type for FLOAT type */
    [GL.FLOAT]:          Float32Array,
});
