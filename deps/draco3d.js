/**
 *
 * @typedef {import('https://cdn.jsdelivr.net/npm/@types/draco3d@1.4.3/index.d.ts').DracoDecoderModule} DracoDecoderModule
 * @typedef {import('https://cdn.jsdelivr.net/npm/@types/draco3d@1.4.3/index.d.ts').DecoderModule} DecoderModule
 * @typedef {import('https://cdn.jsdelivr.net/npm/@types/draco3d@1.4.3/index.d.ts').Mesh} Mesh
 * @typedef {import('https://cdn.jsdelivr.net/npm/@types/draco3d@1.4.3/index.d.ts').PointCloud} PointCloud
 * @typedef {import('https://cdn.jsdelivr.net/npm/@types/draco3d@1.4.3/index.d.ts').Status} Status
 *
 * @typedef {{ DracoDecoderModule: import("https://cdn.jsdelivr.net/npm/@types/draco3d@1.4.3/index.d.ts").DracoDecoderModule }} Draco3dExports
 */


/** @return {Promise<DecoderModule>} */
export async function Draco3dFactory() {
    //import from commonjs by overriding exports
    const global   = /** @type {{ [key: string]: unknown }}} */(globalThis);
    const original = global.exports;

    global.exports = {};
    await import('https://www.gstatic.com/draco/versioned/decoders/1.5.6/draco_decoder.js');
    const { exports: { DracoDecoderModule } } = /** @type {{ exports: Draco3dExports }} */(global);
    global.exports = original;

    // I don't think draco3d actually even uses the wasm binary here :-/
    // const wasmBinary = await fetch(import.meta.resolve('https://www.gstatic.com/draco/versioned/decoders/1.5.6/draco_decoder.wasm')).then(res => res.arrayBuffer());
    return new Promise((resolve) => DracoDecoderModule({ /** wasmBinary, */ onModuleLoaded: (module) => resolve(module) }));
}