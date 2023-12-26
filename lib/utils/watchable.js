import { WeakCache } from './weak-cache.js';

/** @type {unique symbol} */
const WATCHABLE = Symbol.for('rev.watchable');
/** @type {unique symbol} */
const WILDCARD  = Symbol.for('rev.wildcard');

/**
 * @template {import('./watchable.d.ts').WatchableEventMap} [T=import('./watchable.d.ts').WatchableEventMap]
 * @typedef {import('./watchable.d.ts').Watchable<T>} WatchableClass
 */


/**
 * @template {import('./watchable.d.ts').WatchableEventMap} [T = import('./watchable.d.ts').WatchableEventMap]
 * @typedef {{
*   handlers: {
    *       immediate: Map<keyof T|symbol, Set<(...args: any[]) => void> >;
    *       deferred:  Map<keyof T|symbol, Set<(...args: any[]) => void> >;
    *       once:      WeakCache<{
    *          immediate?: Map<keyof T|symbol, (...args: any[]) => void>;
    *          deferred?:  Map<keyof T|symbol, (...args: any[]) => void>;
    *       }>;
    *   };
    *   queued: Set<keyof T|symbol>;
    *   events: Map<keyof T, T[keyof T] | void>;
    * }} WatchableState
    */

/**
 * A watchable is an object that can be watched for changes events. This does not rely on property setters or dirty checking as it relies solely on
 * code that makes changes to explicitly call notify when changes are complete. EVents are then batched in the microtask queue.
 *
 * @template {import('./watchable.d.ts').WatchableEventMap} [T=import('./watchable.d.ts').WatchableEventMap]
 *
 * @implements {WatchableClass<T>}
 */
export class Watchable {
    // @ts-ignore ts is wrong about this, it is a unique symbol
    [WATCHABLE] = true;

    /** @type {WatchableState<T>|null} */
    #state = null;

