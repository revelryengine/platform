/// <reference path="./model.d.ts" />

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

    /** @type {Record<string, import('./component.js').Component>}*/
    components;

    /** @type {Set<Revelry.ECS.ComponentTypeKeys>} */
    types;

    /**
     * Creates an instance of Model.
     * @param {import('./stage.js').Stage} stage
     * @param {string} entity
     */
    constructor(stage, entity) {
        super();

        this.stage = stage;
        this.entity = entity;

        this.components = {};
        this.types      = new Set();

        for (const [propName, { type }] of Object.entries(/** @type {ModelConstructor} */(this.constructor).components)) {
            this.types.add(type);

            for (const cmpnt of this.stage.components.find({ entity })) {
                if (type === cmpnt.type) {
                    this.components[propName] = cmpnt;

                    cmpnt.watch('value:change', { signal: this.#abortCtl.signal, handler: (previous) => this.notify(`${propName}:change`, previous) });
                    cmpnt.watch('value:notify', { signal: this.#abortCtl.signal, handler: (events) => this.notify(`${propName}:notify`, events) });

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
     *  A reference to the game the entity belongs to Game.
     */
    get game() {
        return this.stage.game;
    }

    /**
     * @param {{ components: import('./model.d.ts').ModelComponentsDefinition }} definition
     */
    static Typed({ components }) {
        return class extends Model {
            static components = components;
        }
    }

    static components = {};
}
