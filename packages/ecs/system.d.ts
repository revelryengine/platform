import { Stage } from './stage.js';
import { Game  } from './game.js';
import { type ModelConstructor } from './model.d.ts';
import { Watchable, WatchableEventMap } from './watchable.d.ts';
import { SystemContextKey, SystemContexts } from './ecs.d.ts';

type SystemModelsDefinition = Record<string, { model: ModelConstructor, isSet?: boolean }>;

type SystemConstructor<D extends SystemModelsDefinition = SystemModelsDefinition, E extends WatchableEventMap = SystemModelsDefinition> = {
    new (stage: Stage): System<D, E>;
    id:     string;
    models: D;
}

type ModelFromDefinition<D extends SystemModelsDefinition> = InstanceType<D[keyof D]['model']>;
type SystemEvents<D extends SystemModelsDefinition> = { 'model:add': { model: ModelFromDefinition<D>, key: string }, 'model:delete': { model: ModelFromDefinition<D>, key: string } };

export declare class System<D extends SystemModelsDefinition = SystemModelsDefinition, E extends WatchableEventMap = SystemModelsDefinition> extends Watchable<E & SystemEvents<D>> {
     /** The id of the system */
    static readonly id: string;

    constructor(stage: Stage);

    /** The id of the system */
    readonly id: string;

    /** A reference to the stage. */
    readonly stage: Stage;

    /** A reference to the game. */
    readonly game: Game;

    readonly models: { [K in keyof D]: D[K]['isSet'] extends true ? Set<InstanceType<D[K]['model']>> : InstanceType<D[K]['model']> };

    onModelAdd(model: ModelFromDefinition<D>, key: string): void;
    onModelDelete(model: ModelFromDefinition<D>, key: string): void;

    update(delta: number): void;
    render(): void;

    /** A convenience wrapper to derive a Model class and ensure types are inferred correctly */
    static Typed<D extends { id: string, models: SystemModelsDefinition, events?: WatchableEventMap }>(components: D): SystemConstructor<D['models'], D extends { events: infer E } ? E : Record<PropertyKey, never> >;

    static models: SystemModelsDefinition;
}


export declare class SystemSet extends Watchable<{ 'system:add': { system: System }, 'system:delete': { system: System } }> {

    constructor(registrationHandlers: { register: (system: System) => System, unregister: (system: System) => void });

    add(system: System): ThisParameterType<this>;

    delete(system: System): boolean;

    getById<K extends SystemContextKey>(id: K): SystemContexts[K] | undefined;
    getById(id: string): System | undefined;

    [Symbol.iterator](): IterableIterator<System>;
}
