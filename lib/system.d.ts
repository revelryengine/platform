import { Stage, ComponentTypesDefinition } from './stage.js';
import { Game     } from './game.js';
import { GameNode } from './gom/game-node.js';
import { EventMap } from './utils/watchable.js';

type SystemModelsDefinition<T extends ComponentTypesDefinition = any> = Record<string, { model: import('./model.js').ModelConstructor<T>, isSet?: boolean }>;

type SystemConstructor<T extends ComponentTypesDefinition = any> = {
    new (id?: string): System<T>;
    models: SystemModelsDefinition<T>;
}

type SystemConstructorTyped<T extends ComponentTypesDefinition, D extends SystemModelsDefinition<T>, E extends EventMap> = {
    new (id?: string): { [K in Extract<keyof D, string>]: D[K]['isSet'] extends true ? Set<InstanceType<D[K]['model']>> : InstanceType<D[K]['model']> } & System<T, D, E>;
    components: D;
}

type Model<T extends ComponentTypesDefinition, D extends SystemModelsDefinition<T>> = InstanceType<D[Extract<keyof D, string>]['model']>;
type Events<T extends ComponentTypesDefinition, D extends SystemModelsDefinition<T>> = { 'model:add': { model: Model<T, D>, key: string }, 'model:delete': { model: Model<T, D>, key: string } };

export declare class System<T extends ComponentTypesDefinition = any, D extends SystemModelsDefinition<T> = any, E extends EventMap = any> extends GameNode<Stage<T>, any, E & Events<T, D> > {
    constructor(id?: string);

    /** The id of the model */
    readonly id: string;

    /** A reference to the stage. It will be undefined if the model's stage does not belong to a Stage yet. */
    readonly stage: Stage<T>|undefined;

    /** A reference to the game. It will be undefined if the model's stage does not belong to a Game yet. */
    readonly game: Game|undefined;

    onModelAdd(model: Model<T, D>, key: string): void;

    onModelDelete(model: Model<T, D>, key: string): void;

    /** A convenience wrapper to derive a Model class and ensure types are inferred correctly */
    static Typed<T extends ComponentTypesDefinition>(types: T): 
        <D extends { models: SystemModelsDefinition<T>, events?: EventMap }>(components: D) => SystemConstructorTyped<T, D['models'], D extends { events: EventMap } ? D['events'] : any >;

    static models: SystemModelsDefinition;
}
