import { Watchable } from './watchable.js';
import { SetMap    } from '../deps/utils.js';

/**
 * @import { AssetLoaderKey, AssetLoaders, AssetLoader, AssetLoaderManagers, AssetDataMap, Stage } from './ecs.js';
 */

/**
 * @template {AssetLoader} [L=any]
 */
export class AssetLoaderManager {
    #loader;

    /**
     * @type {Record<string, { refs: number, abortCtl: AbortController, promise: Promise<unknown> }>}
     */
    #cache = {};

    /**
     * @param {L} loader
     */
    constructor(loader) {
        this.#loader = loader;
    }

    /**
     * @param {AssetReference} reference
     */
    resolve(reference) {
        const { uri } = reference;

        if(!this.#cache[uri]) {
            const abortCtl = new AbortController();
            this.#cache[uri] = { refs: 0, abortCtl, promise: this.#loader(uri, abortCtl.signal) };
        }

        this.#cache[uri].refs++;
        this.#cache[uri].promise.then((asset) => reference.resolve(asset));

        reference.watch('release', () => {
            this.#cache[uri].refs--;
            if(this.#cache[uri].refs === 0) {
                this.#cache[uri].abortCtl.abort();
                delete this.#cache[uri];
            }
        });
    }
}

/**
 * @typedef {{ referer: { entity: string, type: string }, count: number }} AssetReferenceEvent
 * @typedef {{
 *    'reference:add':     AssetReferenceEvent,
 *    'reference:release': AssetReferenceEvent,
 *    [key: `reference:add:${string}`]:               AssetReferenceEvent,
 *    [key: `reference:add:${string}:${string}`]:     AssetReferenceEvent,
 *    [key: `reference:release:${string}`]:           AssetReferenceEvent,
 *    [key: `reference:release:${string}:${string}`]: AssetReferenceEvent,
 * }} AssetReferenceEvents
 */

/**
 * A component reference object used to resolve components that may not exist yet.
 *
 * @template {string} [K = any]
 * @template {AssetDataMap[K]} [D = AssetDataMap[K]]
 * @extends {Watchable<{ abort: void, release: void, resolve: D }>}
 */
export class AssetReference extends Watchable {
    #referer;
    #uri;
    #type;

    #aborted   = false;
    #released  = false;

    /**
     * @type {D|null}
     */
    #data = null;

    /**
     * @param {{ entity: string, type: string }} referer
     * @param {{ uri: string, type: K }} uri
     */
    constructor(referer, { uri, type }) {
        super();

        this.#referer = referer;
        this.#uri     = uri;
        this.#type    = type;
    }

