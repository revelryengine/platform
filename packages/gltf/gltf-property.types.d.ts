/**
 * A type definition module for glTF property types.
 *
 * This module is neccessary because of [TypeScript issue 5846](https://github.com/microsoft/TypeScript/issues/5863).
 *
 * It's not possible to workaround this in JSDoc alone.
 *
 * @module
 */

import { GLTFProperty, JSONPointer } from './gltf-property.js';

/**
 * Graph for unmarshalling JSON into GLTFProperty instances.
 */
export interface FromJSONGraph {
    /**
     * The root glTF object.
     */
    root: Record<string, unknown>;
    /**
     * The base URI for resolving relative paths.
     */
    uri?: URL;
    /**
     * The parent object in the glTF hierarchy.
     */
    parent?: Record<string, unknown>;
}

/**
 * Definition of a reference field for unmarshalling.
 */
export interface ReferenceField {
    /**
     * A function that retuns the factory used to create the referenced object.
     * This is a function to avoid circular dependency issues.
     */
    factory?: () => typeof GLTFProperty | typeof URL | typeof JSONPointer;
    /**
     * The collection name(s) where the referenced object can be found.
     */
    collection?: string | string[];
    /**
     * The location of the collection ('root' or 'parent').
     */
    location?: 'root' | 'parent';
    /**
     * Additional properties to assign to the referenced object.
     */
    assign?: Record<string, unknown>;
    /**
     * An alternative name for the referenced field.
     */
    alias?: string;
    /**
     * Nested reference fields for complex objects.
     */
    referenceFields?: Record<string, ReferenceField>;
}

/**
 * Marshalled glTFProperty data.
 */
export interface glTFPropertyData {
    [key: string]: unknown;
    /**
     * Extension specific data.
     */
    extensions?: { [key: string]: glTFPropertyData };
    /**
     * Application specific data.
     */
    extras?: { [key: string]: unknown };
}
/**
 * Unmarshalled GLTFProperty data.
 */
export interface GLTFPropertyData {
    [key: string]: unknown;
    /**
     * Extension specific data.
     */
    extensions?: { [key: string]: GLTFPropertyData };
    /**
     * Application specific data.
     */
    extras?: { [key: string]: unknown };
}

/**
 * Marshalled named glTFProperty data.
 */
export interface namedGLTFPropertyData extends glTFPropertyData {
    /**
     * The name of the property.
     */
    name?: string;
}

/**
 * Unmarshalled named GLTFProperty data.
 */
export interface NamedGLTFPropertyData extends GLTFPropertyData {
    /**
     * The name of the property.
     */
    name?: string;
}

/**
 * A result from prepareJSON method.
 */
export type PreparedFromJSON = {
    /**
     * The prepared JSON data.
     */
    json: glTFPropertyData;
    /**
     * The prepared graph data.
     */
    graph: FromJSONGraph;
};

/**
 * Interface for GLTFProperty classes.
 * @template T - A GLTFProperty instance type.
 */
export interface GLTFPropertyClassInterface<T extends GLTFProperty> {
    /**
     * The name of the glTF class.
     */
    name: string;
    /**
     * Creates a new instance from unmarshalled data.
     * @param unmarshalled - The unmarshalled data
     */
    new (unmarshalled: GLTFPropertyData): T;
    /**
     * Creates an instance from JSON data.
     *
     * It automatically unmarshalls referenced fields based on the referenceFields static property.
     *
     * See [Unmarshalling](./__docs__/development.md#unmarshalling) for more details.
     *
     * @param json - The JSON representation of the GLTFProperty
     * @param graph - The graph for creating the instance from JSON.
     */
    fromJSON(json: glTFPropertyData, graph?: Partial<FromJSONGraph>): T;

    /**
     * Hook to allow subclasses to transform JSON/graph prior to unmarshalling.
     * @param json - The JSON representation of the GLTFProperty
     * @param graph - The graph for creating the instance from JSON.
     * @returns The transformed json/graph
     */
    prepareJSON(json: glTFPropertyData, graph: Partial<FromJSONGraph>): PreparedFromJSON;

    /**
     * Reference fields used for unmarshalling.
     */
    referenceFields: Record<string, ReferenceField>;
}
