/// <reference lib="dom" />

import { Stage    } from './stage.js';
import { Game     } from './game.js';
import { GameNode } from './gom/game-node.js';
import { WatchableEventMap } from './utils/watchable.js';

type SystemModelsDefinition = Record<string, { model: import('./model.js').ModelConstructor, isSet?: boolean }>;

type SystemConstructor<D extends SystemModelsDefinition = any, E extends WatchableEventMap = any> = {
    new (options?: { id?: string, element?: HTMLElement }): { [K in Extract<keyof D, string>]: D[K]['isSet'] extends true ? Set<InstanceType<D[K]['model']>> : InstanceType<D[K]['model']> } & System<D, E>;
    models: D;
}

type ModelFromDefinition<D extends SystemModelsDefinition> = InstanceType<D[Extract<keyof D, string>]['model']>;
type SystemEvents<D extends SystemModelsDefinition> = { 'model:add': { model: ModelFromDefinition<D>, key: string }, 'model:delete': { model: ModelFromDefinition<D>, key: string } };

export declare class System<D extends SystemModelsDefinition = any, E extends WatchableEventMap = any> extends GameNode<Stage, any, E & SystemEvents<D> > {
    constructor(options?: { id?: string, element?: HTMLElement });

    /** The id of the model */
    readonly id: string;

    /** A reference to the stage. It will be undefined if the model's stage does not belong to a Stage yet. */
    readonly stage: Stage|undefined;

    /** A reference to the game. It will be undefined if the model's stage does not belong to a Game yet. */
    readonly game: Game|undefined;

    onModelAdd(model: ModelFromDefinition<D>, key: string): void;

    onModelDelete(model: ModelFromDefinition<D>, key: string): void;

    /** A convenience wrapper to derive a Model class and ensure types are inferred correctly */
    static Typed<D extends { models: SystemModelsDefinition, events?: WatchableEventMap }>(components: D): SystemConstructor<D['models'], D extends { events: infer E } ? E : any >;

    static models: SystemModelsDefinition;
}
