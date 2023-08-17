const WATCHABLE = Symbol.for('rev.watchable');
const WILDCARD  = Symbol('wildcard');

/**
 * A watchable is an object that can be watched for changes events. This does not rely on property setters or dirty checking as it relies solely on 
 * code that makes changes to explicitly call notify when changes are complete. EVents are then batched in the microtask queue.
 * 
 * @template {EventMap} [T=EventMap]
 */
export class Watchable {
    [WATCHABLE] = true;

    /** 
     * @type {State<T>|null}
     */
    #state = null;

    /**
     * @template {keyof T} K
     * @template {T[K]} V
     * @overload
     * @param {V extends void ? K : never} type
     * @return {void}
     */
    /**
     * @template {keyof T} K
     * @template {T[K]} V
     * @overload
     * @param {K} type
     * @param {V} data
     * @return {void}
     */
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
     * Watch for all events
     * @overload
     * @param {WildCardHandler<T>} handler
     * @param {undefined} [options]
     * @return {void}
     * 
     * Watch for all events and dispatch immediately.
     * @overload
     * @param {WildcardImmediateOptions<T>} options  
     * @return {void}
     *
     * Watch for all events
     * @overload
     * @param {WildcardOptions<T>} options
     * @return {void}
     *
     * Watch for events of a specific type
     * @template {keyof T} K
     * @overload
     * @param {K} type
     * @param {AnyOptions<T, K>} options  
     * @return {void}
     *
     * @param {AnyType<T>}    anyType
     * @param {AnyOptions<T>} [anyOptions]
     */
    watch(anyType, anyOptions) {
        let options;

        if(typeof anyType === 'function') {
            options = { type: WILDCARD, handler: anyType };
        } else if(typeof anyType === 'object') {
            options = { ...anyType, type: WILDCARD };
        } else if(typeof anyOptions === 'function') {
            options = { type: anyType, handler: anyOptions }
        } else if(typeof anyOptions === 'object') {
            options = { ...anyOptions, type: anyType }
        }
        
        const { type, handler, immediate, signal } = /** @type {OptionsResolved<T>} */(options);

        this.#state ??= {
            handlers: {
                deferred:  new Map(),
                immediate: new Map(),
            },
            queued: new Set(),
            events: new Map(),
        }


        if(immediate) {
            this.#state.handlers.immediate.set(type, this.#state.handlers.immediate.get(type) ?? new Set());
            this.#state.handlers.immediate.get(type)?.add(handler);
        } else {
            this.#state.handlers.deferred.set(type, this.#state.handlers.deferred.get(type) ?? new Set());
            this.#state.handlers.deferred.get(type)?.add(handler);
        }

        signal?.addEventListener('abort', () => {
            if(!this.#state) return;

            const { handlers } = this.#state;

            if(immediate) {
                handlers.immediate.get(type)?.delete(handler);
                if(handlers.immediate.get(type)?.size === 0) handlers.immediate.delete(type);
            } else {
                handlers.deferred.get(type)?.delete(handler);
                if(handlers.deferred.get(type)?.size === 0) handlers.deferred.delete(type);
            }

            if(!handlers.deferred.size && !handlers.immediate.size) {
                this.#state = null;
            }
        });
    }

