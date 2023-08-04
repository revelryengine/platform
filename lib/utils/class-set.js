/**
 * A Set with extended functionality to map and find each item by object constructor.
 *
 * @template {object} T
 * @extends {Set<T>}
 */
export class ClassSet extends Set {
    /**
     * @typedef {new(...args: any[]) => T} Constructor
     */

    /**
     * Creates an instance of IdSet.
     */
    constructor() {
        super();
        /**
         * A map of each item by class.
         * @type {Map<Function, T>}
         */
        this.classMap = new Map();
    }

    /**
     * Adds an item to the set and maps the item by class.
     *
     * @param {T} item
     * @return {this}
     */
    add(item) {
        if (item.constructor) this.classMap.set(/** @type {Constructor} */ (item.constructor), item);
        return /** @type {this}*/(super.add(item));
    }

    /**
     * Delete an item from the set and removes class reference.
     *
     * @param {T} item
     */
    delete(item) {
        return this.classMap.delete(/** @type {Constructor} */(item.constructor)) && super.delete(item);
    }

    /**
     * Get an item by class
     *
     * @param {Constructor} cls
     */
    getByClass(cls) {
        return this.classMap.get(cls);
    }
}

export default ClassSet;
