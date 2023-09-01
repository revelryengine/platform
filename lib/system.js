/// <reference types="./system.d.ts" />

import { GameNode } from './gom/game-node.js';
import { IdSet    } from './utils/id-set.js';


/**
 * @typedef {import('./system.d.ts').System} SystemClass
 * @typedef {import('./system.d.ts').SystemConstructor} SystemConstructor
 */

/**
 * @typedef {import('./stage.js').ComponentTypesDefinition} ComponentTypesDefinition
 * @typedef {import('./utils/watchable.js').EventMap} EventMap
 */

/**
 * A class that declaratively defines a system.
 * 
 * @extends {GameNode<import('./stage.js').Stage, any, { 'model:add': { model: import('./model.js').Model, key: string }, 'model:delete': { model: import('./model.js').Model, key: string } } >}
 * @implements {SystemClass}
 */
export class System extends GameNode {
    /** @type {IdSet<import('./model.js').Model>} */
    models = new IdSet();

    /**
     * Creates an instance of System.
     */
    constructor() {
        super(...arguments);
        
        for (const [name, { isSet }] of Object.entries(/** @type {SystemConstructor} */(this.constructor).models)) {
            if (isSet) {
                /** @type {any} */ (this)[name] = new Set();
            }
        }
    }

    /**
     * A reference to the parent of a System which is the Stage.
     */
    get stage() {
        return this.parent;
    }

    /**
     * A reference to the parent of a System's parent which is the Game.
     */
    get game() {
        return this.parent && this.parent.parent;
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

    static Typed() {
        /**
         * @param {{ models: import('./system.d.ts').SystemModelsDefinition }} definition
         */
        return ({ models }) => {
            return class System extends this {
                static models = models;
            }
        }
    }

    static models = {};
}

export default System;
