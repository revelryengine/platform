/// <reference path="./KHR_xmp_json_ld.types.d.ts" />

/**
 * This extension adds support for XMP (Extensible Metadata Platform) (ISO 16684-1) metadata to glTF.
 *
 * [Reference Spec - KHR_xmp_json_ld](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_xmp_json_ld)
 *
 * @module
 */

import { GLTFProperty } from '../../gltf-property.js';
import { registry     } from '../registry.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, FromJSONGraph } from '../../gltf-property.js';
 * @import { khrXMPJSONLDExtensions, KHRXMPJSONLDExtensions, objectKHRXMPJSONLDExtensions, ObjectKHRXMPJSONLDExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * @typedef {object} khrXMPJSONLD - KHR_xmp_json_ld JSON representation.
 * @property {Record<string, any>[]} packets - Dictionary of XMP metadata properties. Property names take the form `xmp_namespace_name:property_name`.
 * @property {khrXMPJSONLDExtensions} [extensions] - Extension-specific data.
 */

/**
 * KHR_xmp_json_ld class representation.
 */
export class KHRXMPJSONLD extends GLTFProperty {
    /**
     * Creates an instance of KHRXMPJSONLD.
     * @param {{
     *  packets:     Record<string, any>[],
     *  extensions?: KHRXMPJSONLDExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_xmp_json_ld object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { packets, extensions } = unmarshalled;

        /**
         * Dictionary of XMP metadata properties. Property names take the form `xmp_namespace_name:property_name`.
         */
        this.packets = packets;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates a KHRXMPJSONLD instance from its JSON representation.
     * @param {khrXMPJSONLD & glTFPropertyData} khrXMPJSONLD - KHR_xmp_json_ld JSON representation
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(khrXMPJSONLD, graph) {
        return this.unmarshall(graph, khrXMPJSONLD, {
            // No reference fields
        }, this);
    }
}

/**
 * @typedef {object} objectKHRXMPJSONLD - KHR_xmp_json_ld node JSON representation.
 * @property {number} packet - The XMP packet referenced by this node.
 * @property {objectKHRXMPJSONLDExtensions} [extensions] - Extension-specific data.
 */

/**
 * ObjectKHRXMPJSONLD class representation.
 */
export class ObjectKHRXMPJSONLD extends GLTFProperty {
    /**
     * Creates an instance of ObjectKHRXMPJSONLD.
     * @param {{
     *  packet:      Record<string, any>,
     *  extensions?: ObjectKHRXMPJSONLDExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_xmp_json_ld node object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { packet, extensions } = unmarshalled;

        /**
         * The XMP packet referenced by this node.
         */
        this.packet = packet;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {objectKHRXMPJSONLD & glTFPropertyData} objectKHRXMPJSONLD - KHR_xmp_json_ld object JSON representation
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(objectKHRXMPJSONLD, graph) {
        return this.unmarshall(graph, objectKHRXMPJSONLD, {
            packet: { collection: ['extensions', 'KHR_xmp_json_ld', 'packets'] },
        }, this);
    }
}

registry.add('KHR_xmp_json_ld', {
    schema: {
        GLTF:      KHRXMPJSONLD,
        Asset:     ObjectKHRXMPJSONLD,
        Scene:     ObjectKHRXMPJSONLD,
        Node:      ObjectKHRXMPJSONLD,
        Mesh:      ObjectKHRXMPJSONLD,
        Material:  ObjectKHRXMPJSONLD,
        Image:     ObjectKHRXMPJSONLD,
        Animation: ObjectKHRXMPJSONLD,
    }
});