    /**
     * Notifies handlers of events in the next microtask execution.
     * Subsequent calls are batched until the next microtask execution.
     *
     * Handlers added with the immediate option will be called immediately instead of batched.
     * @template {keyof T} K
     * @template {T[K]} V
     * @param {K} type
     * @param {V} [data]
     */
    notify(type, data) {
        if(!this.#state) return;

        const { handlers, queued, events } = this.#state;

        handlers.immediate.get(type)?.forEach((handler) => handler(data));

        if(!queued.has(type) && handlers.deferred.has(type)) {
            queued.add(type);
            queueMicrotask(() => {
                handlers.deferred.get(type)?.forEach((handler) => handler(data));
                queued.delete(type);
            });
        }

        handlers.immediate.get(WILDCARD)?.forEach((handler) => handler(type, data));

        if(!queued.has(WILDCARD) && handlers.deferred.has(WILDCARD)) {
            events.clear();
            queued.add(WILDCARD);
            queueMicrotask(() => {
                handlers.deferred.get(WILDCARD)?.forEach((handler) => handler(events));
                queued.delete(WILDCARD);
            });
        }

        if(!events.has(type)) {
            events.set(type, data);
        }
    }

    /**
     * @param {import('./watchable.d.ts').WatchableAnyType<T>}    anyType
     * @param {import('./watchable.d.ts').WatchableAnyOptions<T>} [anyOptions]
     */
    watch(anyType, anyOptions) {
        let options;

        if(typeof anyType === 'function') {
            options = { type: WILDCARD, handler: anyType };
        } else if(typeof anyType === 'object') {
            options = { type: WILDCARD, ...anyType };
        } else if(typeof anyOptions === 'function') {
            options = { type: anyType, handler: anyOptions }
        } else if(typeof anyOptions === 'object') {
            options = { type: anyType, ...anyOptions }
        }

        const { type, handler, deferred, signal, once } = /** @type {import('./watchable.d.ts').WatchableOptionsResolved<T>} */(options);

        this.#state ??= {
            handlers: {
                deferred:  new Map(),
                immediate: new Map(),
                once:   new WeakCache(),
            },
            queued: new Set(),
            events: new Map(),
        }

        const wrappedHandler = once ? this.#createOnceHandler(type, !!deferred, handler) : handler;

        if(deferred) {
            this.#state.handlers.deferred.set(type, this.#state.handlers.deferred.get(type) ?? new Set());
            this.#state.handlers.deferred.get(type)?.add(wrappedHandler);
        } else {
            this.#state.handlers.immediate.set(type, this.#state.handlers.immediate.get(type) ?? new Set());
            this.#state.handlers.immediate.get(type)?.add(wrappedHandler);
        }

        signal?.addEventListener('abort', () => {
            if(!this.#state) return;

            const { handlers } = this.#state;

            if(deferred) {
                handlers.deferred.get(type)?.delete(wrappedHandler);
                if(handlers.deferred.get(type)?.size === 0) handlers.deferred.delete(type);
            } else {
                handlers.immediate.get(type)?.delete(wrappedHandler);
                if(handlers.immediate.get(type)?.size === 0) handlers.immediate.delete(type);
            }

            if(!handlers.deferred.size && !handlers.immediate.size) {
                this.#state = null;
            }
        });
    }

    /**
     * @param {import('./watchable.d.ts').WatchableAnyType<T>}    anyType
     * @param {import('./watchable.d.ts').WatchableAnyOptions<T>} [anyOptions]
     */
    unwatch(anyType, anyOptions) {
        if(!this.#state) return;

        let options;
        if(typeof anyType === 'function') {
            options = { type: WILDCARD, handler: anyType };
        } else if(typeof anyType === 'object') {
            options = { type: WILDCARD, ...anyType };
        } else if(typeof anyOptions === 'function') {
            options = { type: anyType, handler: anyOptions }
        } else if(typeof anyOptions === 'object') {
            options = { type: anyType, ...anyOptions }
        }

        const { type, handler, deferred } = /** @type {import('./watchable.d.ts').WatchableOptionsResolved<T>} */(options);

        const { handlers } = this.#state;

        const wrappedHandler = this.#getOnceHandler(type, !!deferred, handler) ?? handler;

        if(deferred) {
            handlers.deferred.get(type)?.delete(wrappedHandler);
            if(handlers.deferred.get(type)?.size === 0) handlers.deferred.delete(type);
        } else {
            handlers.immediate.get(type)?.delete(wrappedHandler);
            if(handlers.immediate.get(type)?.size === 0) handlers.immediate.delete(type);
        }

        if(!handlers.deferred.size && !handlers.immediate.size) {
            this.#state = null;
        }
    }

    /**
     * Async function to wait for a speficic type to be called.
     * @example ```const data = await watchable.waitFor('example');```
     * @template {keyof T} K
     * @param {K} type - The change type to watch for. Defaults to all types.
     * @param {AbortSignal} [signal] - An AbortSignal used to stop watching
     * @return {Promise<T[K]>}
     */
    waitFor(type, signal) {
        return new Promise((resolve, reject) => {
            signal?.addEventListener('abort', () => {
                reject('aborted');
            });

            this.watch(type, { signal, once: true, handler: /** @type {import('./watchable.d.ts').WatchHandler<T, keyof T>} */(resolve) });
        });
    }

    /**
     * @param {any} instance
     * @return {instance is Watchable}
     */
    static isWatchable(instance) {
        return instance?.[WATCHABLE] !== undefined;
    }

    /**
     * @param {any} instance
     * @return {instance is Watchable}
     */
    static [Symbol.hasInstance](instance) {
        return instance?.[WATCHABLE] !== undefined;
    }

    /**
     * This is useful for things such as Float32Arrays that may be changed by gl-matrix or other libraries and we don't want to hinder the performance with proxies.
     *
     * Developer's notes: The event map is passed as an empty param because there is no way to explicitly specific generic type parameters to functions. @see https://github.com/microsoft/TypeScript/issues/27387
     *
     * @example
     * ```js
     * class ExtendedFloat extends Watchable.mixin(Float32Array, /\*\* \@type {{ a: string, b: number }} \*\/ ({})) { }
     * ```
     *
     * @template {{ new (...args: any[]): any }} B
     * @template {import('./watchable.d.ts').WatchableEventMap} E
     * @param {B} base
     * @param {E} [_]
     */
    static mixin(base, _) {
        /**
         * @satisfies {Watchable<E>}
         */
        return class ExtendedWatchable extends base {
            // @ts-ignore ts is wrong about this, it is a unique symbol
            [WATCHABLE] = true;

            #watchable = /** @type {Watchable<E>} */(new Watchable());

            notify  = this.#watchable.notify.bind(this.#watchable);
            watch   = this.#watchable.watch.bind(this.#watchable);
            unwatch = this.#watchable.unwatch.bind(this.#watchable);
            waitFor = this.#watchable.waitFor.bind(this.#watchable);
        };
    }

    /**
     * @template {(...args: any[]) => void } U
     * @param {keyof T | typeof WILDCARD} type
     * @param {boolean} deferred
     * @param {U} handler
     */
    #createOnceHandler(type, deferred, handler) {
        /** @type {U} */
        let wrapped;

        const cache = /** @type {WatchableState<T>} */(this.#state).handlers.once.ensure(handler, () => ({}));
        if(deferred) {
            wrapped = /** @type {U} */((...args) => {
                handler(...args);
                if(typeof type === 'symbol') {
                    this.unwatch({ deferred, handler });
                } else {
                    this.unwatch(type, { deferred, handler });
                }
            })
            cache.deferred ??= new Map();
            cache.deferred.set(type, wrapped);
        } else {
            wrapped = /** @type {U} */((...args) => {
                handler(...args);
                if(typeof type === 'symbol') {
                    this.unwatch({ handler: wrapped });
                } else {
                    this.unwatch(type, { handler: wrapped });
                }
            })
            cache.immediate ??= new Map();
            cache.immediate.set(type, wrapped);
        }

        return wrapped;
    }

    /**
     * @template {(...args: any[]) => void } U
     * @param {keyof T | typeof WILDCARD} type
     * @param {boolean} deferred
     * @param {U} handler
     */
    #getOnceHandler(type, deferred, handler) {
        const cache = /** @type {WatchableState<T>} */(this.#state).handlers.once.get(handler);
        if(cache) {
            if(deferred) {
                return cache.deferred?.get(type);
            } else {
                return cache.immediate?.get(type);
            }
        }
    }
}
