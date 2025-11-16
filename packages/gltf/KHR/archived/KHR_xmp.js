/// <reference path="./KHR_xmp.types.d.ts" />

/**
 * This extension adds support for XMP (Extensible Metadata Platform) (ISO 16684-1) metadata to glTF.
 *
 * [Reference Spec - KHR_xmp](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Archived/KHR_xmp)
 *
 * @module
 */

import { GLTFProperty } from '../../gltf-property.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, FromJSONGraph } from '../../gltf-property.js';
 * @import { khrXMPExtensions, KHRXMPExtensions, objectKHRXMPExtensions, ObjectKHRXMPExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 * We have to leave this as a type declaration because jsdoc interfaces can't handle the `@context` property.
 * @typedef {{
 *   ['@context']: Record<string, string>,
 *   packets: Record<string, any>[],
 *   extensions?: khrXMPExtensions
 * }} khrXMP - KHR_xmp JSON representation.
 */

/**
 * KHR_xmp class representation.
 */
export class KHRXMP extends GLTFProperty {
    /**
     * Creates a new instance of KHRXMP.
     * @param {{
     *  '@context': Record<string, string>,
     *  packets:    Record<string, any>[],
     *  extensions?: KHRXMPExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_xmp object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { '@context': context, packets, extensions } = unmarshalled;

        /**
         * Dictionary mapping XMP namespace names to the URI where they are defined.
         */
        this['@context'] = context;

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
     * Creates a KHRXMP instance from its JSON representation.
     * @param {khrXMP & glTFPropertyData} khrXMP - The KHR_xmp JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(khrXMP, graph) {
        return this.unmarshall(graph, khrXMP, {
            // No reference fields
        }, this);
    }
}

/**
 * @typedef {object} objectKHRXMP - KHR_xmp node JSON representation.
 * @property {number} packet - The index of the XMP packet in the glTF's `extensions.KHR_xmp.packets` array.
 * @property {objectKHRXMPExtensions} [extensions] - Extension-specific data.
 */

/**
 * This extension adds support for XMP (Extensible Metadata Platform) (ISO 16684-1) metadata to glTF.
 *
 * [Reference Spec - KHR_xmp](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Archived/KHR_xmp)
 */
export class ObjectKHRXMP extends GLTFProperty {
    /**
     * Creates a new instance of ObjectKHRXMP.
     * @param {{
     *  packet:      Record<string, any>,
     *  extensions?: ObjectKHRXMPExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled KHR_xmp node object
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
     * Creates an ObjectKHRXMP instance from its JSON representation.
     * @param {objectKHRXMP & glTFPropertyData} objectKHRXMP - The KHR_xmp object JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(objectKHRXMP, graph) {
        return this.unmarshall(graph, objectKHRXMP, {
            packet: { collection: ['extensions', 'KHR_xmp', 'packets'] }
        }, this);
    }
}

GLTFProperty.extensions.add('KHR_xmp', {
    schema: {
        GLTF:      KHRXMP,
        Asset:     ObjectKHRXMP,
        Scene:     ObjectKHRXMP,
        Node:      ObjectKHRXMP,
        Mesh:      ObjectKHRXMP,
        Material:  ObjectKHRXMP,
        Image:     ObjectKHRXMP,
        Animation: ObjectKHRXMP,
    }
});
