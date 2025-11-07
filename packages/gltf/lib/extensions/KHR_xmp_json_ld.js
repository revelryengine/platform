import { GLTFProperty } from '../gltf-property.js';
import { extensions   } from './extensions.js';

/**
 * @see https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_xmp_json_ld
 */

/**
 * @typedef {{
 *  packets:     Record<string, any>[],
 *  extensions?: Revelry.GLTF.Extensions.khrXMPJSONLDGLTF,
 * } & import('../gltf-property.js').glTFPropertyData} khrXMPJSONLDGLTF
 */

/**
 * This extension adds support for XMP (Extensible Metadata Platform) (ISO 16684-1) metadata to glTF.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_xmp_json_ld
 */
export class KHRXMPJSONLDGLTF extends GLTFProperty {
    /**
     * @param {{
     *  packets:     Record<string, any>[],
     *  extensions?: Revelry.GLTF.Extensions.KHRXMPJSONLDGLTF,
     * } & import('../gltf-property.js').GLTFPropertyData} khrXMPJSONLDGLTF
     */
    constructor(khrXMPJSONLDGLTF) {
        super(khrXMPJSONLDGLTF);

        const { packets, extensions } = khrXMPJSONLDGLTF;

        /**
         * Dictionary of XMP metadata properties. Property names take the form `xmp_namespace_name:property_name`.
         */
        this.packets = packets;

        this.extensions = extensions;
    }

    /**
     * Creates a KHRXMPJSONLDGLTF instance from its JSON representation.
     * @param {khrXMPJSONLDGLTF} khrXMPJSONLDGLTF
     * @param {import('../gltf-property.js').FromJSONOptions} options
     * @override
     */
    static fromJSON(khrXMPJSONLDGLTF, options) {
        return new this(this.unmarshall(khrXMPJSONLDGLTF, options, {
        }, 'KHRXMPJSONLDGLTF'));
    }
}

/**
 * @typedef {{
 *  packet:      number,
 *  extensions?: Revelry.GLTF.Extensions.khrXMPJSONLDNode,
 * } & import('../gltf-property.js').glTFPropertyData} khrXMPJSONLDNode
 */

/**
 * This extension adds support for XMP (Extensible Metadata Platform) (ISO 16684-1) metadata to glTF.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_xmp_json_ld
 */
export class KHRXMPJSONLDNode extends GLTFProperty {
    /**
     * @param {{
    *  packet:      Record<string, any>,
    *  extensions?: Revelry.GLTF.Extensions.KHRXMPJSONLDNode,
     * } & import('../gltf-property.js').GLTFPropertyData} khrXMPJSONLDNode
     */
    constructor(khrXMPJSONLDNode) {
        super(khrXMPJSONLDNode);

        const { packet, extensions } = khrXMPJSONLDNode;

        /**
         * The XMP packet referenced by this node.
         */
        this.packet = packet;

        this.extensions = extensions;
    }

    /**
     * Creates a KHRXMPJSONLDNode instance from its JSON representation.
     * @param {khrXMPJSONLDNode} khrXMPJSONLDNode
     * @param {import('../gltf-property.js').FromJSONOptions} options
     * @override
     */
    static fromJSON(khrXMPJSONLDNode, options) {
        return new this(this.unmarshall(khrXMPJSONLDNode, options, {
            packet: { collection: ['extensions', 'KHR_xmp_json_ld', 'packets'] },
        }, 'KHRXMPJSONLDNode'));
    }
}

extensions.add('KHR_xmp_json_ld', {
    schema: {
        GLTF:      KHRXMPJSONLDGLTF,
        Asset:     KHRXMPJSONLDNode,
        Scene:     KHRXMPJSONLDNode,
        Node:      KHRXMPJSONLDNode,
        Mesh:      KHRXMPJSONLDNode,
        Material:  KHRXMPJSONLDNode,
        Image:     KHRXMPJSONLDNode,
        Animation: KHRXMPJSONLDNode,
    }
});
