/**
 * @import { DracoDecoderModule, DecoderModule } from 'draco3d@ts-types';
 */

/**
 * @internal
 * @callback Draco3DDefine
 * @param {string|Array<string>} _
 * @param {() => DracoDecoderModule} factory
 *
 * @internal
 * @typedef {Draco3DDefine & { amd?: boolean }} AMDDefine
 */

/**
 * @type {Promise<DecoderModule>|null}
 */
let promise = null

export async function Draco3dFactory() {
    promise ??= new Promise(async (resolve, reject) => {
        //import from UMD by setting global AMD define function
        const global   = /** @type {{ define: AMDDefine }} */(/** @type {unknown} */(globalThis));
        const original = global.define;

        try {
            global.define = (_, factory) => {
                factory()({
                    // locateFile: () => import.meta.resolve('draco3d/draco_decoder.wasm'),
                    onModuleLoaded: (module) => { console.log(module); resolve(module); },
                });
                global.define = original;
            };
            global.define.amd = true;
            await import('draco3d/draco_decoder.js');
        } catch(e) {
            reject(e);
        } finally {
            global.define = original;
        }
    });
    return promise;
}
