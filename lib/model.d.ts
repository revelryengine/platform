import { Game  } from './game.js';
import { Stage } from './stage.js';
import { Component, ComponentTypesDefinition, ComponentTypeMap } from './component.js';
import { EventMap, Watchable } from './utils/watchable.js';

type ModelComponentsDefinition<T extends ComponentTypesDefinition = any> = Record<string, { type: Extract<keyof T, string> }>;

type ModelConstructor<T extends ComponentTypesDefinition = any> = {
    new (stage: Stage<T>, entity: string): Model<T>;
    components: ModelComponentsDefinition<T>;
}

type ModelConstructorTyped<T extends ComponentTypesDefinition, D extends ModelComponentsDefinition<T>, E extends EventMap = any> = {
    new (stage: Stage<T>, entity: string): { [K in Extract<keyof D, string>]: ComponentTypeMap<T>[D[K]['type']]['value'] } & Model<T, D, E>;
    components: D;
}

export declare class Model<T extends ComponentTypesDefinition = any, D extends ModelComponentsDefinition<T> = any, E extends EventMap = any> extends Watchable<E> {
    constructor(stage: Stage<T>, entity: string);

    /** A reference to the Stage */
    readonly stage: Stage<T>;

    /** The entity that the model is built from */
    readonly entity: string;

    /** An object containing all the components for the model indexed by type */
    readonly components: { [K in Extract<keyof D, string>]: Component<T, D[K]['type']> };

    /** A set of all the types the model contains */
    readonly types: Set<Extract<keyof T, string>>;

    /** A reference to the game. It will be undefined if the model's stage does not belong to a Game yet. */
    readonly game: Game|undefined;

    /** A cleanup method that will be called when the model is removed from the Stage */
    cleanup(): void;

    /** A convenience wrapper to derive a Model class and ensure types are inferred correctly */
    static Typed<T extends ComponentTypesDefinition>(types: T): 
        <D extends { components: ModelComponentsDefinition<T>, events?: EventMap }>(components: D) => ModelConstructorTyped<T, D['components'], D extends { events: EventMap } ? D['events'] : any >;

    static components: ModelComponentsDefinition;
}