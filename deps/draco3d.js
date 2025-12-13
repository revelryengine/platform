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
        const global   = /** @type {{ define: AMDDefine, process: unknown }} */(/** @type {unknown} */(globalThis));
        const original = global.define;
        const originalProcess = global.process;

        try {
            //We need to ensure that module treats it as web (i.e. ENVIRONMENT_IS_WEB)
            delete global.process;
            global.define = (_, factory) => {
                factory()({
                    // locateFile: () => import.meta.resolve('draco3d/draco_decoder.wasm'),
                    onModuleLoaded: (module) => { resolve(module); },
                });
                global.define = original;
            };
            global.define.amd = true;
            await import('draco3d/draco_decoder.js');
        } catch(e) {
            reject(e);
        } finally {
            global.process = originalProcess;
            global.define = original;
        }
    });
    return promise;
}
