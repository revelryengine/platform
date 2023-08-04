/**
 * @typedef {new (...args: any[]) => {}} Constructable
 *
 * @typedef {(...args: any) => void} WatchHandler
 *
 * @typedef  {object}        WatchOptions
 * @property {WatchHandler}  handler           - A handler function
 * @property {string|symbol} [type]            - The change type to watch for. Defaults to all types.
 * @property {boolean}       [immediate=false] - A boolean to indicate wether notifications should be handled immediately
 * @property {AbortSignal}   [signal]          - An AbortSignal used to stop watching
 * 
 * @typedef  {object}           ParsedWatchOptions
 * @property {WatchHandler}     handler           - A handler function
 * @property {string|symbol}    type               - The change type to watch for. Defaults to all types.
 * @property {boolean}          immediate          - A boolean to indicate wether notifications should be handled immediately
 * @property {AbortSignal|null} signal             - An AbortSignal used to stop watching
 *
 * @typedef  {object} WatchableState
 * @property {Map<string|Symbol, Set<WatchHandler>>} handlers
 * @property {Map<string|Symbol, Set<WatchHandler>>} immediateHandlers
 * @property {Set<string|Symbol>} queued
 * @property {Map<string|Symbol, any[]>} changes
 */

const WATCHABLE = Symbol.for('rev.watchable');
const WILDCARD  = Symbol('wildcard');

/**
 * A watchable is an object that can be watched for changes. This does not rely on property setters or dirty checking as it relies solely on 
 * code that makes changes to explicitly call notify when changes are complete. Notify calls are then batched in the microtask queue.
 * 
 * This class is useful for things such as Float32Arrays that may be changed by gl-matrix or other libraries and we don't want to hinder the performance with proxies.
 * 
 * Use the static mixin method to mix with other classes such as Float32Array.
 */
export class Watchable {
    /** 
     * @type {WatchableState|null}
     */
    #state = null;

    /**
     * Notifies handlers of changes in the next microtask execution.
     * Subsequent calls are batched until the next microtask execution.
     * 
     * Handlers added via with the immediate option will be called immediately instead of batched.
     * 
     * @param {string|symbol} type - The change type to notify for
     * @param {...any} args - Optional arguments to pass to the handler. This is is useful for providing previous values
     */
    notify(type, ...args) {
        if(!this.#state) return;

        const { handlers, immediateHandlers, queued, changes } = this.#state;

        if(type !== WILDCARD) {
            immediateHandlers.get(type)?.forEach((handler) => handler(...args));
            immediateHandlers.get(WILDCARD)?.forEach((handler) => handler(type, ...args));

            if(!queued.has(WILDCARD)) {
                changes.clear();
            }
            if(!changes.has(type)) {
                changes.set(type, args);
            }
            this.notify(WILDCARD, changes);
        }

        if(!queued.has(type) && handlers.has(type)) {
            queued.add(type);
            queueMicrotask(() => {
                handlers.get(type)?.forEach((handler) => handler(...args));
                queued.delete(type);
            });
        }
    }

    /**
     * Watch for change notifications.
     * @param {WatchHandler|WatchOptions} options - The watch handler or an object containing the watch handler and options
     */
    watch(options) {
        const { handler, type, immediate, signal } = Watchable.parseWatchOptions(options);

        this.#state ??= {
            handlers:          new Map(),
            immediateHandlers: new Map(),
            queued:            new Set(),
            changes:           new Map(),
        }

        if(immediate) {
            const set = this.#state.immediateHandlers.get(type) ?? new Set();
            this.#state.immediateHandlers.set(type, set);
            set.add(handler);
        } else {            
            const set = this.#state.handlers.get(type) ?? new Set();
            this.#state.handlers.set(type, set);
            set.add(handler);
        }

        signal?.addEventListener('abort', () => this.unwatch(options));
    }

