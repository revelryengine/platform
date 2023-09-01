import { Watchable } from 'revelryengine/ecs/lib/utils/watchable.js';

export declare abstract class Asset<D = any, I = any, E = Record<string, unknown>> extends Watchable<E & { 'instance:create': (I | undefined) }> {
    constructor(value: { path: string | URL });
    set(value: { path: string | URL }): void;

    readonly path: string;
    readonly data?: D;
    readonly instance?: I;

    readonly loaded: Promise<void>;

    fetch(signal?: AbortSignal): Promise<Response>;
    load(signal?: AbortSignal): Promise<D>;
    unload(): void;

    createInstance(): Promise<I>;

    toJSON(): { path: string }
    clone():  { path: string }
}