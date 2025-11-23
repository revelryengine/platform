# Adding Extensions

This guide walks you through creating a new glTF extension. We'll use a hypothetical `EXT_example` extension as our example, which adds custom data to glTF nodes.

## Understanding the Extension System

Before we dive in, it's important to understand how extensions work in this library:

1. **Type Safety First**: Extensions use TypeScript declaration merging to provide full IntelliSense and type checking, even though the implementation is in JavaScript with JSDoc annotations.

2. **The Virtual Module Pattern**: The `@revelryengine/gltf/extensions` module is a "virtual module" - it doesn't exist as a physical file. Instead, it's created through TypeScript's declaration merging feature. Each extension's `.types.d.ts` file contributes to this module by declaring interfaces that get merged together, allowing all extensions to extend the same base types without conflicts.

3. **Automatic Instantiation**: When a glTF file is loaded, the library automatically creates instances of your extension classes based on the registry mappings. This means users don't manually construct extensions - they just load a glTF file and access the strongly-typed extension data.

### What Should Go in an Extension?

Extensions should focus on the library's two main objectives: **Simplify the glTF API** and **Binary Data Initialization**. They should NOT contain complex runtime logic like shader code, rendering algorithms, or game logic.

**Do:**
- Dereference indices to object references (e.g., texture index → Texture instance)
- Load external binary resources (buffers, images) in the `load()` method
- Store metadata and configuration that describes the data
- Perform heavy preprocessing of binary data at load time

**Don't:**
- Include shader code or rendering implementation
- Add game logic or engine-specific behavior

#### Dereferencing Example

Add the static `referenceFields`

