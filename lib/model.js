/** @typedef {import('./utils/watchable.js').Watcher} Watcher */
/** @typedef {import('./utils/watchable.js').WatchResult} WatchResult */
/** @typedef {import('./utils/watchable.js').WatchHandler} WatchHandler */
/** @typedef {import('./game.js').Game} Game */
/** @typedef {import('./stage.js').Stage} Stage */
/** @typedef {import('./stage.js').Entity} Entity */
/** @typedef {import('./stage.js').Component} Component */

import Watchable from './utils/watchable.js';

/**
 * @callback WrappedHandler
 * @param {Object} component
 * @param {any} [oldValue]
 */

/**
 * @typedef {Map<String, any>} PropertyChangeMap
 */

/**
 * @callback ModelWatchHandler
 * @param {PropertyChangeMap} changedProperties
 */

/**
 * @callback ModelWatchImmediateHandler
 * @param {Component} component
 * @param {any} [oldValue]
 */

/**
 * @typedef  {Object}     ModelWatchResult - An object containing a component, an unwatch method, the original handler function, and immediate boolean
 * @property {Boolean}    immediate - A boolean to indicate wether notifications would be handled immediately
 * @property {() => void} unwatch   - a method to remove the original watch handler 
 * @property {ModelWatchHandler|ModelWatchImmediateHandler} handler - Original handler function
 */

/**
 * @typedef  {Object}       ModelPropWatchResult - An object containing a component, an unwatch method, the original handler function, and immediate boolean
 * @property {Boolean}      immediate - A boolean to indicate wether notifications would be handled immediately
 * @property {() => void}   unwatch   - a method to remove the original watch handler 
 * @property {Component}    component - The component object for the specified property
 * @property {WatchHandler} handler   - Original handler function
 */

/** 
 * @typedef {typeof Model} ModelConstructor
 */

/** 
 * @typedef ModelComponentDefinition
 * @property {String} type
 * @property {new (...args: any[]) => any} [initializer]
 */

/**
 * @typedef {Record<String, ModelComponentDefinition>} ModelComponentDefinitions
 */

/**
 * @template Comp - Component Definition
 * @typedef {{ [Property in keyof Comp]: Comp[Property] }} ModelDefinition
 */

/**
 * A class that declaratively defines a model.
 * 
 * @type {ModelDefinition<typeof this>}
 */
export class Model /* extends Watchable */ {
    /**
     * @type {WeakMap<Function,WrappedHandler>|Null}
     */
    #wrappedHandlers = null;

    /**
     * Creates an instance of Model.
     * @param {String} id
     * @param {Entity} entity
     */
    constructor(id, entity) {
        this.id = id;

        /** @type {Entity} */
        this.entity = entity;

        /** @type {Map<String, Component>} */
        this.components = new Map();

        /** @type {Set<String>} */
        this.types = new Set();

        for (const [propName, { type }] of Object.entries(/** @type {ModelConstructor} */ (this.constructor).components)) {
            
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
                }
            }
        }
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
     * Notifies all components attached to the model of a change.
     * @param {any} [oldValue] - oldValue is expected to be an object with keys matching the propName of each component. 
     */
    notify(oldValue) {
        for(const [propName, component] of this.components) {
            component.notify(oldValue?.[propName]);
        }
    }

    
    /**
     * Watches the components attached to the model.
     * 
     * The handler will be called with the a changes map containing all of the changes for each component, batched per microtask execution.
     * If watcher.immediate=true, the handler will be called with arguments (propName, oldValue) instead of a changes map.
     * 
     * 
     * @param {ModelWatchHandler|ModelWatchImmediateHandler|Watcher} watcher - The watcher to add
     */
    watch(watcher) {
        const handler   = typeof watcher === 'object' ? watcher.handler : watcher;
        const immediate = typeof watcher === 'object' ? !!watcher.immediate : false;

        this.#wrappedHandlers ??= new WeakMap();

        const handlerMap   = new WeakMap();
        const componentMap = new WeakMap();

        let wrapped;
        if(immediate) {
            wrapped = /** @type {WrappedHandler} */ ((component, oldValue) => {
                /** @type {ModelWatchImmediateHandler} */(handler)(componentMap.get(component), oldValue);
            });
        } else {

            let queued = /** @type {PropertyChangeMap} */ (new Map());
            wrapped = /** @type {WrappedHandler} */ ((component, oldValue) => {
                if(!queued.size) {
                    queueMicrotask(() => {
                        /** @type {ModelWatchHandler} */(handler)(queued);

                        queued = /** @type {PropertyChangeMap} */ (new Map());
                    });
                }
                queued.set(componentMap.get(component), oldValue);
            });
        }
            
        
        for(const [name, component] of this.components) {
            handlerMap.set(component, component.watch({ handler: wrapped, immediate: true }));
            componentMap.set(component, name);
        }

        this.#wrappedHandlers.set(handler, wrapped);

        return { handler, immediate, unwatch: () => this.unwatch(handler) };
    }

    /**
     * Shorthand to add a watcher to a property component.
     * @param {String} name - The name of the property to watch
     * @param {WatchHandler|Watcher} watcher - The watcher to add to the component
     */
    watchProp(name, watcher) {
        const component = this.components.get(name);
        if(!component) throw new Error('Component property missing');
        return { component, ...component.watch(watcher) };
    }

    /**
     * Stops watching the components attached to the model.
     * 
     * @param {ModelWatchHandler|ModelWatchImmediateHandler} handler - The handler function to remove.
     */
    unwatch(handler) {
        const wrapped = this.#wrappedHandlers?.get(handler);
        if(wrapped) {
            for(const [, component] of this.components) {
                component.unwatch(wrapped);
            }
            this.#wrappedHandlers?.delete(handler);
            return true;
        }
    }

    /**
     * @type {ModelComponentDefinitions}
     */
    static components = {}
}

export default Model;
