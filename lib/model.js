/// <reference types="./model.d.ts" />

import { Watchable } from './utils/watchable.js';


/**
 * @typedef {import('./model.d.ts').Model} ModelClass
 * @typedef {import('./model.d.ts').ModelConstructor} ModelConstructor
 */

/**
 * A class that declaratively defines a model.
 * 
 * @implements {ModelClass}
 */
export class Model extends Watchable {
    #abortCtl = new AbortController();

    /** @type {string} */
    id;

    /** @type {import('./stage.js').Entity} */
    entity;

    /** @type {Record<string, import('./stage.js').Component>}*/
    components;

    /** @type {Set<string>} */
    types;
    
    /**
     * Creates an instance of Model.
     * @param {string} id
     * @param {import('./stage.js').Entity} entity
     */
    constructor(id, entity) {
        super();

        this.id         = id;
        this.entity     = entity;
        this.components = {};
        this.types      = new Set();
        
        for (const [propName, { type }] of Object.entries(/** @type {ModelConstructor} */(this.constructor).components)) {
            this.types.add(type);

            for (const cmpnt of entity.components) {
                if (type === cmpnt.type) {
                    this.components[propName] = cmpnt;

                    cmpnt.watch('value:change', { immediate: true, signal: this.#abortCtl.signal, handler: (previousValue) => this.notify(`${propName}:change`, previousValue) });
                    cmpnt.watch('value:notify', { immediate: true, signal: this.#abortCtl.signal, handler: (events) => this.notify(`${propName}:notify`, events) });

                    Object.defineProperty(this, propName, {
                        get: () => {
                            return cmpnt.value;
                        },
                        set: (newValue) => {
                            cmpnt.value = newValue;
                        }
                    });
                }
            }
        }
    }

    /**
     * Cleanup method that will be called when model is removed from the Stage.
     */
    cleanup(){
        this.#abortCtl.abort();
    }

    /**
     * A reference to the stage the entity belongs to Stage.
     */
    get stage() {
        return this.entity.stage;
    }

    /**
     *  A reference to the game the entity belongs to Game.
     */
    get game() {
        return this.stage.game;
    }
    
    static Typed() {
        /**
         * @param {{ components: import('./model.d.ts').ModelComponentsDefinition }} definition
         */
        return ({ components }) => {
            return class Model extends this {
                static components = components;
            }
        }
    }

    static components = {};
}

export default Model;