import { GameNode } from './gom/game-node.js';
import { IdSet    } from './utils/id-set.js';


/**
 * @typedef {import('./stage.js').ComponentTypesDefinition} ComponentTypesDefinition
 * @typedef {import('./utils/watchable.js').EventMap} EventMap
 */

/**
 * A class that declaratively defines a system.
 * 
 * @template {ComponentTypesDefinition} [T = ComponentTypesDefinition]
 * @template {SystemModelsDefinition<T>} [D = SystemModelsDefinition<T>]
 * @template {EventMap} [E=EventMap]
 * @extends {GameNode<import('./stage.js').Stage<T>, any, E & { 'model:add': { model: import('./model.js').Model<T>, key: string }, 'model:delete': { model: import('./model.js').Model<T>, key: string } }>}
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
     * @param {import('./model.js').Model<T, any>} model
     * @param {string} key
     */
    onModelAdd(model, key) {
        model; key;
    }

    /** 
     * Method that will be called when a model is deleted and removed from the system
     * @param {import('./model.js').Model<T, any>} model
     * @param {string} key
     */
    onModelDelete(model, key) {
        model; key;
    }

    /**
     * @type {SystemModelsDefinition<any>}
     */
    static models = {};

    /**
     * @template {ComponentTypesDefinition} T
     * @template {SystemModelsDefinition<T>} D
     * @template {EventMap} E
     * @param {D} models 
     * @param {T} [_]
     * @param {E} [__]
     */
    static define(models, _, __) {
        class System extends this {
            static models = models;
        }
        return /** @type {SystemConstructorTyped<T,D,E>} */(/** @type {unknown} */(System));
    }
}

/**
 * @template {ComponentTypesDefinition} [T = ComponentTypesDefinition]
 * @typedef {{
 *     [K: string]: { model: import('./model.js').ModelConstructor<T, any>, isSet?: boolean }
 * }} SystemModelsDefinition
 */

/**
 * @template {ComponentTypesDefinition} [T = ComponentTypesDefinition]
 * @template {SystemModelsDefinition<T>} [D = SystemModelsDefinition<T>]
 * @template {EventMap} [E = EventMap]
 * @typedef {{
 *     new (id?: string): System<T,D,E>;
 *     models: D;
 * }} SystemConstructor
 */

/**
 * @template {ComponentTypesDefinition} [T = ComponentTypesDefinition]
 * @template {SystemModelsDefinition<T>} [D = SystemModelsDefinition<T>]
 * @template {EventMap} [E = EventMap]
 * @typedef {{
 *     new (id?: string): { [K in Extract<keyof D, string>]: D[K]['isSet'] extends true ? Set<InstanceType<D[K]['model']>> : InstanceType<D[K]['model']> } & System<T,D,E>;
 *     models: D;
 * }} SystemConstructorTyped
 */

export default System;
