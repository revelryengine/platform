/**
 * A Set with extended functionality to map and find each item by object constructor.
 *
 */
export class ClassSet extends Set {
    /**
     * Creates an instance of IdSet.
     */
    constructor() {
        super();
        /**
         * A map of each item by class.
         * @type {Map}
         */
        this.classMap = new Map();
    }

    /**
     * Adds an item to the set and maps the item by class.
     *
     * @param {*} item
     */
    add(item) {
        if (item.constructor) this.classMap.set(item.constructor, item);
        return super.add(item);
    }

    /**
     * Delete an item from the set and removes class reference.
     *
     * @param {*} item
     */
    delete(item) {
        return this.classMap.delete(item.constructor) && super.delete(item);
    }

    /**
     * Get an item by class
     *
     * @param {Function} class
     * @returns {*}
     */
    getByClass(cls) {
        return this.classMap.get(cls);
    }
}

export default ClassSet;