    /**
     * Stop watching for change notifications.
     *
     * @param {WatchHandler|WatchOptions} options - The watch handler or an object containing the watch handler and options
     */
    unwatch(options) {
        if(!this.#state) return;

        const { handler, type, immediate } = Watchable.parseWatchOptions(options);

        const { handlers, immediateHandlers } = this.#state;

        if(immediate) {
            const immediateSet = immediateHandlers.get(type);
            if(immediateSet) {
                immediateSet.delete(handler);
                if(immediateSet.size === 0) {
                    immediateHandlers.delete(type);
                }
            }
        } else {
            const set = handlers.get(type);
            if(set) {
                set.delete(handler);
                if(set.size === 0) {
                    handlers.delete(type);
                }
            }
        }

        if(!handlers.size && !immediateHandlers.size) {
            this.#state = null;
        }
    }

    /**
     * Use this method to create a new class with the Watchable methods added to the specified class
     * 
     * @template {!Constructable} T
     * 
     * @param {T} superclass - The superclass to add the Watchable methods to
     */
    static mixin(superclass) {
        return class extends superclass {
            /** 
             * @type {WatchableState|null}
             */
            #state = null;

            /**
             * Notifies handlers of changes in the next microtask execution.
             * Subsequent calls are batched until the next microtask execution.
             * 
             * Handlers added via with the immediate option will be called immediately instead of batched.
             * 
             * @param {string|symbol} type - The change type to notify for
             * @param {...any} args - Optional arguments to pass to the handler. This is is useful for providing previous values
             */
            notify(type, ...args) {
                if(!this.#state) return;

                const { handlers, immediateHandlers, queued, changes } = this.#state;

                if(type !== WILDCARD) {
                    immediateHandlers.get(type)?.forEach((handler) => handler(...args));
                    immediateHandlers.get(WILDCARD)?.forEach((handler) => handler(type, ...args));

                    if(!queued.has(WILDCARD)) {
                        changes.clear();
                    }
                    if(!changes.has(type)) {
                        changes.set(type, args);
                    }
                    this.notify(WILDCARD, changes);
                }

                if(!queued.has(type) && handlers.has(type)) {
                    queued.add(type);
                    queueMicrotask(() => {
                        handlers.get(type)?.forEach((handler) => handler(...args));
                        queued.delete(type);
                    });
                }
            }

            /**
             * Watch for change notifications.
             * @param {WatchHandler|WatchOptions} options - The watch handler or an object containing the watch handler and options
             */
            watch(options) {
                const { handler, type, immediate, signal } = Watchable.parseWatchOptions(options);

                this.#state ??= {
                    handlers:          new Map(),
                    immediateHandlers: new Map(),
                    queued:            new Set(),
                    changes:           new Map(),
                }

                if(immediate) {
                    const set = this.#state.immediateHandlers.get(type) ?? new Set();
                    this.#state.immediateHandlers.set(type, set);
                    set.add(handler);
                } else {            
                    const set = this.#state.handlers.get(type) ?? new Set();
                    this.#state.handlers.set(type, set);
                    set.add(handler);
                }

                signal?.addEventListener('abort', () => this.unwatch(options));
            }

            /**
             * Stop watching for change notifications.
             *
             * @param {WatchHandler|WatchOptions} options - The watch handler or an object containing the watch handler and options
             */
            unwatch(options) {
                if(!this.#state) return;

                const { handler, type, immediate } = Watchable.parseWatchOptions(options);

                const { handlers, immediateHandlers } = this.#state;

                if(immediate) {
                    const immediateSet = immediateHandlers.get(type);
                    if(immediateSet) {
                        immediateSet.delete(handler);
                        if(immediateSet.size === 0) {
                            immediateHandlers.delete(type);
                        }
                    }
                } else {
                    const set = handlers.get(type);
                    if(set) {
                        set.delete(handler);
                        if(set.size === 0) {
                            handlers.delete(type);
                        }
                    }
                }

                if(!handlers.size && !immediateHandlers.size) {
                    this.#state = null;
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

    /**
     * @param {WatchOptions|WatchHandler} options
     * @returns {ParsedWatchOptions}
     */
    static parseWatchOptions(options) {
        const { handler, type = WILDCARD, immediate = false, signal = null } = (typeof options === 'object') ? options : { handler: options };
        return { handler, type, immediate, signal };
    }

    static WILDCARD = WILDCARD;

    [WATCHABLE] = true;

}

export default Watchable;