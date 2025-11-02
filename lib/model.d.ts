import { Game  } from './game.js';
import { Stage } from './stage.js';
import { Component } from './component.js';
import { WatchableEventMap, Watchable } from './watchable.d.ts';

type ModelConstructor<D extends string[] = any, E extends WatchableEventMap = any> = {
    new (stage: Stage, entity: string): Model<D, E>;
    components: string[];
}

type ModelEvents = {
    'delete': void
}

export declare class Model<D extends string[] = string[], E extends WatchableEventMap = {}> extends Watchable<E & ModelEvents> {
    constructor(stage: Stage, entity: string);

    /** A reference to the Stage */
    readonly stage: Stage;

    /** The entity that the model is built from */
    readonly entity: string;

    /** An object containing all the components for the model indexed by type */
    readonly components: { [K in D[number]]: Component<K> };

    /** A set of all the types the model contains */
    readonly types: Set<string>;

    /** A reference to the game. It will be undefined if the model's stage does not belong to a Game yet. */
    readonly game: Game|null;

    /** A convenience wrapper to derive a Model class and ensure types are inferred correctly */
    static Typed<D extends { components: string[], events?: WatchableEventMap }>(components: D): ModelConstructor<D['components'], D extends { events: WatchableEventMap } ? D['events'] : {} >;

    static components: string[];
}
