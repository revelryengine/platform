/**
 * Minimal TypeDoc configuration file to validate code documentation.
 */
const config = {
    entryPoints: ['./**/*.js'],
    intentionallyNotDocumented: [
        'lru-cache.LRUCache.constructor.T',
        'merge.merge.__type.k',
        'set-map.SetMap.constructor.K',
        'set-map.SetMap.constructor.T',
        'weak-cache.WeakCache.constructor.T',
    ],
};

export default config;
