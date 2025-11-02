import { GLTFProperty } from './gltf-property.js';

/**
 * @typedef {{
 *  version:     string,
 *  copyright?:  string,
 *  generator?:  string,
 *  minVersion?: string,
 *  extensions?: Revelry.GLTF.Extensions.asset,
 * } & import('./gltf-property.js').glTFPropertyData} asset
 */

/**
 * Metadata about the glTF asset
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-asset
 */
export class Asset extends GLTFProperty {
    /**
     * @param {{
     *  version:     string,
     *  copyright?:  string,
     *  generator?:  string,
     *  minVersion?: string,
     *  extensions?: Revelry.GLTF.Extensions.Asset,
     * } & import('./gltf-property.js').GLTFPropertyData} asset
     */
    constructor(asset) {
        super(asset);

        const { copyright, generator, version, minVersion, extensions } = asset;

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

        this.extensions = extensions;
    }

    /**
     * Creates an Asset instance from a JSON representation.
     * @param {asset} asset
     * @param {import('./gltf-property.js').FromJSONOptions} options
     * @override
     */
    static fromJSON(asset, options) {
        return new this(this.unmarshall(asset, options, {
        }, 'Asset'));
    }
}
