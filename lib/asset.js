/// <reference types="./asset.d.ts" />

import { Watchable } from 'revelryengine/ecs/lib/utils/watchable.js';
import { CacheMap  } from './utils/cache-map.js';

/**
 * @typedef {import('revelryengine/ecs/lib/utils/watchable.js').EventMap} EventMap
 */

/**
 * @typedef {import('./asset.d.ts').Asset} AssetClass
 */

/** 
 * @extends {Watchable<{ 'instance:create': unknown }>}
 * @implements {AssetClass}
 */
export class Asset extends Watchable {
    static cache = new CacheMap();

    /** @type {string} */
    #path;

    /** @type {unknown|undefined} */
    #instance;

    /** @type {Promise<void>} */
    #loaded;
    
    /**
     * @param {{ path: string | URL }} value 
     */
    constructor(value) {
        super();
        this.#path = value.path.toString();
        this.#loaded = this.#load();
    }


    /**
     * @param {{ path: string | URL }} value 
     */
    set({ path }) {
        path = path.toString();

        if(path !== this.#path) {
            this.#path   = path;
            this.#loaded = this.#load();
        }
    }

    get path() {  
        return this.#path;
    }

    get data() {
        return this.#getFromCache()?.data;
    }

    get loaded() {
        return this.#loaded;
    }

    get instance() {
        return this.#instance;
    }
    

    /**
     * @param {AbortSignal} [signal] 
     */
    async fetch(signal) {
        return fetch(new URL(import.meta.resolve(this.path)), { signal });
    }
    
    /**
     * @param {AbortSignal} [signal]
     */
    async load(signal) {
        return this.fetch(signal);
    }


    /**
     * It will decrement the ref count for this path and if ref count is 0 the asset will be removed from the cache.
     */
    unload() {
        const assetRef = this.#getFromCache();
        if(!assetRef?.refs) return;

        assetRef.refs--;
        if(assetRef.refs === 0) {
            assetRef.abortCtl?.abort();
            this.#deleteFromCache();
        }
    }

    /**
     * @return {{ refs: number, abortCtl?: AbortController, pending?: Promise<any>, data?: any }}
     */
    #getFromCache() {
        const cache = Asset.cache.get(this.load);
        cache.assets ??= new Map();
        return cache.assets.get(this.#path) ?? cache.assets.set(this.#path, { refs: 0 }).get(this.#path);
    }

    #deleteFromCache() {
        const cache = Asset.cache.get(this.load);
        cache?.assets.delete(this.#path);
    }

    async #load() {
        if(!this.#path) return;

        const assetRef = this.#getFromCache();
        
        assetRef.refs++;

        if(!assetRef.data && !assetRef.pending) {
            assetRef.abortCtl = new AbortController();
            assetRef.pending  = this.load(assetRef.abortCtl.signal);
            assetRef.data     = await assetRef.pending;

            delete assetRef.pending;
            delete assetRef.abortCtl;
        }

        await (assetRef.data || assetRef.pending);

        const previous = this.#instance;

        if(previous) this.unload();  

        this.#instance = await this.createInstance();

        this.notify('instance:create', previous);

        return assetRef.data || assetRef.pending;
    }


    toJSON() {
        return { path: this.path };
    }

    clone() {
        return { path: this.path };
    }

    /**
     * Create a single instance for this asset. Will be called after the asset data is loaded from cache. 
     */
    async createInstance() {
        return {}
    }
}