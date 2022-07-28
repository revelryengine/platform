export class AssetManager {
    assets = new Map();

    pending = 0;

    constructor(loader) {
        this.loader = loader;
    }

    /**
     * Loads an asset using the specified key. It will update the ref count for this key.
     * @param {*} key
     */
    async load(key, ...args) {
        const assetRef = this.assets.get(key) || { refs: 0 };
        
        assetRef.refs++;
        
        this.assets.set(key, assetRef);

        if(!assetRef.asset && !assetRef.pending) {
            this.pending++;

            assetRef.abortCtl = new AbortController();
            assetRef.pending  = this.loader(key, ...args, assetRef.abortCtl);
            assetRef.asset    = await assetRef.pending;

            delete assetRef.pending;
            delete assetRef.abortCtl;

            this.pending--;
        }

        return assetRef.asset || assetRef.pending;
    }

    /**
     * It will decrement the ref count for this key and if ref count is 0 the asset will be removed.
     * @param {*} key
     */
    unload(key) {
        const assetRef = this.assets.get(key);
        if(!assetRef) return;

        if(assetRef.pending) assetRef.abortCtl.abort();

        assetRef.refs--;
        if(assetRef.ref === 0) {
            this.assets.delete(key);
        }
    }

    get progress() {
        let total = this.assets.size;
        return (total - this.pending) / total;
    }
}