/**
 * @import { NamedGLTFProperty } from '../../gltf-property.js';
 */

/**
 * @template {NamedGLTFProperty} T
 * @param {T[]|undefined} collection
 * @param {string} name
 */
export function findItem(collection, name) {
    if(!collection) {
        throw new Error(`Collection is undefined`);
    }
    const item = collection.find(entry => entry.name === name);
    if(!item) {
        throw new Error(`Missing item ${name} in collection`);
    }
    return item;
}

/**
 * @template {NamedGLTFProperty} T
 * @template {keyof T} P
 * @param {T[]|undefined} collection
 * @param {string} name
 * @param {P} prop
 */
export function findItemProp(collection, name, prop) {
    const item = findItem(collection, name);
    if(!item[prop]) {
        throw new Error(`Missing property ${String(prop)} on item ${name}`);
    }
    return item[prop];
}
