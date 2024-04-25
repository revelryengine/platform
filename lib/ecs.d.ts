import { System } from './system.js';

import { Component, ComponentReference  } from './component.js';
import { AssetLoaderManager, AssetReference } from './asset.js';
import { ComponentSchemaManager } from './schema.js';

export interface SystemContexts {
    [key: string]: System
}

export type SystemContextKey = (keyof SystemContexts & string);

export interface ComponentSchemas {}
export type ComponentTypeKey = (keyof ComponentSchemas & string);

export type ComponentValueTypeMap = {
    [K in ComponentTypeKey]: ComponentTypeFromSchema<ComponentSchemas[K]>;
} & { [key: string]: any };

export type ComponentValueTypeMapSerialized = {
    [K in ComponentTypeKey]: ComponentTypeFromSchemaSerialized<ComponentSchemas[K]>;
} & { [key: string]: any };

interface ComponentDataMapInterface {
    [key: string]: {
        entity: string;
        type:   string;
        value?: any;
        owner?: string;
    }
}

export type ComponentDataMap = {
    [K in ComponentTypeKey]: {
        entity: string;
        type:   K;
        value:  ComponentValueTypeMap[K];
        owner?: string;
    }
} & ComponentDataMapInterface;

export type ComponentDataMapSerialized = {
    [K in ComponentTypeKey as undefined extends ComponentSchemas[K]['default'] ? K : never]: {
        entity: string;
        type:   K;
        value:  ComponentValueTypeMapSerialized[K];
        owner?: string;
    }
} & {
    [K in ComponentTypeKey as undefined extends ComponentSchemas[K]['default'] ? never : K]: {
        entity: string;
        type:   K;
        value?: ComponentValueTypeMapSerialized[K];
        owner?: string;
    }
} & ComponentDataMapInterface;

export type ComponentTypeSchemaObject = {
    type:       'object',
    default?:   Record<string, unknown>,
    properties: Record<string, ComponentTypeSchema>,
    required?:  string[],
    enum?:      Record<string, unknown>[],
    observed?:  string[],
}

export type ComponentTypeSchemaArray = {
    type:     'array',
    default?: unknown[],
    items:    ComponentTypeSchema,
    enum?:    unknown[],
}

export type ComponentTypeSchemaTuple = {
    type:     'array',
    default?: unknown[],
    items:    ComponentTypeSchema[],
    enum?:    unknown[],
}

export type ComponentTypeSchemaReference = {
    type:      'string',
    default?:  string,
    enum?:     string[],
    component: string,
}

export type ComponentTypeSchemaAsset = {
    type:      'string',
    default?:  string,
    enum?:     string[],
    asset:     string,
}

export type ComponentTypeSchemaString = {
    type:     'string',
    default?: string,
    enum?:    string[],
}

export type ComponentTypeSchemaNumber = {
    type:     'number',
    default?: number
    enum?:    number[],
}

export type ComponentTypeSchemaBoolean = {
    type:     'boolean',
    default?: boolean,
}

/**
 * Revelry ECS supports a subset of JSON Schema for defining component types.
 *
 * If the `default` keyword is used at the root of the schema, the value will be considered optional. Otherwise the value will be required.
 *
 * The following additional keywords are supported on 'object' type schemas:
 *
 * `observed`: An array of property names that will be observed for changes. When a property change is observed an event will be emitted on the component.
 *
 * The following addition keywords are supported on 'string' type schemas:
 *
 * `reference`: A string that specifies the type of component that this string references. The value of the string will be the entity id of the referenced component.
 *
 */
export type ComponentTypeSchema = (
    | ComponentTypeSchemaObject
    | ComponentTypeSchemaArray
    | ComponentTypeSchemaTuple
    | ComponentTypeSchemaReference
    | ComponentTypeSchemaAsset
    | ComponentTypeSchemaString
    | ComponentTypeSchemaNumber
    | ComponentTypeSchemaBoolean
);

type PropertyMerged<U extends object> = { [K in keyof U]: (x: U[K]) => void }[keyof U] extends (x: infer I) => void ? { [K in keyof I]: I[K] } : never;

type HasDefault<T extends ComponentTypeSchema>  = undefined extends T['default']  ? false : true;
type HasObserved<T extends ComponentTypeSchema> = undefined extends T['observed'] ? false : true;
type IsRequired<K extends string, T extends ComponentTypeSchema>  = K extends (undefined extends T['required'] ? never : T['required'][number]) ? true : false;

type IsSimpleSchema<T extends ComponentTypeSchema> = (false extends (HasDefault<T> & HasObserved<T>)
    ? (T extends ComponentTypeSchemaObject ? {
            [Key in keyof T['properties']]: IsSimpleSchema<T['properties'][Key]>
        }[keyof T['properties']] extends false ? false : true :
        T extends ComponentTypeSchemaTuple     ? {
            [Key in keyof T['items']]: IsSimpleSchema<T['items'][Key]>
        }[keyof T['items']] extends false ? false : true :
        T extends ComponentTypeSchemaArray     ? IsSimpleSchema<T['items']> :
        T extends ComponentTypeSchemaReference ? false :
        T extends ComponentTypeSchemaAsset     ? false :
        T extends ComponentTypeSchemaString    ? true  :
        T extends ComponentTypeSchemaNumber    ? true  :
        T extends ComponentTypeSchemaBoolean   ? true  :
        never)
    : false);

type RestrictedArray<T> = Omit<T[], 'splice' | 'reverse' | 'sort' | 'copyWithin' | 'fill' | 'shift' | 'unshift'>;
type RestrictedTuple<T> = Omit<RestrictedArray<T>, 'push' | 'pop'> & { readonly length: number };

