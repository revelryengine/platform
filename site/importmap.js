const global = /** @type {{ REVELRY_IMPORT_MODE?: 'remote' | 'local' }} */ (globalThis);

global.REVELRY_IMPORT_MODE ??= 'remote';

const packagesBasePath = global.REVELRY_IMPORT_MODE === 'local' ? new URL('/packages/', location.href).toString() : 'https://cdn.jsdelivr.net/gh/revelryengine/platform/packages/';
const depsBasePath     = global.REVELRY_IMPORT_MODE === 'local' ? new URL('/deps/', location.href).toString()     : 'https://cdn.jsdelivr.net/gh/revelryengine/platform/deps/';
const samplesBasePath  = global.REVELRY_IMPORT_MODE === 'local' ? new URL('/samples/', location.href).toString()  : 'https://cdn.jsdelivr.net/gh/revelryengine/';

const element = document.createElement('script');
element.type = 'importmap';
element.textContent = JSON.stringify({
    imports: {
        'revelryengine/': packagesBasePath,
        'revelryengine/deps/': depsBasePath,
        'revelryengine/samples/': samplesBasePath,

        "gl-matrix":        "https://cdn.jsdelivr.net/npm/gl-matrix@beta/dist/esm/index.js",
        "es-module-shims":  "https://cdn.jsdelivr.net/npm/es-module-shims@2.6.2/dist/es-module-shims.wasm.js",
        "ktx-parse":        "https://cdn.jsdelivr.net/npm/ktx-parse@0.4.5/dist/ktx-parse.esm.js",
        "basis_universal/": "https://cdn.jsdelivr.net/gh/BinomialLLC/basis_universal@v1_60/webgl/transcoder/build/",
        "draco3d/":         "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
        "box2d-wasm":       "https://cdn.jsdelivr.net/npm/box2d-wasm@7.0.0/dist/es/Box2D.js",
        "physx-js-webidl":  "https://cdn.jsdelivr.net/npm/physx-js-webidl@2.6.2/physx-js-webidl.js",
        "rfc6902":          "https://cdn.jsdelivr.net/npm/rfc6902@5.1.1/index.js/+esm",
        "lit/":             "https://esm.sh/lit@3.3.1/",

        "webgl-memory":  "https://cdn.jsdelivr.net/gh/greggman/webgl-memory@v1.1.2/webgl-memory.js",
        "webgpu-memory": "https://greggman.github.io/webgpu-memory/dist/1.x/webgpu-memory.module.js",
        "stats.js":      "https://cdn.jsdelivr.net/gh/mrdoob/stats.js/build/stats.module.js"
    }
});

document.currentScript?.after(element);
