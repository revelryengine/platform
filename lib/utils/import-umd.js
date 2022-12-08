export async function importUMD(path) {
    globalThis.exports = {};
    try {
        importScripts(path);
    } catch {
        Object.assign(globalThis.exports , await import(path));
    }
    const { exports } = globalThis;
    delete globalThis.exports;
    return exports;
}

export default importUMD;