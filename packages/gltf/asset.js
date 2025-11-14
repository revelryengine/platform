/**
 * Metadata about the glTF asset
 *
 * [Reference Spec - Asset](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-asset)
 *
 * @module
 */

import { GLTFProperty } from './gltf-property.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, FromJSONGraph } from './gltf-property.js';
 * @import { assetExtensions, AssetExtensions } from '@revelryengine/gltf/extensions';
 */

/**
 *
 * @typedef {object} asset - Asset JSON representation.
 * @property {string} version - The glTF version that this asset targets.
 * @property {string} [copyright] - A copyright message suitable for display to credit the content creator.
 * @property {string} [generator] - Tool that generated this glTF model. Useful for debugging.
 * @property {string} [minVersion] - The minimum glTF version that this asset targets.
 * @property {assetExtensions} [extensions] - Extension-specific data.
 */

/**
 * Asset class representation.
 */
export class Asset extends GLTFProperty {
    /**
     * Creates an instance of Asset.
     * @param {{
     *  version:     string,
     *  copyright?:  string,
     *  generator?:  string,
     *  minVersion?: string,
     *  extensions?: AssetExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled asset object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { copyright, generator, version, minVersion, extensions } = unmarshalled;

        /**
         * A copyright message suitable for display to credit the content creator.
         */
        this.copyright = copyright;

        /**
         * Tool that generated this glTF model. Useful for debugging.
         */
        this.generator = generator;

        /**
         * The glTF version that this asset targets.
         */
        this.version = version;

        /**
         * The minimum glTF version that this asset targets.
         */
        this.minVersion = minVersion;

        /**
         * Extension-specific data.
         */
        this.extensions = extensions;
    }

    /**
     * Creates an instance from JSON data.
     * @param {asset & glTFPropertyData} asset - The asset JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(asset, graph) {
        return this.unmarshall(graph, asset, {
            // No reference fields
        }, this);
    }
}
