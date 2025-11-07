import { Watchable } from './watchable.js';

/**
 * @import { Model as ModelClass, ModelConstructor } from './model.d.ts';
 * @import { Component } from './component.js';
 * @import { Stage     } from './stage.js';
 */

/**
 * A class that declaratively defines a model.
 *
 * @type {ModelClass}
 */
export class Model extends Watchable {
    /** @type {Record<string, Component>}*/
    components;

    /** @type {Set<string>} */
    types;

    /**
     * Creates an instance of Model.
     * @param {Stage} stage
     * @param {string} entity
     */
    constructor(stage, entity) {
        super();

        this.stage = stage;
        this.entity = entity;

        this.components = {};
        this.types      = new Set();

        for (const type of /** @type {ModelConstructor} */(this.constructor).components) {
            this.types.add(type);
            for (const cmpnt of this.stage.components.find({ entity })) {
                if (type === cmpnt.type) {
                    this.components[type] = cmpnt;
                }
            }
        }
    }

    /**
     *  A reference to the game the entity belongs to Game.
     */
    get game() {
        return this.stage.game;
    }

    /**
     * @param {{ components: string[] }} definition
     */
    static Typed({ components }) {
        return class extends Model {
            /**
             * @override
             */
            static components = components;
        }
    }

    /** @type {string[]} */
    static components = [];
}