type TypeFromSchemaTuple<T> = { [I in keyof T]: TypeFromSchema<T[I], true> };
type TypeFromSchemaTupleSerialized<T> = { [I in keyof T]: TypeFromSchemaSerialized<T[I]> };

type TypeFromSchema<T extends ComponentTypeSchema> = (undefined extends T['enum']
    ? (T extends ComponentTypeSchemaObject ?
        {
            -readonly  [Key in keyof T['properties'] as false extends (IsRequired<Key, T> & HasDefault<T['properties'][Key]>) ? never : Key]: TypeFromSchema<T['properties'][Key]>
        } & {
            -readonly  [Key in keyof T['properties'] as false extends (IsRequired<Key, T> & HasDefault<T['properties'][Key]>) ? Key : never]?: TypeFromSchema<T['properties'][Key]>
        } :
        T extends ComponentTypeSchemaTuple     ? RestrictedTuple<TypeFromSchemaTuple<T['items']>> :
        T extends ComponentTypeSchemaArray     ? IsSimpleSchema<T['items']> extends true ? TypeFromSchema<T['items']>[] : RestrictedArray<TypeFromSchema<T['items']>> :
        T extends ComponentTypeSchemaReference ? ComponentReference<T['component']>  :
        T extends ComponentTypeSchemaAsset     ? AssetReference<T['asset']> :
        T extends ComponentTypeSchemaString    ? string  :
        T extends ComponentTypeSchemaNumber    ? number  :
        T extends ComponentTypeSchemaBoolean   ? boolean :
        never)
    : T['enum'][number]);

type TypeFromSchemaSerialized<T extends ComponentTypeSchema> = (undefined extends T['enum']
    ? (T extends ComponentTypeSchemaObject ? {
            -readonly  [Key in keyof T['properties'] as false extends (IsRequired<Key, T>) ? never : Key]: TypeFromSchemaSerialized<T['properties'][Key]>
        } & {
            -readonly  [Key in keyof T['properties'] as false extends (IsRequired<Key, T>) ? Key : never]?: TypeFromSchemaSerialized<T['properties'][Key]>
        } :
        T extends ComponentTypeSchemaTuple     ? TypeFromSchemaTupleSerialized<T['items']> :
        T extends ComponentTypeSchemaArray     ? TypeFromSchemaSerialized<T['items']>[] :
        T extends ComponentTypeSchemaReference ? string  :
        T extends ComponentTypeSchemaAsset     ? string  :
        T extends ComponentTypeSchemaString    ? string  :
        T extends ComponentTypeSchemaNumber    ? number  :
        T extends ComponentTypeSchemaBoolean   ? boolean :
        never)
    : T['enum'][number]);

export type ComponentTypeFromSchema<T extends ComponentTypeSchema> = TypeFromSchema<T>;
export type ComponentTypeFromSchemaSerialized<T extends ComponentTypeSchema> = TypeFromSchemaSerialized<T>;

type ObservedPropertyKeyMap<S extends ComponentTypeSchemaObject, T extends object, P extends string = ''> = {
    -readonly [Key in keyof T as S['observed'][number] extends Key ? `${P}/${Key}` : never]: T[Key]
} & PropertyMerged<{
    -readonly [Key in keyof T as S['properties'][Key] extends ComponentTypeSchemaObject ? Key : never]: ObservedPropertyKeyMap<S['properties'][Key], T[Key], `${P}/${Key}`>
}>;

export type ComponentValueChangeEventMap = {
    [K in ComponentTypeKey as ComponentSchemas[K] extends ComponentTypeSchemaObject ? K : never]: { 'value:change': ComponentValueTypeMap[K] } & {
        [Key in keyof ObservedPropertyKeyMap<ComponentSchemas[K], NonNullable<ComponentValueTypeMap[K]>> as `value:change:${Key}`]: ObservedPropertyKeyMap<ComponentSchemas[K], NonNullable<ComponentValueTypeMap[K]>>[Key]
    } & { [key: string]: any }
} & {
    [K in ComponentTypeKey as ComponentSchemas[K] extends ComponentTypeSchemaObject ? never : K]: {
        'value:change': ComponentValueTypeMap[K]
    } & { [key: string]: any }
} & {
    [key: string]: {
        'value:change': any,
    } & { [key: string]: any }
};


export type ComponentSchemaManagers = {
    [K in ComponentTypeKey]: ComponentSchemaManager<ComponentSchemas[K]>
} & {
    [key: string]: ComponentSchemaManager
}

export interface AssetLoaders {}


export type AssetLoader    = (uri: string, signal: AbortSignal) => Promise<unknown>;
export type AssetLoaderKey = (keyof AssetLoaders & string);

export type AssetDataMap = {
    [K in AssetLoaderKey]: Awaited<ReturnType<AssetLoaders[K]>>
} & {
    [key: string]: unknown
}

export type AssetLoaderManagers = {
    [Key in AssetLoaderKey]: AssetLoaderManager<AssetLoaders[Key]>
} & {
    [key: string]: AssetLoaderManager
}

export type SystemBundle = { load?: () => Promise<void>, systems?: import('./system.js').SystemConstructor[], schemas?: Record<string, ComponentTypeSchema>, loaders?: Record<string, AssetLoader>, bundles?: SystemBundle[] };

export type GameFile = {
    meta: {
        name:        string,
        description: string,
    },
    stages: Record<string, string>
}

export type StageFile = {
    meta: {
        name:        string,
        description: string,
    },
    systems: string[],
    components: ComponentDataMapSerialized[string][],
}

export * from './game.js';
export * from './stage.js';
export * from './system.js';
export * from './model.js';
export * from './component.js';
export * from './extensions.js';
export * from './watchable.js';

export * from './reference.js';
export * from './asset.js';
export * from './schema.js';

export { UUID } from '../deps/uuid.js';
