import { System } from './system.js';

import { Component } from './component.js';
import { ComponentReference } from './reference.js'
import { AssetLoaderManager, AssetReference } from './asset.js';
import { ComponentSchemaManager } from './schema.js';

export interface SystemContexts {
    [key: string]: System
}

export type SystemContextKey = (keyof SystemContexts & string);


export type ComponentTypeKey = (keyof ComponentSchemas & string);

export type ComponentValueTypeMap = {
    [K in ComponentTypeKey]: ComponentTypeFromSchema<ComponentSchemas[K]>;
} & { [key: string]: any };

export type ComponentValueTypeMapSerialized = {
    [K in ComponentTypeKey]: ComponentTypeFromSchemaSerialized<ComponentSchemas[K]>;
} & { [key: string]: any };

type RecursivePartial<T> = T extends (...args: any[]) => any ? T : {
    [P in keyof T]?: RecursivePartial<T[P]>
};

export type ComponentValueTypeMapPatch = {
    [K in ComponentTypeKey]: RecursivePartial<ComponentTypeFromSchemaSerialized<ComponentSchemas[K]>>;
} & { [key: string]: any };

export type ComponentDataMap = {
    [K in ComponentTypeKey]: {
        entity: string;
        type:   K;
        value:  ComponentValueTypeMap[K];
        owner?: string;
        references: ComponentReferencePropertiesMap[K];
    }
} & {
    [key: string]: {
        entity: string;
        type:   string;
        value?: any;
        owner?: string;
        references?: Record<string, AssetReference | ComponentReference | undefined>;
    }
};

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
} & {
    [key: string]: {
        entity: string;
        type:   string;
        value?: any;
        owner?: string;
    }
};

export type ComponentTypeSchemaObject = {
    type:        'object',
    default?:    Record<string, unknown>,
    properties?: Record<string, ComponentTypeSchema>,
    required?:   string[],
    enum?:       Record<string, unknown>[],
    observed?:   string[],
    additionalProperties?: boolean | ComponentTypeSchema,
}

export type ComponentTypeSchemaArray = {
    type:     'array',
    default?: unknown[],
    items:    ComponentTypeSchema,
    enum?:    readonly unknown[],
}

export type ComponentTypeSchemaTuple = {
    type:     'array',
    default?: unknown[],
    items:    ComponentTypeSchema[],
    enum?:    readonly unknown[],
}

export type ComponentTypeSchemaReference = {
    type:      'string',
    default?:  string,
    enum?:     readonly string[],
    component: string,
}

export type ComponentTypeSchemaAsset = {
    type:      'string',
    default?:  string,
    enum?:     readonly string[],
    asset:     string,
}

export type ComponentTypeSchemaString = {
    type:     'string',
    default?: string,
    enum?:    readonly string[],
}

