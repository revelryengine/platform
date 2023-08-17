import { GameNode } from './gom/game-node.js';
import { IdSet    } from './utils/id-set.js';

/**
 * @typedef {import('./stage.js').ComponentTypeMap} ComponentTypeMap
 */

/**
 * A class that declaratively defines a system.
 * 
 * @template {ComponentTypeMap} [T = any]
 * @template {SystemModelsDefinition<T>} [D = SystemModelsDefinition<T>]
 * @extends {GameNode<import('./stage.js').Stage<T>, any, { 'model:add': { model: import('./model.js').Model<T>, key: string }, 'model:delete': { model: import('./model.js').Model<T>, key: string } }>}
 */
export class System extends GameNode {
    models = new IdSet();

    /**
     * Creates an instance of System.
     */
    constructor() {
        super(...arguments);
        
        for (const [name, { isSet }] of Object.entries(/** @type {typeof System<T,D>} */(this.constructor).models)) {
            if (isSet) {
                /** @type {any} */ (this)[name] = new Set();
            }
        }
    }

    /**
     * A reference to the parent of a System which is the Stage.
     *
     * @type {import('./stage.js').Stage<T>|undefined}
     */
    get stage() {
        return this.parent;
    }

    /**
     * A reference to the parent of a System's parent which is the Game.
     *
     * @type {import('./game.js').Game|undefined}
     */
    get game() {
        return this.parent && this.parent.parent;
    }

    /** 
     * Method that will be called when a model is initialized and added to the system
     * @param {import('./model.js').Model<T>} model
     * @param {string} key
     * @virtual
     */
    onModelAdd(model, key) {
        model; key;
    }

    /** 
     * Method that will be called when a model is deleted and removed from the system
     * @param {import('./model.js').Model<T>} model
     * @param {string} key
     * @virtual
     */
    onModelDelete(model, key) {
        model; key;
    }

    /**
     * @type {SystemModelsDefinition<any>}
     */
    static models = {};

    /**
     * @template {ComponentTypeMap} T
     * @template {SystemModelsDefinition<T>} D
     * @param {D} models 
     * @param {T} [_]
     */
    static define(models, _) {
        class System extends this {
            static models = models;
        }
        return /** @type {SystemConstructorTyped<T,D>} */(/** @type {unknown} */(System));
    }
}

/**
 * @template {ComponentTypeMap} [T = any]
 * @typedef {{
*     [K: string]: { model: import('./model.js').ModelConstructor<T>, isSet?: boolean }
* }} SystemModelsDefinition
*/

/**
* @template {ComponentTypeMap} [T = any]
* @template {SystemModelsDefinition<T>} [D = SystemModelsDefinition<T>]
* @typedef {{
*     new (id?: string): System<T,D>;
*     models: D;
* }} SystemConstructor
*/

/**
* @template {ComponentTypeMap} [T = any]
* @template {SystemModelsDefinition<T>} [D = SystemModelsDefinition<T>]
* @typedef {{
*     new (id?: string): { [K in Extract<keyof D, string>]: D[K]['isSet'] extends true ? Set<InstanceType<D[K]['model']>> : InstanceType<D[K]['model']> } & System<T,D>;
*     models: D;
* }} SystemConstructorTyped
*/

export default System;
