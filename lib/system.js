import { GameNode } from './gom/game-node.js';
import { IdSet    } from './utils/id-set.js';

/** @typedef {import('./game.js').Game} Game */
/** @typedef {import('./stage.js').Stage} Stage */
/** @typedef {import('./model.js').Model} Model */
/** @typedef {import('./model.js').ModelConstructor} ModelConstructor */

/** 
 * @typedef  SystemModelDefinition
 * @property {ModelConstructor} model
 * @property {boolean} [isSet=false]
 */

/**
 * @typedef {Record<String, SystemModelDefinition>} SystemModelDefinitions
 */

/** 
 * @typedef {typeof System} SystemConstructor
 */


/** 
 * @extends {GameNode<Stage, any>} 
*/
export class System extends GameNode {
    models = new IdSet();

    /**
     * Creates an instance of System.
     */
    constructor() {
        super(...arguments);
        
        for (const [name, { isSet }] of Object.entries(/** @type {SystemConstructor} */ (this.constructor).models)) {
            if (isSet) {
                /** @type {any} */ (this)[name] = new Set();
            }
        }
    }

    /**
     * A reference to the parent of a System which is the {@link Stage}.
     *
     * @type {Stage|undefined}
     */
    get stage() {
        return this.parent;
    }

    /**
     * A reference to the parent of a System's parent which is the {@link Game}.
     *
     * @type {Game|undefined}
     */
    get game() {
        return this.parent && this.parent.parent;
    }

    /** 
     * Method that will be called when a model is initialized and added to the system
     * @param {Model} model
     * @param {string} key
     * @virtual
     */
    onModelAdd(model, key) {
        model; key;
    }

    /** 
     * Method that will be called when a model is deleted and removed from the system
     * @param {Model} model
     * @param {string} key
     * @virtual
     */
    onModelDelete(model, key) {
        model; key;
    }

    /** 
     * @type {SystemModelDefinitions}
     */
    static models = {}
}

export default System;
