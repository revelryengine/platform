import { Game  } from './game.js';
import { Stage } from './stage.js';
import { Component } from './component.js';
import { WatchableEventMap, Watchable } from './utils/watchable.js';

type ModelComponentsDefinition = Record<string, { type: Revelry.ECS.ComponentTypeKeys }>;

type ModelConstructor<D extends ModelComponentsDefinition = any, E extends WatchableEventMap = any> = {
    new (stage: Stage, entity: string): { [K in Extract<keyof D, string>]: Revelry.ECS.ComponentTypeMap[D[K]['type']]['value'] } & Model<D, E>;
    components: D;
}

export declare class Model<D extends ModelComponentsDefinition = any, E extends WatchableEventMap = any> extends Watchable<E> {
    constructor(stage: Stage, entity: string);

    /** A reference to the Stage */
    readonly stage: Stage;

    /** The entity that the model is built from */
    readonly entity: string;

    /** An object containing all the components for the model indexed by type */
    readonly components: { [K in Extract<keyof D, string>]: Component<D[K]['type']> };

    /** A set of all the types the model contains */
    readonly types: Set<Revelry.ECS.ComponentTypeKeys>;

    /** A reference to the game. It will be undefined if the model's stage does not belong to a Game yet. */
    readonly game: Game|null;

    /** A cleanup method that will be called when the model is removed from the Stage */
    cleanup(): void;

    /** A convenience wrapper to derive a Model class and ensure types are inferred correctly */
    static Typed<D extends { components: ModelComponentsDefinition, events?: WatchableEventMap }>(components: D): ModelConstructor<D['components'], D extends { events: WatchableEventMap } ? D['events'] : any >;

    static components: ModelComponentsDefinition;
}
