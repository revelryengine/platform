/** @typedef {import('./utils/watchable.js').WatchOptions} WatchOptions */
/** @typedef {import('./utils/watchable.js').WatchHandler} WatchHandler */

/** @typedef {import('./game.js').Game} Game */
/** @typedef {import('./stage.js').Stage} Stage */
/** @typedef {import('./stage.js').Entity} Entity */
/** @typedef {import('./stage.js').Component} Component */

import { Watchable } from './utils/watchable.js';


/** 
 * @typedef {typeof ModelClass} ModelConstructor
 */

/** 
 * @typedef ModelComponentDefinition
 * @property {string} type
 */

/**
 * @typedef {{[key: string]: any }} ModelComponentTypes
 */

/**
 * A class that declaratively defines a model.
 * @template {ModelComponentTypes} T
 */
class ModelClass extends Watchable {
    #abortCtl = new AbortController();

    /**
     * @typedef ModelStaticComponents
     * @property {{ [Property in keyof T]: ModelComponentDefinition }} components
     */

    /**
     * Creates an instance of Model.
     * @param {string} id
     * @param {Entity} entity
     */
    constructor(id, entity) {
        super();

        this.id = id;

        /** @type {Entity} */
        this.entity = entity;

        /** @type {Map<String, Component>} */
        this.components = new Map();

        /** @type {Set<String>} */
        this.types = new Set();

        for (const [propName, { type }] of Object.entries(/** @type {ModelStaticComponents} */(/** @type {unknown} */(this.constructor)).components)) {

            this.types.add(type);

            Object.defineProperty(this, propName, {
                get() {
                    return this.components.get(propName)?.value;
                },
                set(newValue) {
                    const component = this.components.get(propName);
                    if(component) {
                        component.value = newValue;
                    }
                }
            });

            for (const cmpnt of entity.components) {
                if (type === cmpnt.type) {
                    this.components.set(propName, cmpnt);
                    cmpnt.watch({ type: 'value:change', immediate: true, signal: this.#abortCtl.signal, handler: (previousValue) => this.notify(propName + ':change', previousValue) });
                }
            }
        }
    }

    cleanup(){
        this.#abortCtl.abort();
    }

    /**
     * A reference to the stage the entity belongs to {@link Stage}.
     */
    get stage() {
        return this.entity.stage;
    }

    /**
     *  A reference to the game the entity belongs to {@link Game}.
     */
    get game() {
        return this.stage.game;
    }

    /**
     * @type {{[key: string]: ModelComponentDefinition}}
     */
    static components = {}
}

export const Model = /** @type {new <T extends object>(...args: any[]) => T & ModelClass<T> } */(/** @type {unknown} */(ModelClass));

export default Model;
