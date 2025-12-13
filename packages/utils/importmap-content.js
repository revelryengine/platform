/// <reference path="revelryengine/settings.d.ts" />
/// <reference path="./importmap-content.types.d.ts" />

/**
 * Import map content utility.
 * @module
 */

/**
 * Get the import map content from globalThis.importmapContent or a script tag in the document
 *
 * If globalThis.importmapContent is defined, it is used directly and is expected to already have resolved URLs.
 * Otherwise, it looks for a `<script type="importmap">` in the document and resolves the URLs relative to location.href.
 * If neither are found, it returns an empty import map
 *
 * @example
 * ```js
 * // Example import map in HTML
 * <script type="importmap">
 * {
 *   "imports": {
 *    "module-a": "./path/to/module-a.js"
 *   }
 * }
 * </script>
 * <script type="module">
 * import { importmapContent } from './lib/importmap-content.js';
 * const importMap = await importmapContent();
 * console.log(importMap.imports['module-a']); // Resolved URL of module-a
 * ```
 *
 * @example
 * ```js
 * // Example usage in JavaScript
 * const importMap = await importmapContent();
 * console.log(importMap.imports['module-a']); // Resolved URL of module-a
 */
export async function importmapContent() {
    let content = globalThis.REV?.importmap?.content;
    if (content) {
        return structuredClone(content);
    }

    const url = globalThis.REV?.importmap?.url;
    if (url) {
        content = /** @type {ImportMap} */(await fetch(url).then(res => res.json()));
    } else {
        content = /** @type {ImportMap} */(JSON.parse(globalThis.document?.querySelector('script[type="importmap"]')?.textContent ?? '{ "imports": {} }'));
    }


    for (const key of Object.keys(content.imports)) {
       content.imports[key] = new URL(content.imports[key], url ?? location.href).href;
    }

    if (content.scopes) {
        for (const [scope, imports] of Object.entries(content.scopes)) {

            const scopeKey = new URL(scope, url ?? location.href).href;
            for (const [key, value] of Object.entries(imports)) {
                imports[key] = new URL(value, url ?? location.href).href;
            }

            content.scopes[scopeKey] = imports;
            delete content.scopes[scope];
        }
    }

    return content;
}
