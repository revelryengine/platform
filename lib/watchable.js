export class Watchable {
    #watchers = new Set();
    notify() {
        this.#watchers.forEach((watcher) => watcher(this));
    }

    watch(watcher) {
        this.#watchers.add(watcher);
        return watcher;
    }

    unwatch(watcher) {
        this.#watchers.delete(watcher);
    }

    static mixin(cls) {
        return class Watchable extends cls {
            constructor() {
                super(...arguments);
            }

            #watchers = new Set();
            notify() {
                this.#watchers.forEach((watcher) => watcher(this));
            }

            watch(watcher) {
                this.#watchers.add(watcher);
                return watcher;
            }

            unwatch(watcher) {
                this.#watchers.delete(watcher);
            }
        }
    }
}

export default Watchable;