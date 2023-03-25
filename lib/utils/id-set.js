import { UUID } from './uuid.js';

/**
 * A Set with extended functionality to map and find each item by id property.
 *
 */
export class IdSet extends Set {
    #register;
    #unregister;

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
    add(item, register = true) {
        item.id = item.id ?? UUID();

        register && (item = this.#register?.(item) ?? item);

        this.idMap.set(item.id, item);
        super.add(item);

        return this;
    }

    /**
     * Delete an item from the set and removes id reference.
     *
     * @param {*} item
     */
    delete(item, unregister = true) {
        const id = item.id;

        item = this.getById(id);
        this.idMap.delete(id);
        
        const res = super.delete(item);
        
        res && unregister && this.#unregister?.(item);
        return res;
    }

    /**
     * Get an item by id property
     *
     * @param {String} id
     * @returns {*}
     */
    getById(id) {
        return this.idMap.get(id);
    }

    setRegistrationHandlers({ register, unregister }) {
        this.#register   = register;
        this.#unregister = unregister;
        return this;
    }
}

export default IdSet;
