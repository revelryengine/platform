import { Watchable } from '../deps/ecs.js';

export declare class Asset<V extends { path: string | URL}= any, D = any, I = any, E = Record<string, unknown>> extends Watchable<E & { 'data:load': D, 'instance:create': { instance: I, previous: (I | undefined) }, 'error': string, 'unload': void }> {
    constructor(component: { entity: string, value: { path: string | URL } }, referer?: Asset<V, D, I, E>[]);

    set(value: V): void;
    toJSON(): V

    readonly entity:    string;
    readonly value:     V;
    readonly path:      string;
    readonly referer?:  Asset<V, D, I, E>[];
    readonly data?:     D;
    readonly instance?: I;

    readonly state: 'error' | 'unloaded' | 'ready' | 'creating' | 'loading';
    readonly error: string | undefined;

    get key(): string;

    fetch(signal?: AbortSignal): Promise<Response>;
    load(signal?: AbortSignal): Promise<D>;
    createInstance(): Promise<I>;

    unload(): void;

    static clearCache(): void;
    static abortAll(): void;
}
