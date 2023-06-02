/** @typedef {new (...args: any[]) => any} Constructor */

/** 
 * @typedef  WatchableInterface
 * @property {(oldValue?: any) => void} notify
 * @property {(watcher: WatchHandler|Watcher) => WatchResult} watch
 * @property {(handler: WatchHandler) => void} unwatch
 */

/**
 * @callback WatchHandler
 * @param {WatchableInterface} watchable
 * @param {any} [oldValue]
 */

/**
 * @typedef  {Object}       Watcher
 * @property {WatchHandler} handler           - A handler function
 * @property {Boolean}      [immediate=false] - A boolean to indicate wether notifications should be handled immediately
 */

/**
 * @typedef  {Object}       WatchResult - An object containing an unwatch method, the original handler function, and immediate boolean
 * @property {WatchHandler} handler     - Original handler function
 * @property {Boolean}      immediate   - A boolean to indicate wether notifications would be handled immediately
 * @property {() => void}   unwatch     - a method to remove the original watch handler 
 */


const WATCHABLE = Symbol.for('rev.watchable');

/**
 * A watchable is an object that can be watched for changes. This does not rely on property setters or dirty checking as it relies solely on 
 * code that makes changes to explicitly call notify when changes are complete. Notify calls are then batched in the microtask queue.
 * 
 * This class is useful for things such as Float32Arrays that may be changed by gl-matrix and we don't want to hinder the performance with proxies.
 * 
 * Use the static mixin method to mix with other classes such as Float32Array.
 */
export class Watchable {
    /** @type {Set<WatchHandler>|Null} */
    #handlers = null;

    /** @type {Set<WatchHandler>|Null} */
    #immediateHandlers = null;

    #queued = false;

    /**
     * Notifies handlers of changes in the next microtask execution.
     * Subsequent calls are batched until the next microtask execution.
     * 
     * Handlers added via the watchImmediate method will be called immediately instead of batched.
     * 
     * @param {any} [oldValue] - An optional value to pass to the handler handler as the old value
     */
    notify(oldValue) {
        this.#immediateHandlers?.forEach((handler) => handler(this, oldValue));

        if(!this.#queued && this.#handlers) {
            this.#queued = true;
            queueMicrotask(() => {
                this.#queued = false;
                this.#handlers?.forEach((handler) => handler(this, oldValue));
            });
        }
    }

    /**
     * Watch for  change notifications.
     * 
     * @param {WatchHandler|Watcher} watcher - The watch handler or an object containing the watch handler and options
     * @return {WatchResult}
     */
    watch(watcher) {
        const handler   = typeof watcher === 'object' ? watcher.handler : watcher;
        const immediate = typeof watcher === 'object' ? !!watcher.immediate : false;

        if(immediate) {
            this.#immediateHandlers ??= new Set();
            this.#immediateHandlers.add(handler);
        } else {
            this.#handlers ??= new Set();
            this.#handlers.add(handler);
        }
        
        return { handler, immediate, unwatch: () => this.unwatch(handler) };
    }

    /**
     * Stop watching for change notifications.
     *
     * @param {WatchHandler} handler - The watch handler that was used in the original watch call
     */
    unwatch(handler) {
        this.#immediateHandlers?.delete(handler);
        if(this.#immediateHandlers?.size === 0) {
            this.#immediateHandlers = null;
        }

        this.#handlers?.delete(handler);
        if(this.#handlers?.size === 0) {
            this.#handlers = null;
        }
    }

    /**
     * Use this method to create a new class with the Watchable methods added to the specified class
     * 
     * @template {!Constructor} T
     * 
     * @param {T} superclass - The superclass to add the Watchable methods to
     * @return {Constructor} - A Watchable extension of the specified class
     */
    static mixin(superclass) {
        return class Watchable extends superclass {
            /** @type {Set<WatchHandler>|Null} */
            #handlers = null;

            /** @type {Set<WatchHandler>|Null} */
            #immediateHandlers = null;

            #queued = false;

            /**
             * Notifies handlers of changes in the next microtask execution.
             * Subsequent calls are batched until the next microtask execution.
             * 
             * Handlers added via the watchImmediate method will be called immediately instead of batched.
             * 
             * @param {any} [oldValue] - An optional value to pass to the handler handler as the old value
             */
            notify(oldValue) {
                this.#immediateHandlers?.forEach((handler) => handler(this, oldValue));
                
                if(!this.#queued && this.#handlers) {
                    this.#queued = true;
                    queueMicrotask(() => {
                        this.#queued = false;
                        this.#handlers?.forEach((handler) => handler(this, oldValue));
                    });
                }
            }

            /**
             * Watch for  change notifications.
             * 
             * @param {WatchHandler|Watcher} watcher - The watch handler or an object containing the watch handler and options
             * @return {WatchResult}
             */
            watch(watcher) {
                const handler   = typeof watcher === 'object' ? watcher.handler : watcher;
                const immediate = typeof watcher === 'object' ? !!watcher.immediate : false;
        
                if(immediate) {
                    this.#immediateHandlers ??= new Set();
                    this.#immediateHandlers.add(handler);
                } else {
                    this.#handlers ??= new Set();
                    this.#handlers.add(handler);
                }
                
                return { handler, immediate, unwatch: () => this.unwatch(handler) };
            }

            /**
            * Stop watching for change notifications.
            *
            * @param {WatchHandler} handler - The watch handler that was used in the original watch call
            */
            unwatch(handler) {
                this.#immediateHandlers?.delete(handler);
                if(this.#immediateHandlers?.size === 0) {
                    this.#immediateHandlers = null;
                }

                this.#handlers?.delete(handler);
                if(this.#handlers?.size === 0) {
                    this.#handlers = null;
                }
            }

            [WATCHABLE] = true;
        }
    }
    
    /**
     * @param {any} input
     * @returns {input is Watchable}
     */
    static isWatchable(input) {
        return input?.[WATCHABLE] !== undefined;
    }

    [WATCHABLE] = true;
}

export default Watchable;