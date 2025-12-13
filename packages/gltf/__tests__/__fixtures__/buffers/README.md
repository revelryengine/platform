# Testing Buffers

This directory contains buffers used for testing. Below is a description of the contents of these buffers. 
Each `.bin` file corresponds to a `.gltf` file of the same name in `__fixtures__`.

## accessor.bin

### Data Layout

| Section         | Bytes | Size   | Type   | Values                         | Description                                                                                                                                |
|-----------------|-------|--------|--------|--------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| PackedPositions | 0-35  | f32    | VEC3   | [1,2,3,4,5,6,7,8,9]            | Three tightly packed position triples referenced by both `PackedPositions` and `SparseAccessor`.                                           |
| InterleavedData | 36-67 | f32    | VEC3   | [[0,10,20,100],[30,40,50,200]] | Two VEC3 entries stored with a 16 byte stride (last float in each tuple is padding) used to flag the `InterleavedAccessor` as interleaved. |
| SparseIndexData | 68-71 | uint16 | SCALAR | [1,2]                          | Sparse accessor indices that overwrite the 2nd and 3rd PackedPositions entries.                                                            |
| SparseValueData | 72-95 | f32    | VEC3   | [10,10,10,20,20,20]            | Replacement values applied at indices [1,2] so sparse-aware tests observe overridden positions.                                            |

## animation.bin

### Data Layout

| Section                | Bytes   | Size   | Type   | Values                                                         | Description                                                                                               |
|------------------------|---------|--------|--------|----------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| AnimationTimes         | 0-7     | f32    | SCALAR | [0,1]                                                          | Two keyframe timestamps shared by every sampler.                                                          |
| AnimationTranslation   | 8-31    | f32    | VEC3   | [[0,0,0],[1,2,3]]                                              | Translation output used by `TranslationAccessor` and aliased by `MeshPositionAccessor` for morph targets. |
| RotationValues         | 32-63   | f32    | VEC4   | [[0,0,0,1],[0,1,0,0]]                                          | Quaternion rotations for `RotationAccessor`.                                                              |
| CubicTranslationValues | 64-135  | f32    | VEC3   | [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[2,4,6],[0,0,0]]              | Drives pointer-based translation sampler to validate CUBICSPLINE math.                                    |
| MorphWeights           | 136-151 | f32    | SCALAR | [0,0,1,0.5]                                                    | Morph target weights applied to `MorphNode`.                                                              |
| StepScale              | 152-175 | f32    | VEC3   | [[1,2,3],[2,4,6]]                                              | STEP-interpolated scale values for `SteppedNode`.                                                         |
| BytePointer            | 176-177 | int8   | SCALAR | [-127,127]                                                     | Signed byte values consumed by `BytePointerAccessor` via KHR_animation_pointer.                           |
| UByteColorPointer      | 180-187 | uint8  | VEC4   | [[0,0,0,255],[255,255,255,255]]                                | Base-color factors animated through normalized unsigned bytes.                                            |
| ShortPointer           | 188-191 | int16  | SCALAR | [-32767,32767]                                                 | Signed short pointer payload for extras.shortValue.                                                       |
| UShortPointer          | 192-195 | uint16 | SCALAR | [0,65535]                                                      | Unsigned short pointer payload for extras.ushortValue.                                                    |
| CubicRotationValues    | 196-291 | f32    | VEC4   | [[0,0,0,0],[0,0,0,1],[0,0,0,1],[0,0,0,-1],[0,0,1,0],[0,0,0,0]] | Validates cubic-spline quaternion normalization logic.                                                    |

## audio.bin

### Data Layout

| Section  | Bytes  | Size    | Type    | Values           | Description                                 |
|----------|--------|---------|---------|------------------|---------------------------------------------|
| tone.mp3 | 0-1080 | various | various | MP3 Encoded Data | A binary representation of `audio/tone.mp3` |

## image.bin

### Data Layout

| Section        | Bytes   | Size    | Type    | Values            | Description                                          |
|----------------|---------|---------|---------|-------------------|------------------------------------------------------|
| baseColor.png  | 0-87    | various | various | PNG Encoded Data  | A binary representation of `textures/baseColor.png`  |
| baseColor.png  | 88-375  | various | various | JPEG Encoded Data | A binary representation of `textures/baseColor.jpg`  |
| baseColor.webp | 376-444 | various | various | WebP Encoded Data | A binary representation of `textures/baseColor.webp` |

## mesh.bin

### Data Layout