    /**
     * @overload
     * @param {WildCardHandler<T>} handler
     * @return {void}
     * 
     * @overload
     * @param {WildcardImmediateOptions<T>} options  
     * @return {void}
     *
     * @overload
     * @param {WildcardOptions<T>} options
     * @return {void}
     *
     * @template {keyof T} K
     * @overload
     * @param {K} type
     * @param {AnyOptions<T, K>} options  
     * @return {void}
     * 
     * @param {AnyType<T>}    anyType
     * @param {AnyOptions<T>} [anyOptions]
     */
    unwatch(anyType, anyOptions) {
        if(!this.#state) return;

        let options;
        if(typeof anyType === 'function') {
            options = { type: WILDCARD, handler: anyType };
        } else if(typeof anyType === 'object') {
            options = { ...anyType, type: WILDCARD };
        } else if(typeof anyOptions === 'function') {
            options = { type: anyType, handler: anyOptions }
        } else if(typeof anyOptions === 'object') {
            options = { ...anyOptions, type: anyType }
        }

        const { type, handler, immediate } = /** @type {OptionsResolved<T>} */(options);

        const { handlers } = this.#state;

        if(immediate) {
            handlers.immediate.get(type)?.delete(handler);
            if(handlers.immediate.get(type)?.size === 0) handlers.immediate.delete(type);
        } else {
            handlers.deferred.get(type)?.delete(handler);
            if(handlers.deferred.get(type)?.size === 0) handlers.deferred.delete(type);
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
     * @param {AbortSignal|null} [signal] - An AbortSignal used to stop watching
     * @return {Promise<T[K]>}
     */
    waitFor(type, signal) {
        return new Promise((resolve, reject) => {
            const abortCtl = new AbortController();

            signal?.addEventListener('abort', () => {
                abortCtl.abort();
                reject('aborted');
            });
            
            this.watch(type, { signal: abortCtl.signal, handler: (data) => {
                resolve(data);
                abortCtl.abort();
            } });
        });
    }
    
    /**
     * @param {any} input
     * @returns {input is Watchable}
     */
    static isWatchable(input) {
        return input?.[WATCHABLE] !== undefined;
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
     * @template {EventMap} E
     * @param {B} base
     * @param {E} [_]
     */
    static mixin(base, _) {
        return class ExtendedWatchable extends  base {
            [WATCHABLE] = true;
    
            #watchable = /** @type {Watchable<E>} */(new Watchable());
    
            notify  = this.#watchable.notify.bind(this.#watchable);
            watch   = this.#watchable.watch.bind(this.#watchable);
            unwatch = this.#watchable.unwatch.bind(this.#watchable);
            waitFor = this.#watchable.waitFor.bind(this.#watchable);
        };
    }
}

export default Watchable;

/**
 * @typedef {Record<string, any>} EventMap
 */
/**
 * @template {EventMap} T
 * @template {keyof T} K
 * @typedef {(data: T[K]) => void} Handler
 */
/**
 * @template {EventMap} T
 * @typedef {(data: Map<keyof T, T[keyof T]>) => void} WildCardHandler
 */
/**
 * @template {EventMap} T
 * @typedef {(type: keyof T, data: T[keyof T]) => void} WildCardImmediateHandler
 */
/**
 * @template {EventMap} [T = EventMap]
 * @typedef {{
 *   handlers: {
 *       deferred:  Map<keyof T|symbol, Set<(...args: any[]) => void> >;
 *       immediate: Map<keyof T|symbol, Set<(...args: any[]) => void> >;
 *   }
 *   queued:  Set<keyof T|symbol>;
 *   events: Map<keyof T, T[keyof T] | void>;
 * }} State
 */
/**
 * @template {EventMap} T
 * @template {keyof T} [K = keyof T]
 * @typedef {{
 *     handler:    Handler<T, K>;
 *     immediate?: boolean;
 *     signal?:    AbortSignal;
 * }} Options
 */
/**
 * @template {EventMap} T
 * @typedef {{
 *     handler:    WildCardHandler<T>;
 *     immediate?: false;
 *     signal?:    AbortSignal;
 * }} WildcardOptions
 */
/**
 * @template {EventMap} T
 * @typedef {{
 *     handler:    WildCardImmediateHandler<T>;
 *     immediate: true;
 *     signal?:    AbortSignal;
 * }} WildcardImmediateOptions
 */
/**
 * @template {EventMap} [T = EventMap]
 * @typedef {keyof T | WildCardHandler<T> | WildcardOptions<T> | WildcardImmediateOptions<T>} AnyType
 */
/**
 * @template {EventMap} [T = EventMap]
 * @template {keyof T} [K = keyof T]
 * @typedef {Handler<T, K> | Options<T, K>} AnyOptions
 */
/**
 * @template {EventMap} [T = EventMap]
 * @typedef {{
 *     immediate?: boolean;
 *     signal?: AbortSignal;
 * } & ({
 *     type: symbol;
 *     handler:WildCardImmediateHandler<T>;
 * } | {
 *     type: symbol;
 *     handler: WildCardHandler<T>;
 * } | {
 *     type: keyof T;
 *     handler: Handler<T, keyof T>;
 * })} OptionsResolved
 */
