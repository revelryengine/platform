import { Watchable } from '../deps/ecs.js';

export declare class Asset<T extends {
    value?:    Record<string, unknown>,
    data?:     unknown,
    instance?: unknown,

    defaults?: Record<string, unknown>,
    events?:   Record<string, unknown>,
}> extends Watchable<T['events'] & {
    'data:load':   T['data'],
    'instance:create': {
        instance:  T['instance'],
        previous?: T['instance'],
    },
    'error':  string,
    'unload': void,
}>{
    constructor(component: { entity: string, value: { path: string | URL } }, defaults?: T['defaults']);

    set(value: T['value']): void;
    toJSON(): T['value']

    readonly entity:    string;
    readonly value:     { path: string | URL } & T['value'] & T['defaults'];
    readonly path:      string;
    readonly data?:     T['data'];
    readonly instance?: T['instance'];

    readonly state: 'error' | 'unloaded' | 'ready' | 'creating' | 'loading';
    readonly error: string | undefined;

    get key(): string;

    fetch(signal?: AbortSignal): Promise<Response>;
    load(signal?: AbortSignal): Promise<this['data']>;
    createInstance(): Promise<this['instance']>;

    unload(): void;

    static clearCache(): void;
    static abortAll(): void;
}