export type ComponentTypeSchemaNumber = {
    type:     'number',
    default?: number
    enum?:    readonly number[],
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

type IsRequired<K extends string, T extends ComponentTypeSchema> = K extends (undefined extends T['required'] ? never : T['required'][number]) ? true : false;
type IsObserved<K extends string, T extends ComponentTypeSchema> = K extends (undefined extends T['observed'] ? never : T['observed'][number]) ? true : false;
type IsReference<T extends ComponentTypeSchema> = T extends (ComponentTypeSchemaReference|ComponentTypeSchemaAsset) ? true : false;

type IsSimpleSchema<T extends ComponentTypeSchema> = (

    T extends ComponentTypeSchemaObject ? ({
        [Key in keyof T['properties']]: IsComplexSchema<T['properties'][Key]>
    }[keyof T['properties']] extends true ? false : true) :

    T extends ComponentTypeSchemaTuple ? ({
        [Key in keyof T['items']]: IsComplexSchema<T['items'][Key]>
    }[keyof T['items']] extends true ? false : true) :

    T extends ComponentTypeSchemaArray ? IsSimpleSchema<T['items']> :

    true
);

type IsComplexSchema<T extends ComponentTypeSchema> = (false extends (HasDefault<T> & HasObserved<T> & IsReference<T>)
    ? (
        T extends ComponentTypeSchemaObject ? ({
            [Key in keyof T['properties']]: IsComplexSchema<T['properties'][Key]>
        }[keyof T['properties']] extends true ? true : false) :

        T extends ComponentTypeSchemaTuple ? ({
            [Key in keyof T['items']]: IsComplexSchema<T['items'][Key]>
        }[keyof T['items']] extends true ? true : false) :

        T extends ComponentTypeSchemaArray ? IsComplexSchema<T['items']> :

        never
    ) :
    true
);

type RestrictedArray<T> = Omit<T[], 'splice' | 'reverse' | 'sort' | 'copyWithin' | 'fill' | 'shift' | 'unshift'> & Iterable<T>;
type RestrictedTuple<T> = Omit<T, 'splice' | 'reverse' | 'sort' | 'copyWithin' | 'fill' | 'shift' | 'unshift'| 'push' | 'pop'> & { readonly length: number };

type TypeFromSchemaTuple<T> = { [I in keyof T]: TypeFromSchema<T[I]> };
type TypeFromSchemaTupleSerialized<T> = { [I in keyof T]: TypeFromSchemaSerialized<T[I]> };

type Identity<T> = T extends object ? {} & { [P in keyof T]: T[P] } : T;

type TypeFromSchema<T extends ComponentTypeSchema> = (undefined extends T['enum']
    ? (T extends ComponentTypeSchemaObject ?
        Identity<{
            -readonly  [Key in keyof T['properties'] as false extends (IsRequired<Key, T> & HasDefault<T['properties'][Key]>) ? never : Key]: TypeFromSchema<T['properties'][Key]>
        } & {
            -readonly  [Key in keyof T['properties'] as false extends (IsRequired<Key, T> & HasDefault<T['properties'][Key]>) ? Key : never]?: TypeFromSchema<T['properties'][Key]>
        } & (undefined|true extends T['additionalProperties'] ? { [key:string]: any } : { [key: string]: (false extends T['additionalProperties'] ? never : TypeFromSchema<T['additionalProperties']>) })> :
        T extends ComponentTypeSchemaTuple     ? IsSimpleSchema<T['items'][number]> extends true ? TypeFromSchemaTuple<T['items']> : RestrictedTuple<TypeFromSchemaTuple<T['items']>> :
        T extends ComponentTypeSchemaArray     ? IsSimpleSchema<T['items']> extends true ? TypeFromSchema<T['items']>[] : RestrictedArray<TypeFromSchema<T['items']>> :
        T extends ComponentTypeSchemaReference ? string  :
        T extends ComponentTypeSchemaAsset     ? string  :
        T extends ComponentTypeSchemaString    ? string  :
        T extends ComponentTypeSchemaNumber    ? number  :
        T extends ComponentTypeSchemaBoolean   ? boolean :
        never)
    : T['enum'][number]);

type TypeFromSchemaSerialized<T extends ComponentTypeSchema> = (undefined extends T['enum']
    ? (T extends ComponentTypeSchemaObject ?
        Identity<{
            -readonly  [Key in keyof T['properties'] as false extends (IsRequired<Key, T>) ? never : Key]: TypeFromSchemaSerialized<T['properties'][Key]>
        } & {
            -readonly  [Key in keyof T['properties'] as false extends (IsRequired<Key, T>) ? Key : never]?: TypeFromSchemaSerialized<T['properties'][Key]>
        } & (undefined|true extends T['additionalProperties'] ? { [key:string]: any } : { [key: string]: (false extends T['additionalProperties'] ? never : TypeFromSchemaSerialized<T['additionalProperties']>) })> :
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

type ObservedPropertiesFromSchema<T extends ComponentTypeSchema, P extends string = ''> = (
    T extends ComponentTypeSchemaObject ? Identity<{
        -readonly  [Key in keyof T['properties'] as false extends (IsObserved<Key, T>) ? never : `${P}/${Key}`]: TypeFromSchema<T['properties'][Key]>
    } & PropertyMerged<{
        -readonly  [Key in keyof T['properties'] as `${P}/${Key}`]: ObservedPropertiesFromSchema<T['properties'][Key], `${P}/${Key}`>
    }>> :
    T extends ComponentTypeSchemaTuple ? PropertyMerged<{
        -readonly [I in keyof T['items'] & number]: ObservedPropertiesFromSchema<T['items'][I], `${P}/${I}`>
    }> :
    T extends ComponentTypeSchemaArray ? ObservedPropertiesFromSchema<T['items'], `${P}/${number}`> :
    {}
);

type ReferenceFromSchema<T extends ComponentTypeSchemaReference|ComponentTypeSchemaAsset> = T extends ComponentTypeSchemaReference ? ComponentReference<T['component']> : AssetReference<T['asset']>;

type ReferencePropertiesFromSchema<T extends ComponentTypeSchema, P extends string = ''> = (
    T extends ComponentTypeSchemaObject ? Identity<{
        -readonly  [Key in keyof T['properties'] as false extends (IsReference<T['properties'][Key]>) ? never : `${P}/${Key}`]: ReferenceFromSchema<T['properties'][Key]> | (false extends IsRequired<Key, T> ? undefined : never)
    } & PropertyMerged<{
        -readonly  [Key in keyof T['properties'] as `${P}/${Key}`]: ReferencePropertiesFromSchema<T['properties'][Key], `${P}/${Key}`>
    }>> :
    T extends ComponentTypeSchemaTuple ? Identity<{
        -readonly [I in keyof T['items'] & number as false extends (IsReference<T['items'][I]>) ? never : `${P}/${I}`]: ReferenceFromSchema<T['items'][I]>
    } & PropertyMerged<{
        -readonly [I in keyof T['items'] & number as `${P}/${I}`]: ReferencePropertiesFromSchema<T['items'][I], `${P}/${I}`>
    }>> :
    T extends ComponentTypeSchemaArray ? Identity<{
        -readonly [I in [number] as false extends (IsReference<T['items']>) ? never : `${P}/${number}`]: ReferenceFromSchema<T['items']>
    } & PropertyMerged<{
        -readonly [I in [number] as `${P}/${number}`]: ReferencePropertiesFromSchema<T['items'], `${P}/${number}`>
    }>> :
    {}
)

type EmptyToNever<T> = keyof T extends never ? never : T;
type EmptyToUndefined<T> = keyof T extends never ? undefined : T;

export type ComponentObservedPropertiesMap = {
    [K in ComponentTypeKey]: EmptyToNever<ObservedPropertiesFromSchema<ComponentSchemas[K]>>
};

export type ComponentReferencePropertiesMap = {
    [K in ComponentTypeKey]: EmptyToUndefined<(true extends IsReference<ComponentSchemas[K]> ? { '/': ReferenceFromSchema<ComponentSchemas[K]> } : {}) & ReferencePropertiesFromSchema<ComponentSchemas[K]>>
};

export type ComponentEventMap = {
    [K in ComponentTypeKey]: Identity<{
        'value:change': void,
        'delete': void,
    } & {
        [Key in keyof ComponentObservedPropertiesMap[K] as `value:change:${Key}`]: ComponentObservedPropertiesMap[K][Key]
    } & {
        [Key in keyof ComponentReferencePropertiesMap[K] as `reference:resolve:${Key}`]: NonNullable<ComponentReferencePropertiesMap[K][Key]>
    }>
} & {
    [key: string]: {
        'value:change': void,
        'delete': void,
        [key: `value:change:${string}`]:      any,
        [key: `reference:resolve:${string}`]: any,
    }
};

export type ComponentSchemaManagers = {
    [K in ComponentTypeKey]: ComponentSchemaManager<ComponentSchemas[K]>
} & {
    [key: string]: ComponentSchemaManager
}

export interface AssetLoaders {}


export type AssetLoader    = ({ uri: string, signal: AbortSignal }) => Promise<unknown>;
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

export interface ComponentSchemas {}

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
export * from './watchable.js';

export * from './reference.js';
export * from './asset.js';
export * from './schema.js';

export { UUID } from '../deps/utils.js';
