/**
 * A SetMap is a Map of Sets.  It provides a convenient way to ensure that a Map contains a
 * Set for each key as items are added.
 */
export class SetMap extends Map {
    /**
     * Ensures that a Set exists at the specified key and adds an item to the Set.
     *
     * @param {*} key
     * @param {*} item
     */
    add(key, item) {
        return (this.get(key) || this.set(key, new Set()).get(key)).add(item);
    }

    /**
     * Removes the specified item from the Set at the specified key and removes the Set if it is empty.
     *
     * @param {*} key
     * @param {*} item
     * @returns {Boolean} Returns true if the item was present and successfully deleted.
     */
    delete(key, item) {
        const s = this.get(key);
        if (!s) return false;
        try {
            return s.delete(item);
        } finally {
            if (!s.size) super.delete(key);
        }
    }
}

export default SetMap;
