import { GLTFProperty } from '../../gltf-property.js';
import { extensions   } from '../extensions.js';

/**
 * @typedef {{
 *  '@context':  Record<string, string>,
 *  packets:     Record<string, any>[],
 *  extensions?: Revelry.GLTF.Extensions.khrXMPGLTF,
 * } & import('../../gltf-property.js').glTFPropertyData} khrXMPGLTF
 */

/**
 * This extension adds support for XMP (Extensible Metadata Platform) (ISO 16684-1) metadata to glTF.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Archived/KHR_xmp
 */
export class KHRXMPGLTF extends GLTFProperty {
    /**
     * @param {{
     *  '@context': Record<string, string>,
     *  packets:    Record<string, any>[],
     *  extensions?: Revelry.GLTF.Extensions.KHRXMPGLTF,
     * } & import('../../gltf-property.js').GLTFPropertyData} khrXMPGLTF
     */
    constructor(khrXMPGLTF) {
        super(khrXMPGLTF);

        const { '@context': context, packets, extensions } = khrXMPGLTF;

        /**
         * Dictionary mapping XMP namespace names to the URI where they are defined.
         */
        this['@context'] = context;

        /**
         * Dictionary of XMP metadata properties. Property names take the form `xmp_namespace_name:property_name`.
         */
        this.packets = packets;

        this.extensions = extensions;
    }

    /**
     * Creates a KHRXMPGLTF instance from its JSON representation.
     * @param {khrXMPGLTF} khrXMPGLTF
     * @param {import('../../gltf-property.js').FromJSONOptions} options
     * @override
     */
    static fromJSON(khrXMPGLTF, options) {
        return new this(this.unmarshall(khrXMPGLTF, options, {
        }, 'KHRXMPGLTF'));
    }
}

/**
 * @typedef {{
 *  packet:      number,
 *  extensions?: Revelry.GLTF.Extensions.khrXMPNode,
 * } & import('../../gltf-property.js').glTFPropertyData} khrXMPNode
 */

/**
 * This extension adds support for XMP (Extensible Metadata Platform) (ISO 16684-1) metadata to glTF.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Archived/KHR_xmp
 */
export class KHRXMPNode extends GLTFProperty {
    /**
     * @param {{
     *  packet:      Record<string, any>,
     *  extensions?: Revelry.GLTF.Extensions.KHRXMPNode,
     * } & import('../../gltf-property.js').GLTFPropertyData} khrXMPNode
     */
    constructor(khrXMPNode) {
        super(khrXMPNode);

        const { packet, extensions } = khrXMPNode;

        /**
         * The XMP packet referenced by this node.
         */
        this.packet = packet;

        this.extensions = extensions;
    }

    /**
     * Creates a KHRXMPNode instance from its JSON representation.
     * @param {khrXMPNode} khrXMPNode
     * @param {import('../../gltf-property.js').FromJSONOptions} options
     * @override
     */
    static fromJSON(khrXMPNode, options) {
        return new this(this.unmarshall(khrXMPNode, options, {
            packet: { collection: ['extensions', 'KHR_xmp', 'packets'] }
        }, 'KHRXMPNode'));
    }
}

extensions.add('KHR_xmp', {
    schema: {
        GLTF:      KHRXMPGLTF,
        Asset:     KHRXMPNode,
        Scene:     KHRXMPNode,
        Node:      KHRXMPNode,
        Mesh:      KHRXMPNode,
        Material:  KHRXMPNode,
        Image:     KHRXMPNode,
        Animation: KHRXMPNode,
    }
});
