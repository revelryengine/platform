/// <reference path="./system.d.ts" />

import { Watchable } from './utils/watchable.js';

/**
 * @typedef {import('./system.d.ts').System} SystemClass
 * @typedef {import('./system.d.ts').SystemConstructor} SystemConstructor
 */

/**
 * @typedef {import('./utils/watchable.js').WatchableEventMap} EventMap
 */

/**
 * @typedef {{ 'model:add': { model: import('./model.js').Model, key: string }, 'model:delete': { model: import('./model.js').Model, key: string } }} SystemEvents
 */

/**
 * A class that declaratively defines a system.
 *
 * @extends {Watchable<SystemEvents>}
 * @implements {SystemClass}
 */
export class System extends Watchable {

    /**
     * @readonly
     */
    id = (this.constructor.name.charAt(0).toLowerCase() + this.constructor.name.slice(1));

    /**
     * @type {import('./stage.js').Stage | null}
     * @readonly
     */
    stage = null;

    /**
     * A reference to the parent of a System's parent which is the Game.
     */
    get game() {
        return this.stage?.game ?? null;
    }

    /**
     * Creates an instance of System.
     */
    constructor() {
        super();

        for (const [name, { isSet }] of Object.entries(/** @type {SystemConstructor} */(this.constructor).models)) {
            if (isSet) {
                /** @type {any} */ (this)[name] = new Set();
            }
        }
    }

    connectedCallback(){
    }

    disconnectedCallback(){
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
     */
    update(deltaTime) {
    }

    render() {
    }

    /**
     * @param {{ models: import('./system.d.ts').SystemModelsDefinition }} definition
     */
    static Typed({ models }) {
        return class System extends this {
            static models = models;
        }
    }

    static models = {};
}
