/**
 * A watchable is an object that can be watched for changes. This does not rely on property setters or dirty checking as it relies solely on 
 * code that makes changes to explicitly call notify when changes are complete. Notify calls are then batched in the microtask queue.
 * 
 * This class is useful for things such as Float32Arrays that may be changed by gl-matrix and we don't want to hinder the performance with proxies.
 * 
 * Use the static mixin method to mix with other classes such as Float32Array.
 */
export class Watchable {
    #watchers = null;
    #queued = false;

    /**
     * Notifies watchers of changes in the next microtask execution.
     * Subsequent calls are batched until the next microtask execution.
     * 
     * @param {*} [oldValue] - An optional value to pass to the watcher handler as the old value
     */
    notify(oldValue) {
        if(!this.#queued && this.#watchers) {
            this.#queued = true;
            queueMicrotask(() => {
                this.#queued = false;
                this.#watchers?.forEach((watcher) => watcher(this, oldValue));
            });
        }
    }

    /**
     * Watch for change notifications.
     *
     * @param {Function} watcher - A handler to call when changes are notified
     * @return {Function} - Returns original handler function
     */
    watch(watcher) {
        this.#watchers ??= new Set();
        this.#watchers.add(watcher);
        return watcher;
    }

    /**
     * Stop watching for change notifications.
     *
     * @param {Function} watcher - The watch handler that was used in the original watch call
     */
    unwatch(watcher) {
        this.#watchers?.delete(watcher);
        if(this.#watchers?.size === 0) {
            this.#watchers = null;
        }
    }

    /**
     * Use this method to create a new class with the Watchable methods added to the specified class
     * 
     * @param {Function} superclass - The superclass to add the Watchable methods to
     * @return {Function} - A Watchable extension of the specified class
     */
    static mixin(superclass) {
        return class Watchable extends superclass {
            #watchers = null;
            #queued = false;

            /**
             * Notifies watchers of changes in the next microtask execution.
             * Subsequent calls are batched until the next microtask execution.
             * 
             * @param {*} [oldValue] - An optional value to pass to the watcher handler as the old value
             */
            notify(oldValue) {
                if(!this.#queued && this.#watchers) {
                    this.#queued = true;
                    queueMicrotask(() => {
                        this.#queued = false;
                        this.#watchers?.forEach((watcher) => watcher(this, oldValue));
                    });
                }
            }

            /**
             * Watch for change notifications.
             *
             * @param {Function} watcher - A handler to call when changes are notified
             * @return {Function} - Returns original handler function
             */
            watch(watcher) {
                this.#watchers ??= new Set();
                this.#watchers.add(watcher);
                return watcher;
            }

            /**
             * Stop watching for change notifications.
             *
             * @param {Function} watcher - The watch handler that was used in the original watch call
             */
            unwatch(watcher) {
                this.#watchers?.delete(watcher);
                if(this.#watchers?.size === 0) {
                    this.#watchers = null;
                }
            }
        }
    }
}

export default Watchable;