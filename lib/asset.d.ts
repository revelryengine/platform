import { Watchable } from 'revelryengine/ecs/lib/utils/watchable.js';

interface AssetReady<D = any, I = any> {
    readonly state: 'ready',
    readonly data: D;
    readonly instance: I;
}

export declare class Asset<D = any, I = any, E = Record<string, unknown>> extends Watchable<E & { 'data:load': D, 'instance:create': { instance: I, previous: (I | undefined) }, 'error': string, 'unload': void }> {
    constructor(component: { entity: string, value: { path: string | URL } }, referer?: Asset<D, I, E>[]);

    set(value: { path: string | URL }): void;
    toJSON(): { path: string }

    readonly entity:    string;
    readonly path:      string;
    readonly referer?:  Asset<D, I, E>[];
    readonly data?:     D;
    readonly instance?: I;

    readonly state: 'error' | 'unloaded' | 'ready' | 'creating' | 'loading';
    readonly error: string | undefined;

    fetch(signal?: AbortSignal): Promise<Response>;
    load(signal?: AbortSignal): Promise<D>;
    createInstance(): Promise<I>;

    unload(): void;

    static clearCache(): void;
    static abortAll(): void;
    static getReferenceCount(path: URL|string): number;
}