declare module 'https://*'

declare module 'https://cdn.jsdelivr.net/gh/toji/gl-matrix@v3.4.1/src/index.js' {
    import 'vendor/cdn.jsdelivr.net/gh/toji/gl-matrix@v3.4.1/src/types.d.js';
    export * from 'vendor/cdn.jsdelivr.net/gh/toji/gl-matrix@v3.4.1/src/index.js';
}

declare module 'https://esm.sh/gh/BinomialLLC/basis_universal@1.16.4/webgl/transcoder/build/basis_transcoder.js?target=esnext' {
    const BASIS: ({ wasmBinary: Array }) => Promise<{ initializeBasis: () => void }>;
    export default BASIS;
}
