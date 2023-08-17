import UUID from './uuid.js';


/**
 * A Set with extended functionality to map and find each item by id property.
 * It will automatically add a UUID if an id is not specified
 * 
 * @template {{ id?: string }}    [T = {id?: string}]
 * @template {T & { id: string }} [U = T & { id: string }]
 * @extends {Set<U>}
 */
export class IdSet extends Set {
    #byId = /** @type {Map<string, U>} */(new Map());

    /**
     * @param {T} item
     * @return {asserts item is U}
     */
    deanonomize(item) {
        item.id ??= UUID();
    }

    /**
     * @param {T} item
     */
    add(item) {
        this.deanonomize(item);
        this.#byId.set(item.id, item);
        return super.add(item);
    }

    /**
     * @param {{ id: string }} item
     */
    delete({ id }) {
        const item = this.getById(id);
        if(item) {
            this.#byId.delete(id);
            return super.delete(item);
        }
        return false
    }

    /**
     * Get an item by id property
     *
     * @param {string} id
     */
    getById(id) {
        return this.#byId.get(id);
    }
}


export default IdSet;
