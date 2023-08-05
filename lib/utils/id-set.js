import { UUID } from './uuid.js';

/**
 * @typedef AnonObject
 * @property {string} [id]
 */

/**
 * @typedef IdObject
 * @property {string} id
 */

/** 
 * @template {AnonObject} U
 * @template {IdObject}   R
 * @callback RegistrationHandler
 * @param {IdObject & (U|R)} item
 * @return {R}
 */

/** 
 * @template {IdObject} R
 * @callback UnRegistrationHandler
 * @param {R} item
 */

/**
 * A Set with extended functionality to map and find each item by id property.
 * @template {AnonObject} U - Unregistered Object Type
 * @template {IdObject}   R - Registered Object Type
 * @extends {Set<R>}
 */
export class IdSet extends Set {
    /** @type {RegistrationHandler<U,R>} */
    #register = (item) => { return /** @type {R} */(item) };
    
    /** @type {UnRegistrationHandler<R>} */
    #unregister = () => false;
    
    /**
     * A map of each item by id.
     * @type {Map<string, R>}
     */
    #byId = new Map();


    /**
     * Adds an item to the set and maps the item by id.
     *
     * @param {U|R} item
     */
    add(item) {
        item.id ??= UUID();
        const idItem = /** @type {IdObject & U|R} */ (item);

        const registered = this.#register(idItem);

        this.#byId.set(idItem.id, registered);

        return super.add(registered);
    }

    /**
     * Delete an item from the set and removes id reference.
     *
     * @param {IdObject} item
     */
    delete(item) {
        const id = item.id;
        const registered = this.getById(id);

        if(registered) {
            this.#byId.delete(id);
            super.delete(registered);
            this.#unregister(registered);
            return true;
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

    /**
     * Sets the registration handlers for this set
     * 
     * @param {{ register: RegistrationHandler<U,R>, unregister: UnRegistrationHandler<R> }} handlers
     */
    setRegistrationHandlers({ register, unregister }) {
        this.#register   = register;
        this.#unregister = unregister;
        return this;
    }

    /**
     * Adds an item to the set and maps the item by id without calling any registration handlers.
     *
     * @param {R} item
     * 
     */
    addSilent(item) {
        this.#byId.set(item.id, item);
        super.add(item);

        return this;
    }

    /**
     * Delete an item from the set and removes id reference without calling any registration handlers.
     *
     * @param {R} item
     */
    deleteSilent(item) {
        const id = item.id;

        const registered = this.getById(id);

        if(registered) {
            this.#byId.delete(id);
            super.delete(registered);
            return true;
        }
        return false
    }
}


export default IdSet;
