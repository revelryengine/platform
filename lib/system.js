import { Watchable } from './watchable.js';

/**
 * @import { System as SystemClass, SystemConstructor, SystemModelsDefinition } from './system.d.ts';
 * @import { Stage } from './stage.js';
 * @import { SystemContextKey, SystemContexts } from './ecs.js';
 */

/**
 * A class that declaratively defines a system.
 *
 * @type {SystemClass}
 */
export class System extends Watchable {
    static id = 'system';

    get id () {
        return /** @type {typeof System} */(this.constructor).id;
    }

    /**
     * A reference to the parent of a System's parent which is the Game.
     */
    get game() {
        return this.stage.game;
    }

    /**
     * Creates an instance of System.
     * @param {Stage} stage
     */
    constructor(stage) {
        super();

        /**
         * @readonly
         */
        this.stage = stage;

        this.models = {};

        for (const [name, { isSet }] of Object.entries(/** @type {SystemConstructor} */(this.constructor).models)) {
            if (isSet) {
                this.models[name] = new Set();
            }
        }
    }

    /**
     * Method that will be called when a model is initialized and added to the system
     * @virtual
     */
    onModelAdd() {

    }

    /**
     * Method that will be called when a model is deleted and removed from the system
     * @virtual
     */
    onModelDelete() {

    }

    /**
     * @param {number} deltaTime
     * @virtual
     */
    update(deltaTime) {

    }
    /**
     * @virtual
     */
    render() {

    }

    /**
     * @param {{ id: string, models: SystemModelsDefinition }} definition
     */
    static Typed({ id, models }) {
        return class System extends this {
            static id     = id;
            static models = models;
        }
    }

    static models = {};
}


/**
 * @typedef {{ 'system:add': { system: System }, 'system:delete': { system: System } }} SystemSetEvents
 */


/**
 * @extends {Watchable<SystemSetEvents>}
 */
export class SystemSet extends Watchable {
    #register;
    #unregister;

    /** @type {Set<System>} */
    #set = new Set();

    /**
     * @type {Map<string, System>}
     */
    #byId = new Map();

    [Symbol.iterator]() {
        return this.#set[Symbol.iterator]();
    }

    /**
     * @param {{ register: (system: System) => System, unregister: (system: System) => void }} registrationHandlers
     */
    constructor({ register, unregister }) {
        super();
        this.#register   = register;
        this.#unregister = unregister;
    }

    /**
     * @param {System} system
     */
    add(system) {
        if(this.#set.has(system)) return this;

        if(this.#byId.has(system.id)) throw new Error(`System with id ${system.id} already exists`);

        this.#register(system);

        this.#set.add(system);

        this.#byId.set(system.id, system);

        this.notify('system:add', { system });
        return this;
    }

    /**
     * @param {System} system
     */
    delete(system) {
        if(!this.#set.has(system)) return false;

        this.#unregister(system);

        this.#set.delete(system);

        this.#byId.delete(system.id);

        this.notify('system:delete', { system });
        return true;
    }

    /**
     * @template {SystemContextKey} K
     * @overload
     * @param {K} id
     * @return {SystemContexts[K]|undefined}
     *
     * @overload
     * @param {string} id
     * @return {System|undefined}
     *
     * @param {string} id - The name of the context to fetch
     */
    getById(id) {
        return this.#byId.get(id);
    }
}
