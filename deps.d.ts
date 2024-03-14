declare module 'https://cdn.jsdelivr.net/gh/toji/gl-matrix@v3.4.1/src/index.js' {
    import 'vendor/cdn.jsdelivr.net/gh/toji/gl-matrix@v3.4.1/src/types.d.js';
    export * from 'vendor/cdn.jsdelivr.net/gh/toji/gl-matrix@v3.4.1/src/index.js';
}

declare module 'https://esm.sh/v135/gh/BinomialLLC/basis_universal@1.16.4/webgl/transcoder/build/basis_transcoder.js?target=esnext' {
    const BASIS: (arg: { wasmBinary: ArrayBuffer }) => Promise<{ initializeBasis: () => void }>;
    export default BASIS;
}

declare module 'https://cdn.jsdelivr.net/npm/box2d-wasm@7.0.0/dist/es/Box2D.js' {
    import type Box2DFactory from 'https://esm.sh/v135/box2d-wasm@7.0.0/dist/Box2DModule.d.ts';
    import 'vendor/esm.sh/box2d-wasm@7.0.0.js';
    const box2DWasm: typeof Box2DFactory;
    export default box2DWasm;
}

declare module 'https://cdn.jsdelivr.net/gh/fabmax/physx-js-webidl/dist/physx-js-webidl.js' {
    import physx from 'vendor/cdn.jsdelivr.net/gh/fabmax/physx-js-webidl/dist/physx-js-webidl.js';
    export { physx };
}

declare module 'https://esm.sh/v135/lit@3.0.1/index.js?target=esnext' {
    export * from 'vendor/esm.sh/v135/lit@3.0.1/index.js';
}

declare module 'https://esm.sh/v135/lit@3.0.1/directives/repeat.js?target=esnext' {
    export * from 'vendor/esm.sh/v135/lit@3.0.1/directives/repeat.js';
}

declare module 'https://esm.sh/v135/lit@3.0.1/static-html.js?target=esnext' {
    export * from 'vendor/esm.sh/v135/lit@3.0.1/static-html.js';
}

declare module 'https://cdn.jsdelivr.net/gh/mrdoob/stats.js/build/stats.module.js' {
    export { default } from 'vendor/cdn.jsdelivr.net/gh/mrdoob/stats.js/build/stats.module.js';
}

declare module 'https://deno.land/std@0.208.0/path/mod.ts' {
    export * from 'vendor/deno.land/std@0.208.0/path/mod.ts';
}

declare module 'https://deno.land/x/oak@v12.1.0/mod.ts' {
    export * from 'vendor/deno.land/x/oak@v12.1.0/mod.ts';
}

declare module 'https://esm.sh/v135/@floating-ui/dom@1.6.3?target=esnext' {
    export * from 'vendor/esm.sh/v135/@floating-ui/dom@1.6.3.js';
}

declare module 'https://esm.sh/v135/@gltf-transform/core@3.10.0?target=esnext' {
    export * from 'vendor/esm.sh/v135/@gltf-transform/core@3.10.0/dist/core.js';
}

declare module 'https://esm.sh/v135/@gltf-transform/extensions@3.10.0?target=esnext' {
    export * from 'vendor/esm.sh/v135/@gltf-transform/extensions@3.10.0/dist/extensions.js';
}

declare module 'https://esm.sh/v135/@floating-ui/dom@1.6.3?target=esnext' {
    export type * from 'vendor/esm.sh/v135/@floating-ui/dom@1.6.3/dist/floating-ui.dom.d.ts';
    export * from 'vendor/esm.sh/v135/@floating-ui/dom@1.6.3/esnext/dom.mjs';
}
