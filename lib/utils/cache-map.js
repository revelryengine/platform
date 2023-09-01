export class CacheMap extends WeakMap {
    #subkeys = new WeakMap();

    get(...keys) {
        if(keys.length > 1) {
            const last = keys.pop();
            
            let collection = this.#subkeys;
            for(const key of keys) {
                collection = collection.get(key) ?? collection.set(key, new WeakMap()).get(key);
            }
            return collection.get(last) ?? collection.set(last, {}).get(last);
        } else {
            return super.get(keys[0]) ?? super.set(keys[0], {}).get(keys[0]);
        }
    }

    set(...keysAndValue) {
        const value = keysAndValue.pop();
        const keys  = keysAndValue;

        if(keys.length > 1) {
            const last = keys.pop();
            
            let collection = this.#subkeys;
            for(const key of keys) {
                collection = collection.get(key) ?? collection.set(key, new WeakMap()).get(key);
            }
            return collection.set(last, value);
        } else {
            return super.set(keys[0], value);
        }
    }
}