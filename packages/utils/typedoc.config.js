/**
 * Minimal TypeDoc configuration file to validate code documentation.
 */
const config = {
    entryPoints: ['./**/*.js', './**/*.d.ts'],
    intentionallyNotDocumented: [
        'cache-helper.Fetcher.__type.init',
        'cache-helper.Fetcher.__type.request',
        'job-queue.JobTask.__type.signal',
        'lru-cache.LRUCache.constructor.T',
        'lru-cache.PersistHandler.get.__type.key',
        'lru-cache.PersistHandler.put.__type.key',
        'lru-cache.PersistHandler.put.__type.value',
        'lru-cache.PersistHandler.delete.__type.key',
        'orbit-control.OnInputCallback.__type.input',
        'orbit-control.OnUpdateCallback.__type.matrix',
        'math.Normalizer.__type.v',
        'merge.merge.__type.k',
        'set-map.SetMap.constructor.K',
        'set-map.SetMap.constructor.T',
        'weak-cache.WeakCache.constructor.T',
    ],
};

export default config;
