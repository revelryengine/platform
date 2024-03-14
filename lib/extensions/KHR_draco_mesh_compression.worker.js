import { Draco3dFactory } from '../../deps/draco3d.js';

const draco = await Draco3dFactory();

/**
 * @typedef {Float32Array|Int8Array|Int16Array|Int32Array|Uint8Array|Uint16Array|Uint32Array} TypedArray
 * @typedef {typeof Float32Array|typeof Int8Array|typeof Int16Array|typeof Int32Array|typeof Uint8Array|typeof Uint16Array|typeof Uint32Array} TypedArrayConstructor
 * @typedef {'DracoFloat32Array'|'DracoInt8Array'|'DracoInt16Array'|'DracoInt32Array'|'DracoUInt8Array'|'DracoUInt16Array'|'DracoUInt32Array'} DracoType
 * @typedef {(
*  'GetAttributeFloatForAllPoints' |
*  'GetAttributeInt8ForAllPoints'  |
*  'GetAttributeInt16ForAllPoints' |
*  'GetAttributeInt32ForAllPoints' |
*  'GetAttributeUInt8ForAllPoints' |
*  'GetAttributeUInt16ForAllPoints'|
*  'GetAttributeUInt32ForAllPoints'
* )} DracoMethod
*
* @typedef {import('../../deps/draco3d.js').DracoDecoderModule} DracoDecoderModule
* @typedef {import('../../deps/draco3d.js').DecoderModule} DecoderModule
* @typedef {import('../../deps/draco3d.js').Mesh} DracoMesh
* @typedef {import('../../deps/draco3d.js').PointCloud} DracoPointCloud
* @typedef {import('../../deps/draco3d.js').Status} DracoStatus
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
 * @param {{
 *  arrayBuffer: ArrayBuffer,
 *  byteOffset: number,
 *  byteLength: number,
 *  attributes: { [name: string]: { typedArray: TypedArray, id: number } },
 *  indices: Uint32Array }} options
 */
export async function decode({ arrayBuffer, byteOffset, byteLength, attributes, indices }) {
    const decoder = new draco.Decoder();
    const decoderBuffer = new draco.DecoderBuffer();

    decoderBuffer.Init(new Int8Array(arrayBuffer, byteOffset, byteLength), byteLength);

    const geometryType = decoder.GetEncodedGeometryType(decoderBuffer);

    /**
     * @type {({ type: 'mesh', geometry: DracoMesh } | { type: 'point', geometry: DracoPointCloud }) & { status: DracoStatus }}
     */
    let state;

    if (geometryType === draco.TRIANGULAR_MESH) {
        const geometry = new draco.Mesh();
        const status   = decoder.DecodeBufferToMesh(decoderBuffer, geometry);
        state = { type: 'mesh', geometry, status }
    } else if (geometryType === draco.POINT_CLOUD) {
        const geometry = new draco.PointCloud();
        const status   = decoder.DecodeBufferToPointCloud(decoderBuffer, geometry);
        state = { type: 'point', geometry, status }
    } else {
        throw new Error(`Unexpected geometry type. ${geometryType}`);
    }
    if (!state.status.ok() || state.geometry.ptr === 0) {
        throw new Error('Decoding failed: ' + state.status.error_msg());
    }
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

    return {
        result: { attributes: transformedAttributes, indices },
        transfer: arrayBuffer instanceof SharedArrayBuffer ? null : [arrayBuffer],
    };
}
