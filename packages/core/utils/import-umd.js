const global = /** @type {{ exports: any, importScripts: any } }} */(/** @type {unknown}} */(globalThis));

/** @param {string} path */
export async function importUMD(path) {
    const original = global.exports;

    global.exports = {};
    if(typeof global.importScripts === 'function'){
        global.importScripts(path)
    } else {
        Object.assign(global.exports , await import(path));
    }

    const { exports } = global;
    global.exports = original;
    return exports;
}

export default importUMD;