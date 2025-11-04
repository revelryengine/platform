# Revelry Engine Documentation

> [!IMPORTANT]
> **Documentation Under Heavy Development:** Please bare with us as we complete the documentation for the Revelry Engine packages. More packages will be added soon.

## Usage

Usage of this Revelry Engine packages requires that the imports found in `importmap.<env>.json` found in the root directory be included in your environment's import maps.

### Browser

```html
<html>
    <head>
        <script type="importmap">
            {
                "imports": {
                    "revelryengine/": "https://cdn.jsdelivr.net/gh/revelryengine/platform/packages/",

                    "gl-matrix":        "https://cdn.jsdelivr.net/npm/gl-matrix@beta/dist/esm/index.js",
                    "es-module-shims":  "https://cdn.jsdelivr.net/npm/es-module-shims@2.6.2/dist/es-module-shims.wasm.js",
                    "ktx-parse":        "https://cdn.jsdelivr.net/npm/ktx-parse@0.4.5/dist/ktx-parse.esm.js",
                    "basis_universal/": "https://cdn.jsdelivr.net/gh/BinomialLLC/basis_universal@v1_60/webgl/transcoder/build/",
                    "draco3d/":         "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
                    "box2d-wasm":       "https://cdn.jsdelivr.net/npm/box2d-wasm@7.0.0/dist/es/Box2D.js",
                    "physx-js-webidl":  "https://cdn.jsdelivr.net/npm/physx-js-webidl@2.6.2/physx-js-webidl.js",
                    "rfc6902":          "https://cdn.jsdelivr.net/npm/rfc6902@5.1.1/index.js/+esm",
                    "lit/":             "https://esm.sh/lit@3.3.1/"
                }
            }
        </script>
        <script type="module">
            import * as utils from 'revelryengine/utils/lib/utils.js'
        </script>
    </head>
    <body>
        ...
    </body>
</html>
```

### Deno

Some utilities rely on a locking mechanism to function correctly across multiple browser tabs. In a browser this is handled by [navigator.locks](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/locks). However, for Deno there is a minimal polyfill that uses Deno to write temporary lock files. To make this work correctly, deno should be run with the `read`, `write`, and `env` permissions allowed and the  `--location <some origin>` flag set.

```json
// deno.jsonc
{
    "imports": {
        "revelryengine/": "https://cdn.jsdelivr.net/gh/revelryengine/platform/packages/",

        "gl-matrix":        "https://cdn.jsdelivr.net/npm/gl-matrix@beta/dist/esm/index.js",
        "es-module-shims":  "https://cdn.jsdelivr.net/npm/es-module-shims@2.6.2/dist/es-module-shims.wasm.js",
        "ktx-parse":        "https://cdn.jsdelivr.net/npm/ktx-parse@0.4.5/dist/ktx-parse.esm.js",
        "basis_universal/": "https://cdn.jsdelivr.net/gh/BinomialLLC/basis_universal@v1_60/webgl/transcoder/build/",
        "draco3d/":         "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
        "box2d-wasm":       "https://cdn.jsdelivr.net/npm/box2d-wasm@7.0.0/dist/es/Box2D.js",
        "physx-js-webidl":  "https://cdn.jsdelivr.net/npm/physx-js-webidl@2.6.2/physx-js-webidl.js",
        "rfc6902":          "https://cdn.jsdelivr.net/npm/rfc6902@5.1.1/index.js/+esm",
        "lit/":             "https://esm.sh/lit@3.3.1/",

        "gl-matrix@ts-types":       "npm:gl-matrix@beta",
        "box2d-wasm@ts-types":      "npm:box2d-wasm@7.0.0",
        "physx-js-webidl@ts-types": "npm:physx-js-webidl@2.6.2",
        "rfc6902@ts-types":         "npm:rfc6902@5.1.1",
    },
    "compilerOptions": {
        "checkJs": true,
        "lib": ["esnext", "dom", "dom.iterable", "deno.ns"]
    },
    "permissions": {
        "revelry": {
            "read":  true,
            "write": true,
            "env":   true,
        }
    }
}
```

```js
// entry.js
import * as utils from 'revelryengine/utils/lib/utils.js'
```

```bash
# Run from terminal
deno run -P=revelry --location http://example.local
```
