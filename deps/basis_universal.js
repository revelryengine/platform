import BASIS from 'https://esm.sh/v135/gh/BinomialLLC/basis_universal@1.16.4/webgl/transcoder/build/basis_transcoder.js?target=esnext';

export async function BasisUFactory() {
    const wasmBinary = await fetch(import.meta.resolve('https://cdn.jsdelivr.net/gh/BinomialLLC/basis_universal@1.16.4/webgl/transcoder/build/basis_transcoder.wasm')).then(res => res.arrayBuffer());
    return new Promise((resolve) => BASIS({ wasmBinary }).then(module => { module.initializeBasis(); resolve(module); }));
}
