/**
 * @module @revelryengine/settings
 */

/**
 * An import map structure. See [MDN - importmap](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap)
 */
interface ImportMap {
    /**
     * A map of module specifiers to their resolved URLs.
     */
    imports: Record<string, string>;
    /**
     * A map of scopes to their import maps.
     */
    scopes?: Record<string, Record<string, string>>;
}

declare module '@revelryengine/settings' {
    interface RevelryEngineSettings {
        /**
         * Import map configuration.
         */
        importmap?: {
            /**
             * The import map content.
             */
            content?: ImportMap;
            /**
             * A URL to load the import map from.
             */
            url?: URL;
        };
    }
}