    /**
     * @type {'resolved'|'released'|'aborted'|'pending'}
     */
    get state() {
        if(this.#aborted)  return 'aborted';
        if(this.#released) return 'released';
        if(this.#data)     return 'resolved';
        return 'pending';
    }

    get referer() {
        return this.#referer;
    }

    get uri() {
        return this.#uri;
    }

    get type() {
        return this.#type;
    }

    get data() {
        return this.#data;
    }

    abort() {
        if(!this.#aborted) {
            this.#aborted = true;
            this.notify('abort');
        }
    }

    release() {
        if(!this.#released) {
            if(!this.#data) {
                this.abort();
            }
            this.#released = true;
            this.notify('release');
        }
    }

    /**
     * @param {D} data
     */
    resolve(data) {
        this.#data = data;
        this.notify('resolve', data);
    }

    /**
     * This is useful for doing comparisons against a URI string.
     *
     * reference == '{uri}'
     */
    valueOf() {
        return this.uri;
    }
}

/**
 * @extends {Watchable<AssetReferenceEvents>}
 */
export class AssetReferenceSet extends Watchable {
    #stage;

    /** @type {Set<AssetReference>} */
    #set = new Set();

    /** @type {SetMap<string, AssetReference>} */
    #byType = new SetMap();

    /** @type {SetMap<`${string}:${string}`, AssetReference>} */
    #byAsset = new SetMap();

    [Symbol.iterator]() {
        return this.#set[Symbol.iterator]();
    }

    /**
     * @param {Stage} stage
     */
    constructor(stage) {
        super();
        this.#stage = stage;
    }

    /**
     * @template {string} T
     * @param {{ entity: string, type: string }} referer
     * @param {{ uri: string, type: T }} assetData
     * @return {AssetReference<T>}
     */
    create(referer, { uri, type }) {
        const reference = new AssetReference(referer, { uri, type });

        this.#resolve(reference);

        this.#set.add(reference);
        this.#byType.add(type, reference);
        this.#byAsset.add(`${type}:${uri}`, reference);

        this.notify(`reference:add`,                { referer, count: this.#set.size                        });
        this.notify(`reference:add:${type}`,        { referer, count: this.#byType.count(type)              });
        this.notify(`reference:add:${type}:${uri}`, { referer, count: this.#byAsset.count(`${type}:${uri}`) });

        reference.watch('release', () => this.#release(reference));

        return reference;
    }

    /**
     * @template {string} T
     * @param {AssetReference<T>} reference
     */
    #resolve(reference) {
        if(!assetLoaders[reference.type]) throw new Error(`No asset loader registered for type ${reference.type}`);

        const { referer } = reference;

        const abortCtl = new AbortController();
        const signal   = abortCtl.signal;

        this.#stage.components.watch(`component:delete:${referer.entity}:${referer.type}`, { once: true, signal, handler: () => reference.release() });

        reference.watch('release', { once: true, signal, handler: () => abortCtl.abort() });

        assetLoaders[reference.type].resolve(reference);
    }

    /**
     *
     * @param {AssetReference} reference
     */
    #release(reference) {
        const { uri, type, referer } = reference;

        this.#set.delete(reference);
        this.#byType.delete(type, reference);
        this.#byAsset.delete(`${type}:${uri}`, reference);

        this.notify(`reference:release`,                { referer, count: this.#set.size                        });
        this.notify(`reference:release:${type}`,        { referer, count: this.#byType.count(type)              });
        this.notify(`reference:release:${type}:${uri}`, { referer, count: this.#byAsset.count(`${type}:${uri}`) });
    }

    /**
     * @template {string} K
     * @overload
     * @param {{ uri: string, type: K, predicate?: (reference: AssetReference<K>) => boolean }} options
     * @return {Generator<AssetReference<K>>}
     *
     * @overload
     * @param {{ type: K, predicate?: (reference: AssetReference<K>) => boolean }} options
     * @return {Generator<AssetReference<K>>}
     *
     * @overload
     * @param {{ predicate: (reference: AssetReference) => boolean }} options
     * @return {Generator<AssetReference>}
     *
     * @param {{ uri?: string, type?: string, predicate?: (reference: AssetReference) => boolean }} options
     */
    * #iterateBy({ uri, type, predicate }) {
        let set;

        if(uri && type) {
            set = this.#byAsset.get(`${type}:${uri}`);
        } else if(type) {
            set = this.#byType.get(type);
        } else {
            set = this.#set;
        }

        if(set) {
            for(const reference of set.values()) {
                if(!predicate || predicate(reference)) {
                    yield reference;
                }
            }
        }
    }

    /**
     * @template {string} K
     * @overload
     * @param {{ uri: string, type: K, predicate?: (reference: AssetReference<K>) => boolean }} options
     * @return {Generator<AssetReference<K>>}
     *
     * @overload
     * @param {{ type: K, predicate?: (reference: AssetReference<K>) => boolean }} options
     * @return {Generator<AssetReference<K>>}
     *
     * @overload
     * @param {{ predicate: (reference: AssetReference) => boolean }} options
     * @return {Generator<AssetReference>}
     *
     * @param {{ uri?: string, type?: string, predicate?: (reference: AssetReference) => boolean }} options
     */
    find({ uri, type, predicate }) {
        if(uri && type) {
            return this.#iterateBy({ uri, type, predicate });
        } else if(type) {
            return this.#iterateBy({ type, predicate });
        } else if(predicate) {
            return this.#iterateBy({ predicate });
        }
    }

    /**
     * @template {string} K
     * @overload
     * @param {{ uri: string, type: K, predicate?: (reference: AssetReference<K>) => boolean }} options
     * @return {number}
     *
     * @overload
     * @param {{ type: K, predicate?: (reference: AssetReference<K>) => boolean }} options
     * @return {number}
     *
     * @overload
     * @param {{ predicate: (reference: AssetReference) => boolean }} [options]
     * @return {number}
     *
     * @param {{ uri?: string, type?: string, predicate?: (reference: AssetReference) => boolean }} [options]
     */
    count({ uri, type, predicate } = {}) {
        let count = 0;
        let set;

        if(uri && type) {
            set = this.#byAsset.get(`${type}:${uri}`);
        } else if(type) {
            set = this.#byType.get(type);
        } else {
            set = this.#set;
        }

        if(set) {
            if(!predicate) {
                count = set.size;
            } else {
                for(const reference of set) {
                    if(predicate(reference)) count++;
                }
            }
        }

        return count;
    }

    /**
     * @template {string} K
     * @overload
     * @param {{ uri: string, type: K, predicate?: (reference: AssetReference<K>) => boolean }} options
     * @return {boolean}
     *
     * @overload
     * @param {{ type: K, predicate?: (reference: AssetReference<K>) => boolean }} options
     * @return {boolean}
     *
     * @template {string} K
     * @overload
     * @param {{ predicate: (reference: AssetReference) => boolean }} options
     * @return {boolean}
     *
     * @param {{ uri?: string, type?: string, predicate?: (reference: AssetReference) => boolean }} options
     */
    has({ uri, type, predicate }) {
        let set;

        if(uri && type) {
            set = this.#byAsset.get(`${type}:${uri}`);
        } else if(type) {
            set = this.#byType.get(type);
        } else {
            set = this.#set;
        }

        if(set) {
            if(!predicate) {
                return true;
            } else {
                for(const reference of set) {
                    if(predicate(reference)) return true;
                }
            }
        }

        return false;
    }
}


export const assetLoaders = /** @type {AssetLoaderManagers} */({});

/**
 * @template {AssetLoaderKey} K
 * @template {AssetLoaders[K]} L
 *
 * @overload
 * @param {K} type
 * @param {L} loader
 * @return {void}
 *
 * @overload
 * @param {string} type
 * @param {AssetLoader} loader
 * @return {void}
 *
 * @param {string} type
 * @param {AssetLoader} loader
 */
export function registerLoader(type, loader) {
    if(assetLoaders[type]) return;

    assetLoaders[type] = new AssetLoaderManager(loader);
}

/**
 * @param {string} type
 */
export function unregisterLoader(type) {
    delete assetLoaders[type];
}
