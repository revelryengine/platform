type WatchableEventMap = Record<string, unknown>;

type WatchHandler<T extends WatchableEventMap, K extends keyof T & string>   = (data: T[K]) => void;
type WatchableWildCardDeferredHandler<T extends WatchableEventMap>  = (data: Map<keyof T & string, T[keyof T & string]>) => void;
type WatchableWildCardImmediateHandler<T extends WatchableEventMap> = (type: keyof T & string, data: T[keyof T & string]) => void;

type WatchOptions<T extends WatchableEventMap, K extends keyof T & string = keyof T & string> = {
    handler:    WatchHandler<T, K>;
    deferred?:  boolean;
    once?:      boolean;
    signal?:    AbortSignal;
}

type WatchableWildcardImmediateOptions<T extends WatchableEventMap> = {
    handler:    WatchableWildCardImmediateHandler<T>;
    deferred?:  false;
    once?:      boolean;
    signal?:    AbortSignal;
}

type WatchableWildcardDeferredOptions<T extends WatchableEventMap> = {
    handler:    WatchableWildCardDeferredHandler<T>;
    deferred:   true;
    once?:      boolean;
    signal?:    AbortSignal;
}

type WatchableAnyType<T extends WatchableEventMap = WatchableEventMap> = (keyof T & string ) | WatchableWildCardImmediateHandler<T> | WatchableWildcardDeferredOptions<T> | WatchableWildcardImmediateOptions<T>;
type WatchableAnyOptions<T extends WatchableEventMap = WatchableEventMap, K extends keyof T & string = keyof T & string> = WatchHandler<T, K> | WatchOptions<T, K>;
type WatchableOptionsResolved<T extends WatchableEventMap = WatchableEventMap> = {
    deferred?:  boolean;
    once?:      boolean;
    signal?:    AbortSignal;
} & ({
    type: undefined;
    handler: WatchableWildCardImmediateHandler<T>;
} | {
    type: undefined;
    handler: WatchableWildCardDeferredHandler<T>;
} | {
    type: keyof T & string;
    handler: WatchHandler<T, keyof T & string>;
})


/**
 * A watchable is an object that can be watched for changes events. This does not rely on property setters or dirty checking as it relies solely on
 * code that makes changes to explicitly call notify when changes are complete. Events are then batched in the microtask queue.
 */
export class Watchable<E extends WatchableEventMap = WatchableEventMap, T extends WatchableEventMap = E & WatchableEventMap> {
    /**
     * Notifies handlers of events in the next microtask execution.
     * Subsequent calls are batched until the next microtask execution.
     *
     * Handlers added with the immediate option will be called immediately instead of batched.
     */
    notify<K extends keyof T & string>(type: T[K] extends void ? K : never): void;
    notify<K extends keyof T & string>(type: K, data: T[K]): void;
    notify(type: string, data?: unknown): void;

    /**
     * Watch for all events
     */
    watch(handler: WatchableWildCardImmediateHandler<T>): void;
    /**
     * Watch for all events
     */
    watch(options: WatchableWildcardDeferredOptions<T>): void;
    /**
     * Watch for all events and dispatch immediately.
     */
    watch(options: WatchableWildcardImmediateOptions<T>): void;
    /**
     * Watch for events of a specific type
     */
    watch<K extends keyof T & string>(type: K, options: WatchableAnyOptions<T, K>): void;

    /**
     * Remove watch handler.
     */
    unwatch(handler: WatchableWildCardImmediateHandler<T>): void;
    /**
     * Remove watch handler.
     */
    unwatch(options: WatchableWildcardDeferredOptions<T>): void;
    /**
     * Remove watch handler.
     */
    unwatch(options: WatchableWildcardImmediateOptions<T>): void;
    /**
     * Remove watch handler.
     */
    unwatch<K extends keyof T & string>(type: K, options: WatchableAnyOptions<T, K>): void;

    /**
     * Async function to wait for a speficic type to be called.
     * @example ```const data = await watchable.waitFor('example');```
     */
    waitFor<K extends keyof T & string>(type: K, signal?: AbortSignal ): Promise<T[K]>;

    /**
     * Returns true if any watchers are watching for this specific type or a wildcard.
     */
    isWatched<K extends keyof T & string>(type: K): boolean;

    /**
     * Returns true if any notification is in the queue for this specific type.
     */
    isQueued<K extends keyof T & string>(type: K): boolean;

    /**
     * Returns true if input is a watchable object
     */
    static isWatchable(instance: unknown): instance is Watchable;

    static [Symbol.hasInstance](instance: unknown): instance is Watchable;

    /**
     * This is useful for things such as Float32Arrays that may be changed by gl-matrix or other libraries and we don't want to hinder the performance with proxies.
     *
     * Developer's notes: The event map is passed as an empty param because there is no way to explicitly specific generic type parameters to functions.
     * See [Issue 27387](https://github.com/microsoft/TypeScript/issues/27387)
     *
     * @example
     * ```js
     * class ExtendedFloat extends Watchable.mixin(Float32Array, /\*\* \@type {{ a: string, b: number }} \*\/ ({})) { }
     * ```
     */
    static mixin<B extends { new (...args: unknown[]): unknown }, E extends WatchableEventMap>(base: B, _ ?: E): {
        new (...args: unknown[]): Watchable<E>;
        prototype: Watchable<E>;
    } & B;
}

