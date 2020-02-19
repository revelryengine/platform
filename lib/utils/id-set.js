/**
 * A Set with extended functionality to map and find each item by id property.
 *
 */
export class IdSet extends Set {
    /**
     * Creates an instance of IdSet.
     */
    constructor() {
        super();
        /**
         * A map of each item by id. If a child does not have an id it will not be present in this map.
         * @type {Map}
         */
        this.idMap = new Map();
    }

    /**
     * Adds an item to the set and maps the item by id.
     *
     * @param {*} item
     */
    add(item) {
        if (item.id) this.idMap.set(item.id.toString(), item);
        return super.add(item);
    }

    /**
     * Delete an item from the set and removes id reference.
     *
     * @param {*} item
     */
    delete(item) {
        return this.idMap.delete(item.id.toString()) && super.delete(item);
    }

    /**
     * Get an item by id property
     *
     * @param {String} id
     * @returns {*}
     */
    getById(id) {
        return this.idMap.get(id.toString());
    }
}

export default IdSet;
