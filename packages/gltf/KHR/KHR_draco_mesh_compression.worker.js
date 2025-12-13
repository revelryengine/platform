// deno-coverage-ignore-file - Coverage does not work well with workers in Deno, will be covered in browser tests
/**
 * Worker module for decoding Draco compressed meshes.
 * @module
 */

import { Draco3dFactory } from "revelryengine/deps/draco3d.js";

const draco = await Draco3dFactory();

/**
 * @import { TypedArray, TypedArrayConstructor } from 'revelryengine/utils/buffers.js';
 */

/**
 * @typedef {(
 *  'DracoFloat32Array' |
 *  'DracoInt8Array'    |
 *  'DracoInt16Array'   |
 *  'DracoInt32Array'   |
 *  'DracoUInt8Array'   |
 *  'DracoUInt16Array'  |
 *  'DracoUInt32Array'
 * )} DracoType - A TypedArray type in the Draco library.
 *
 * @typedef {(
 *  'GetAttributeFloatForAllPoints' |
 *  'GetAttributeInt8ForAllPoints'  |
 *  'GetAttributeInt16ForAllPoints' |
 *  'GetAttributeInt32ForAllPoints' |
 *  'GetAttributeUInt8ForAllPoints' |
 *  'GetAttributeUInt16ForAllPoints'|
 *  'GetAttributeUInt32ForAllPoints'
 * )} DracoMethod - The method name for getting attribute data from Draco.
 *
 * @typedef {object} DecodeResponse - The response from the decode worker.
 * @property {object} result - The result of the decode operation.
 * @property {object} result.attributes - The decoded attributes.
 * @property {TypedArray} result.indices - The decoded indices.
 */

/**
 * @import { Mesh, PointCloud, Status } from 'npm:@types/draco3d';
 */

const DracoArrayGetters = /** @type {Map<TypedArrayConstructor, { dracoType: DracoType, method: DracoMethod }>} */(new Map());
DracoArrayGetters.set(Float32Array, { dracoType: 'DracoFloat32Array', method: 'GetAttributeFloatForAllPoints'  });
DracoArrayGetters.set(Int8Array,    { dracoType: 'DracoInt8Array',    method: 'GetAttributeInt8ForAllPoints'   });
DracoArrayGetters.set(Int16Array,   { dracoType: 'DracoInt16Array',   method: 'GetAttributeInt16ForAllPoints'  });
DracoArrayGetters.set(Int32Array,   { dracoType: 'DracoInt32Array',   method: 'GetAttributeInt32ForAllPoints'  });
DracoArrayGetters.set(Uint8Array,   { dracoType: 'DracoUInt8Array',   method: 'GetAttributeUInt8ForAllPoints'  });
DracoArrayGetters.set(Uint16Array,  { dracoType: 'DracoUInt16Array',  method: 'GetAttributeUInt16ForAllPoints' });
DracoArrayGetters.set(Uint32Array,  { dracoType: 'DracoUInt32Array',  method: 'GetAttributeUInt32ForAllPoints' });

/**
 * Decodes the compressed mesh data.
 * @param {object} options - The decode options.
 * @param {ArrayBuffer} options.arrayBuffer - The array buffer containing the compressed mesh data.
 * @param {number} options.byteOffset - The byte offset where the compressed data starts.
 * @param {number} options.byteLength - The length of the compressed data in bytes.
 * @param {{ [name: string]: { typedArray: TypedArray, id: number } }} options.attributes - The attributes to decode with their corresponding unique IDs.
 * @param {Uint32Array} options.indices - The array to store the decoded indices.
 */
export async function decode({ arrayBuffer, byteOffset, byteLength, attributes, indices }) {
    const decoder = new draco.Decoder();
    const decoderBuffer = new draco.DecoderBuffer();

    decoderBuffer.Init(new Int8Array(arrayBuffer, byteOffset, byteLength), byteLength);

    const geometryType = decoder.GetEncodedGeometryType(decoderBuffer);

    /**
     * @type {({ type: 'mesh', geometry: Mesh } | { type: 'point', geometry: PointCloud }) & { status: Status }}
     */
    let state;

    if (geometryType === draco.TRIANGULAR_MESH) {
        const geometry = new draco.Mesh();
        const status   = decoder.DecodeBufferToMesh(decoderBuffer, geometry);
        state = { type: 'mesh', geometry, status }

    /* c8 ignore start - Point clouds are not currently supported in glTF */
    } else if (geometryType === draco.POINT_CLOUD) {

        const geometry = new draco.PointCloud();
        const status   = decoder.DecodeBufferToPointCloud(decoderBuffer, geometry);
        state = { type: 'point', geometry, status }
    } else {
        // This is not likely to be reachable and this throw is mainly to satisfy the type system
        throw new Error('Decoding failed: Unknown geometry type');
    }
    /* c8 ignore stop */

    const numPoints = state.geometry.num_points();

    for (const [, { typedArray, id }] of Object.entries(attributes)) {

        const { dracoType, method } = /** @type {{ dracoType: DracoType, method: DracoMethod }} */(DracoArrayGetters.get(/** @type {TypedArrayConstructor} */(typedArray.constructor)));

        const attribute = decoder.GetAttributeByUniqueId(state.geometry, id);
        const numComponents = attribute.num_components();
        const numValues = numPoints * numComponents;

        const dracoArray = new draco[dracoType]();

        decoder[method](state.geometry, attribute, dracoArray);

        for (let i = 0; i < numValues; i++) {
            typedArray[i] = dracoArray.GetValue(i);
        }

        draco.destroy(dracoArray);
    }

    if (state.type === 'mesh') {
        const numFaces = state.geometry.num_faces();
        const typedArray = indices;
        const dracoArray = new draco.DracoInt32Array();

        for (let i = 0; i < numFaces; i++) {
            decoder.GetFaceFromMesh(state.geometry, i, dracoArray);

            for (let j = 0; j < 3; j++) {
                typedArray[i * 3 + j] = dracoArray.GetValue(j);
            }
        }

        draco.destroy(dracoArray);
    }

    draco.destroy(state.geometry);

    const transformedAttributes = Object.fromEntries(Object.entries(attributes).map(([name, { typedArray }]) => [name, typedArray]));

    return /** @type { DecodeResponse } */({
        result: {
            indices,
            attributes: transformedAttributes,
        },
    });
}
