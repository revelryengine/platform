import { Watchable } from './utils/watchable.js';

/**
 * @typedef {import('./stage.js').ComponentTypesDefinition} ComponentTypesDefinition
 */

/**
 * A class that declaratively defines a model.
 * 
 * @template {ComponentTypesDefinition} [T = ComponentTypesDefinition]
 * @template {ModelComponentsDefinition<T>} [D = ModelComponentsDefinition<T>]
 */
export class Model extends Watchable {
    #abortCtl = new AbortController();
    

    /**
     * Creates an instance of Model.
     * @param {string} id
     * @param {import('./stage.js').Entity<T>} entity
     */
    constructor(id, entity) {
        super();

        this.id = id;

        /** @type {import('./stage.js').Entity<T>} */
        this.entity = entity;

        this.components = /** @type {{[K in Extract<keyof D, string>]: import('./stage.js').Component<T, D[K]['type']> }} */({});

        /** @type {Set<Extract<keyof T, string>>} */
        this.types = new Set();
        
        for (const [propName, { type }] of Object.entries(/** @type {D} */(/** @type {typeof Model<T,D>} */(this.constructor).components))) {
            this.types.add(type);

            for (const cmpnt of entity.components) {
                if (type === cmpnt.type) {
                    this.components[/** @type {Extract<keyof D, string>} */(propName)] = cmpnt;

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
    
    /** 
     * @type {ModelComponentsDefinition<any>}
     */
    static components = {};

    /**
     * @template {ComponentTypesDefinition} T
     * @template {ModelComponentsDefinition<T>} D
     * @param {D} components 
     * @param {T} [_]
     */
    static define(components, _) {
        class ExtendedModel extends this {
            static components = components;
        }
        return /** @type {ModelConstructorTyped<T,D>} */(/** @type {unknown} */(ExtendedModel));
    }
}

/**
 * @template {ComponentTypesDefinition} T
 * @typedef {Record<string, { type: Extract<keyof T, string> }>} ModelComponentsDefinition
 */

/**
 * @template {ComponentTypesDefinition} T
 * @template {ModelComponentsDefinition<T>} [D = ModelComponentsDefinition<T>]
 * @typedef {{
 *     new (id: string, entity: import('./stage.js').Entity<T>): Model<T,D>;
 *     components: D;
 * }} ModelConstructor
 */

/**
 * @template {ComponentTypesDefinition} T
 * @template {ModelComponentsDefinition<T>} [D = ModelComponentsDefinition<T>]
 * @typedef {{
*     new (id: string, entity: import('./stage.js').Entity<T>): { [K in Extract<keyof D, string>]: T[D[K]['type']]['complex'] } & Model<T,D>;
*     components: D;
* }} ModelConstructorTyped
*/


export default Model;