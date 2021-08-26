export class AssetManager {
    assets = new Map();

    pending = 0;

    constructor(loader) {
        this.loader = loader;
    }

    /**
     * Loads an asset using the specified uri. It will update the ref count for this uri.
     * @param {String|URL} uri
     */
    async load(uri) {
        const assetRef = this.assets.get(uri) || { refs: 0 };
        
        assetRef.refs++;
        
        this.assets.set(uri, assetRef);

        if(!assetRef.asset && !assetRef.pending) {
            this.pending++;

            assetRef.abortCtl = new AbortController();
            assetRef.pending   = this.loader(uri, assetRef.abortCtl);
            assetRef.asset     = await assetRef.pending;

            delete assetRef.pending;
            delete assetRef.abortCtl;

            this.pending--;
        }

        return assetRef.asset || assetRef.pending;
    }

    /**
     * It will decrement the ref count for this uri and if ref count is 0 the asset will be removed.
     * @param {String|URL} uri
     */
    unload(uri) {
        const assetRef = this.assets.get(uri);
        if(!assetRef) return;

        if(assetRef.pending) assetRef.abortCtl.abort();

        assetRef.refs--;
        if(assetRef.ref === 0) {
            this.assets.delete(uri);
        }
    }

    get progress() {
        let total = this.assets.size;
        return (total - this.pending) / total;
    }
}