| Section              | Bytes     | Size   | Type   | Values                                                                    | Description                                                               |
|----------------------|-----------|--------|--------|---------------------------------------------------------------------------|---------------------------------------------------------------------------|
| Positions            | 0-35      | f32    | VEC3   | [[0,0,0],[1,0,0],[0,1,0]]                                                 | Base triangle vertices used by every attribute accessor.                  |
| Normals              | 36-71     | f32    | VEC3   | [[0,0,1],[0,0,1],[0,0,1]]                                                 | Flat shading normals for each vertex.                                     |
| Tangents             | 72-119    | f32    | VEC4   | [[1,0,0,1],[0,1,0,1],[0,0,1,1]]                                           | Orthogonal tangents plus a handedness component.                          |
| Texcoord0            | 120-143   | f32    | VEC2   | [[0,0],[1,0],[0,1]]                                                       | Canonical UV triangle.                                                    |
| Texcoord1            | 144-167   | f32    | VEC2   | [[0.1,0.2],[0.3,0.4],[0.5,0.6]]                                           | Second UV set with unique floats per vertex.                              |
| Texcoord2            | 168-191   | f32    | VEC2   | [[0.2,0.1],[0.4,0.3],[0.6,0.5]]                                           | Third UV set that swaps the previous components.                          |
| Texcoord3            | 192-215   | f32    | VEC2   | [[0.7,0.8],[0.9,1.0],[1.1,1.2]]                                           | Fourth UV set to exercise high attribute indices.                         |
| Color0               | 216-263   | f32    | VEC4   | [[1,0,0,1],[0,1,0,1],[0,0,1,1]]                                           | Primary vertex colors (RGB primaries with alpha).                         |
| Color1               | 264-311   | f32    | VEC4   | [[0.5,0.5,0.5,1],[0.2,0.4,0.6,1],[0.3,0.6,0.9,1]]                         | Secondary color set with non-uniform values.                              |
| Weights0             | 312-359   | f32    | VEC4   | [[0.5,0.25,0.125,0.0625],[0.25,0.25,0.25,0.125],[0.5,0.25,0.125,0.0625]]  | First influence set; sums combine with WEIGHTS_1 to 1.                    |
| Weights1             | 360-407   | f32    | VEC4   | [[0.0625,0,0,0],[0.0625,0.03125,0.03125,0],[0.03125,0.015625,0.015625,0]] | Secondary influence set used to exercise JOINTS_1 lookups.                |
| Joints0              | 408-431   | uint16 | VEC4   | [[0,1,2,3],[1,2,3,4],[2,3,4,5]]                                           | Primary joint indices referencing the eight-node joint chain.             |
| Joints1              | 432-455   | uint16 | VEC4   | [[4,0,0,0],[5,6,7,0],[6,7,0,0]]                                           | Secondary joint indices ensuring each vertex has eight unique influences. |
| TargetPositions      | 456-491   | f32    | VEC3   | [[0,0,0],[0.01,0,0],[0,0.01,0]]                                           | Morph target deltas applied to positions.                                 |
| TargetNormals        | 492-527   | f32    | VEC3   | [[0,0,0.1],[0,0,0.1],[0,0,0.1]]                                           | Small normal adjustments for the target.                                  |
| TargetTangents       | 528-563   | f32    | VEC3   | [[0.01,0,0],[0,0.01,0],[0,0,0.01]]                                        | Tangent deltas proving target tangents are supported.                     |
| TargetTexcoord0      | 564-587   | f32    | VEC2   | [[0.02,0.02],[0.03,0.03],[0.04,0.04]]                                     | UV deltas for the target’s first texture set.                             |
| TargetTexcoord1      | 588-611   | f32    | VEC2   | [[0.05,0.05],[0.06,0.06],[0.07,0.07]]                                     | UV deltas for the target’s second texture set.                            |
| InverseBindMatrix[0] | 612-675   | f32    | MAT4   | [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]                                 | Identity pose for the first joint in the chain.                           |
| InverseBindMatrix[1] | 676-739   | f32    | MAT4   | [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0.1,0.2,0.3,1]]                           | Inverse Bind Matrix for Joint 1.                                          |
| InverseBindMatrix[2] | 740-803   | f32    | MAT4   | [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0.2,0.4,0.6,1]]                           | Inverse Bind Matrix for Joint 2.                                          |
| InverseBindMatrix[3] | 804-867   | f32    | MAT4   | [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0.3,0.6,0.9,1]]                           | Inverse Bind Matrix for Joint 3.                                          |
| InverseBindMatrix[4] | 868-931   | f32    | MAT4   | [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0.4,0.8,1.2,1]]                           | Inverse Bind Matrix for Joint 4.                                          |
| InverseBindMatrix[5] | 932-995   | f32    | MAT4   | [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0.5,1.0,1.5,1]]                           | Inverse Bind Matrix for Joint 5.                                          |
| InverseBindMatrix[6] | 996-1059  | f32    | MAT4   | [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0.6,1.2,1.8,1]]                           | Inverse Bind Matrix for Joint 6.                                          |
| InverseBindMatrix[7] | 1060-1123 | f32    | MAT4   | [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0.7,1.4,2.1,1]]                           | Inverse Bind Matrix for Joint 7.                                          |
| Indices              | 1124-1129 | uint16 | SCALAR | [0,1,2]                                                                   | Triangle indices referenced by the primitive.                             |
| Padding              | 1130-1131 | uint8  | -      | [0,0]                                                                     | Extra bytes to keep the buffer’s total length aligned to 4 bytes.         |

## draco-mesh.bin

### Data Layout

| Section           | Bytes     | Size   | Type   | Values                                    | Description                                                                                     |
|-------------------|-----------|--------|--------|-------------------------------------------|-------------------------------------------------------------------------------------------------|
| DracoBitstream    | 0-114     | int8   | bytes  | Encoder output                            | Raw Draco edge-breaker stream produced by the encoder; consumed by the worker for decoding.     |
| Indices           | 116-121   | uint16 | SCALAR | [0,1,2]                                   | Triangle indices mirrored so the accessor referenced by the primitive can load without Draco.   |
| Positions         | 124-159   | f32    | VEC3   | [[0,0,0],[1,0,0],[0,1,0]]                 | Position triples that match the source data fed to the encoder.                                 |
| Normals           | 160-195   | f32    | VEC3   | [[0,0,1],[0,0,1],[0,0,1]]                 | Flat normals used for validation after decoding.                                                |