```js
static referenceFields = {
    texture: { factory: () => Texture },  // Converts texture index → Texture instance
    node:    { factory: () => Node    },  // Converts node index → Node instance
}
```
See [Unmarshalling](./development.md#unmarshalling) for more details on how this works.

#### Binary Data Loading Example

Implement `load()` to fetch external resources:

```js
async load(signal) {
    if (this.dataUri) {
        const response = await fetch(this.dataUri, { signal });
        this.data = await response.arrayBuffer(); // Ready for GPU upload
    }
    return super.load(signal);
}
```

## Step 1: Create the Type Definition File

This file sets up the TypeScript types that will enable IntelliSense and type checking for your extension. It uses declaration merging to augment the virtual `@revelryengine/gltf/extensions` module.

```ts [EXT/EXT_example.types.d.ts]
/**
 * Augments the glTF extension interfaces to include EXT_example types.
 * @module @revelryengine/gltf/extensions
 */

declare module '@revelryengine/gltf/extensions' {
    interface nodeExtensions {
        /** A json object representing the EXT_example extension */
        'EXT_example'?: import('./EXT_example.js').nodeEXTExample,
    }
    interface NodeExtensions {
        /** A NodeEXTExample instance */
        'EXT_example'?: import('./EXT_example.js').NodeEXTExample,
    }

    // For each glTF property we create, we can allow them to also be 
    // extendable by future extensions by adding interfaces below

    interface ExtendableProperties {
        /** NodeEXTExample property */
        NodeEXTExample: true,
    }
    /** Interface for adding nodeEXTExample extension json properties. */
    interface nodeEXTExampleExtensions {}
    /** Interface for adding NodeEXTExample extension instance properties. */
    interface NodeEXTExampleExtensions {}
}
```

**What's happening here:**

- **`nodeExtensions` interface**: Defines the JSON type for `node.extensions.EXT_example`. This is what you'd see in the raw glTF JSON file.
- **`NodeExtensions` interface**: Defines the class instance type that users will work with after the glTF is loaded. Note the capital 'N' following our naming convention.
- **`ExtendableProperties` interface**: Registers your extension class so that other extensions can extend it in the future (extensibility all the way down!).
- **`nodeEXTExampleExtensions` and `NodeEXTExampleExtensions` interfaces**: Empty interfaces that allow future extensions to add properties to your extension. This maintains the pattern where any glTF property can be extended.

The `import()` type syntax dynamically imports types from your implementation file, creating a tight coupling between the type definitions and the actual classes.

## Step 2: Create the Implementation File

Now we create the actual JavaScript implementation with JSDoc type annotations.

```js [EXT/EXT_example.js]
/// <reference path="./EXT_example.types.d.ts" />
// This triple-slash directive tells TypeScript and IDEs to load the type definitions.
// It ensures that when someone imports this module, they also get the augmented types.

/**
 * This extension is used to provide an example of how to create extensions.
 * @module
 */

import { GLTFProperty } from 'revelryengine/gltf/gltf-property.js'; 
// Use relative path '../gltf-property.js' if contributing an extension to this codebase

/**
 * @import { GLTFPropertyData } from 'revelryengine/gltf/gltf-property.types.d.ts'; // or `../gltf-property.types.d.ts` 
 * @import { nodeEXTExampleExtensions, NodeEXTExampleExtensions } from '@revelryengine/gltf/extensions';
 * 
 * These `Extensions` interfaces correspond to the ones created in `EXT_example.types.d.ts`. 
 * We import them from the virtual module to use in our type annotations below.
 */

/**
 * @typedef {object} nodeEXTExample - EXT_example JSON representation.
 * @property {string} example - An example string to include with the extension data.
 * @property {nodeEXTExampleExtensions} [extensions] - Extension-specific data.
 */

/**
 * EXT_example class representation.
 * This class will be instantiated automatically when a glTF with this extension is loaded.
 */
export class NodeEXTExample extends GLTFProperty {
    /**
     * Creates a new instance of NodeEXTExample.
     * @param {{
     *  example:     string,
     *  extensions?: NodeEXTExampleExtensions,
     * } & GLTFPropertyData} unmarshalled - Unmarshalled EXT_example object
     */
    constructor(unmarshalled) {
        super(unmarshalled);

        const { example, extensions } = unmarshalled;

        /**
         * An example string to include with the extension data.
         */
        this.example = example;

        /**
         * Extension-specific data (for nested extensions).
         */
        this.extensions = extensions;
    }

    /**
     * Reference fields for this class.
     * @type {Record<string, ReferenceField>}
     */
    static referenceFields = {
        // If your extension has reference fields (indices pointing to other glTF objects),
        // you would list them here. For example:
        // texture: { factory: () => Texture },
        // node:    { factory: () => Node },
    }
}

/**
 * Register the extension with the glTF property system.
 * This is the critical step that tells Revelry Engine how to handle this extension.
 */
GLTFProperty.extensions.add('EXT_example', {
    schema: {
        Node: NodeEXTExample, // When node.extensions.EXT_example is encountered, create a NodeEXTExample instance
    },
});
```

**Key points:**

- **`GLTFProperty` base class**: All extension classes extend `GLTFProperty`, which provides common functionality like extensions support and JSON serialization.
- **`constructor` and `referenceFields`**: The constructor receives an unmarshalled object with all references already resolved. The static `referenceFields` property defines how references to other glTF objects (like textures, nodes, buffers) are handled automatically during the unmarshalling process when the static `fromJSON` method is called. See [Unmarshalling](./development.md#unmarshalling) for more details on how this works.
- **Registry pattern**: The `GLTFProperty.extensions.add()` call maps the extension name to the class constructor. The schema object indicates which glTF property type (Node, Material, TextureInfo, etc.) this extension attaches to.

## Step 3: Register in the Extensions Module

If contributing an extension to this codebase we should consider adding it to the included built-in extensions.

To do this, add an export to `extensions.js` to ensure your extension is loaded when the library initializes.

```js [extensions.js]
...
export * from './EXT/EXT_example.js';
```

This export has two effects: 
1. It executes the `GLTFProperty.extensions.add()` call in your implementation file, registering the extension with the system
2. It makes `NodeEXTExample` available when users import from `revelryengine/gltf/gltf.js` (since `gltf.js` re-exports everything from `extensions.js`)

## Step 4: Using Your Extension

Now users can load glTF files with your extension and get fully typed access:

**Example usage:**
```js
import { GLTF, NodeEXTExample } from 'revelryengine/gltf/gltf.js';

// Load a glTF file with your extension
const gltf = GLTF.fromJSON({ 
    nodes: [{ 
        name: 'MyNode',
        extensions: { 
            EXT_example: { example: 'hello world' } 
        }
    }],
});

// Access the extension - it's automatically instantiated!
const node = gltf.nodes[0];
console.log(node.extensions.EXT_example instanceof NodeEXTExample); // true
console.log(node.extensions.EXT_example.example); // 'hello world'

// TypeScript/IntelliSense knows about all properties
node.extensions.EXT_example.example // <- IntelliSense works here!
```

## What Happens Behind the Scenes

When `GLTF.fromJSON()` is called:

1. The loader encounters `node.extensions.EXT_example` in the JSON
2. It looks up `'EXT_example'` in the registry
3. It finds the mapping to `NodeEXTExample` for the `Node` schema
4. It calls the internal unmarshalling system, which uses `NodeEXTExample.referenceFields` to dereference any indices
5. The unmarshalled data is passed to the `NodeEXTExample` constructor to create the instance
6. The instance is assigned to `node.extensions.EXT_example`

All of this happens automatically, giving users a seamless, strongly-typed experience when working with glTF extensions.
