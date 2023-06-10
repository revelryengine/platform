import { Watchable } from 'revelryengine/ecs/lib/utils/watchable.js';

export class Asset extends Watchable {
    static cache = new Map();

    #path;
    #loaded;
    
    constructor(path) {
        super();
        this.set(path);
    }

    set(path) {
        const oldPath = this.#path;
        const pathString = path.toString();

        if(pathString !== this.#path) {
            this.unload();
            
            this.#path   = pathString;
            this.#loaded = this.#load().then(() => this.notify(oldPath));
        }
    }

    get path() {
        return this.#path;
    }

    get data() {
        return Asset.cache.get(this.#path)?.data;
    }

    get loaded() {
        return this.#loaded;
    }

    async load(signal) {
        return fetch(new URL(import.meta.resolve(this.path)), { signal })
    }

    /**
     * It will decrement the ref count for this path and if ref count is 0 the asset will be removed from the cache.
     */
    unload() {
        const assetRef = Asset.cache.get(this.#path);
        if(!assetRef) return;

        assetRef.refs--;
        if(assetRef.ref === 0) {
            assetRef.abortCtl?.abort();
            Asset.cache.delete(key);
        }
    }

    async #load() {
        if(!this.#path) return;

        const assetRef = Asset.cache.get(this.#path) ||  Asset.cache.set(this.#path, { refs: 0 }).get(this.#path);
        
        assetRef.refs++;

        if(!assetRef.data && !assetRef.pending) {
            assetRef.abortCtl = new AbortController();
            assetRef.pending  = this.load(assetRef.abortCtl.signal);
            assetRef.data     = await assetRef.pending;

            delete assetRef.pending;
            delete assetRef.abortCtl;
        }

        return assetRef.data || assetRef.pending;
    }

    toString() {
        return this.path;
    }

    toJSON() {
        return this.path;
    }

    clone() {
        return this.path;
    }
}