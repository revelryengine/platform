const global = /** @type {any} */ (globalThis);
global.REVELRY_DEV_MODE ??= new URL(self.location.href).searchParams?.get('REVELRY_DEV_MODE') === 'false' ? false: true;

const shim = document.createElement('script');
shim.nonce = /** @type {HTMLScriptElement} */(document.querySelector('script[nonce]'))?.nonce;
shim.async = true;
shim.src   = 'https://cdn.jsdelivr.net/npm/es-module-shims@2.6.2/dist/es-module-shims.wasm.js'; // Investigate why this is still needed for firefox

const element = document.createElement('script');
element.type = 'importmap';
element.textContent = JSON.stringify({
    imports: {
        'revelryengine/': global.REVELRY_DEV_MODE ? new URL('/packages/', location.href).toString() : 'https://cdn.jsdelivr.net/gh/revelryengine/',

        'revelryengine-samples/models/': global.REVELRY_DEV_MODE ? new URL('/samples/models/', location.href).toString() : 'https://cdn.jsdelivr.net/gh/revelryengine/sample-models/',
        'revelryengine-samples/environments/': global.REVELRY_DEV_MODE ? new URL('/samples/environments/', location.href).toString() : 'https://cdn.jsdelivr.net/gh/revelryengine/sample-environments/',

        "gl-matrix":        "https://cdn.jsdelivr.net/npm/gl-matrix@beta/dist/esm/index.js",
        "es-module-shims":  "https://cdn.jsdelivr.net/npm/es-module-shims@2.6.2/dist/es-module-shims.wasm.js",
        "ktx-parse":        "https://cdn.jsdelivr.net/npm/ktx-parse@0.4.5/dist/ktx-parse.esm.js",
        "basis_universal/": "https://cdn.jsdelivr.net/gh/BinomialLLC/basis_universal@v1_60/webgl/transcoder/build/",
        "draco3d/":         "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
        "box2d-wasm":       "https://cdn.jsdelivr.net/npm/box2d-wasm@7.0.0/dist/es/Box2D.js",
        "physx-js-webidl":  "https://cdn.jsdelivr.net/npm/physx-js-webidl@2.6.2/physx-js-webidl.js",
        "rfc6902":          "https://cdn.jsdelivr.net/npm/rfc6902@5.1.1/index.js/+esm",
        "lit/":             "https://esm.sh/lit@3.3.1/",
    }
});

document.currentScript?.after(shim);
document.currentScript?.after(element);
