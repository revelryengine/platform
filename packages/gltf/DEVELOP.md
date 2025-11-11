# Revelry Engine glTF Development Guide

## Code Structure

The package is organized into core glTF classes and extension implementations:

### Core glTF Classes

Each glTF 2.0 specification glTF property has a corresponding file:

  - `gltf.js` - Main GLTF container class
  - `gltf-property.js` - Base class for all glTF properties with common functionality
  - `asset.js` - Metadata about the glTF asset (version, generator, etc.)
  - `scene.js`, `node.js` - Scene graph hierarchy
  - `mesh.js`, `mesh-primitive.js`, `mesh-primitive-target.js` - Geometry data
  - `material.js`, `material-pbr-metallic-roughness.js` - Material definitions
  - `material-normal-texture-info.js`, `material-occlusion-texture-info.js` - Material texture metadata
  - `texture.js`, `texture-info.js`, `sampler.js`, `image.js` - Texture pipeline
  - `animation.js`, `animation-channel.js`, `animation-channel-target.js`, `animation-sampler.js` - Animation system
  - `accessor.js`, `accessor-sparse.js`, `accessor-sparse-indices.js`, `accessor-sparse-values.js` - Data accessors
  - `buffer.js`, `buffer-view.js` - Binary data containers
  - `camera.js`, `camera-perspective.js`, `camera-orthographic.js` - Camera definitions
  - `skin.js` - Skeletal animation data
  - `constants.js` - Shared constants and enumerations

### Extensions Folder (`extensions/`)

The glTF extension system is organized by vendor prefix:

- **`registry.js`** - Central registry for mapping extension names to their class implementations
- **`all.js`** - Convenience module that imports and registers all available extensions
- **`extensions.types.d.ts`** - TypeScript declaration merging for extension interfaces. See [Adding Extensions](#adding-extensions).

#### Vendor-Specific Extensions:
- **`KHR/`** - Khronos ratified extensions (official glTF extensions):
  - Material extensions: clearcoat, IOR, iridescence, sheen, specular, transmission, volume, emissive strength, unlit, variants
  - Texture extensions: Basis Universal compression, texture transform, WebP
  - Draco mesh compression with web worker support
  - Punctual lights (point, spot, directional)
  - Environment maps and audio
  - Animation pointer and XMP metadata
  - `archived/` - Deprecated or superseded extensions

- **`EXT/`** - Multi-vendor extensions:
  - WebP texture support

- **`REV/`** - Revelry Engine-specific extensions:
  - `REV_game_object` - Game object node metadata for ECS integration

## Naming Conventions

This library uses a naming convention to distinguish between the marshalled JSON data and unmarshalled class data of the corresponding glTF property.

### Core glTF Properties

- **Lowercase** (e.g., `glTFProperty`, `node`, `material`) - JSON interface representation (TypeScript type for raw JSON data)
- **Uppercase** (e.g., `GLTFProperty`, `Node`, `Material`) - Instance class representation (JavaScript class for unmarshalled objects)

The type interfaces follow these patterns:
- JSON types use lowercase initial letter: `node`, `material`, `texture`
- Class types use uppercase initial letter: `Node`, `Material`, `Texture`
- Property-specific data types append descriptive names: `glTFPropertyData`, `MaterialPBRMetallicRoughness`

### Extension Naming

Extensions follow a systematic naming convention that combines the parent property name with the extension name converted to PascalCase:

#### Pattern: `{property}{ExtensionInPascalCase}`

The extension name (e.g., `KHR_materials_clearcoat`, `REV_game_object`) is converted from snake_case to PascalCase by:
1. Removing underscores
2. Capitalizing each word segment
3. Preserving the vendor prefix capitalization (KHR, EXT, REV)

#### Examples:

**KHR_materials_clearcoat on material:**
- JSON interface: `materialKHRMaterialsClearcoat`
- Class type: `MaterialKHRMaterialsClearcoat`
- Corresponds to: `material.extensions.KHR_materials_clearcoat`

**KHR_texture_transform on textureInfo:**
- JSON interface: `textureInfoKHRTextureTransform`
- Class type: `TextureInfoKHRTextureTransform`
- Corresponds to: `textureInfo.extensions.KHR_texture_transform`

**REV_game_object on node:**
- JSON interface: `nodeREVGameObject`
- Class type: `NodeREVGameObject`
- Corresponds to: `node.extensions.REV_game_object`

The property prefix (node, material, textureInfo, etc.) indicates which glTF property the extension attaches to, maintaining clear type relationships throughout the codebase.

#### Special Case: Root GLTF Extensions

When an extension is added to the root `GLTF` property itself, the naming convention differs slightly:
- The `glTF`/`GLTF` prefix is **omitted**
- The vendor prefix is **lowercased** (e.g., `khr`, `ext`, `rev`)
- This indicates the extension adds a new collection to the glTF root, similar to the built-in collections like `nodes`, `materials`, etc.

**Example - KHR_lights_punctual on GLTF root:**
- JSON interface: `khrLightsPunctual` (not `glTFKHRLightsPunctual`)
- Class type: `KHRLightsPunctual` (not `GLTFKHRLightsPunctual`)
- Corresponds to: `gltf.extensions.KHR_lights_punctual`
- Adds collection: `gltf.extensions.KHR_lights_punctual.lights` (similar to `gltf.nodes`)

## Adding Extensions

This guide walks you through creating a new glTF extension in the Revelry Engine ecosystem. We'll use a hypothetical `EXT_example` extension as our example, which adds custom data to glTF nodes.

### Understanding the Extension System

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

Use the `unmarshall` method to convert indices to object references:

```js
static fromJSON(nodeEXTExample, graph) {
    return this.unmarshall(graph, nodeEXTExample, {
        texture: { factory: Texture },  // Converts texture index → Texture instance
        node:    { factory: Node    },  // Converts node index → Node instance
    }, this);
}
```

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

### Step 1: Create the Type Definition File

This file sets up the TypeScript types that will enable IntelliSense and type checking for your extension. It uses declaration merging to augment the virtual `@revelryengine/gltf/extensions` module.

**`extensions/EXT/EXT_example.types.d.ts`**
```ts
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

### Step 2: Create the Implementation File

Now we create the actual JavaScript implementation with JSDoc type annotations.

**`extensions/EXT/EXT_example.js`**
```js
/// <reference path="./EXT_example.types.d.ts" />
// This triple-slash directive tells TypeScript and IDEs to load the type definitions.
// It ensures that when someone imports this module, they also get the augmented types.

/**
 * This extension is used to provide an example of how to create extensions.
 * @module
 */

import { GLTFProperty } from '../../gltf-property.js';
import { registry     } from '../registry.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, FromJSONGraph } from '../../gltf-property.js';
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
     * Creates an instance from JSON data.
     * This static method is called by the glTF loader when deserializing JSON.
     * @param {nodeEXTExample & glTFPropertyData} nodeEXTExample - The EXT_example JSON representation.
     * @param {FromJSONGraph} graph - The graph for creating the instance from JSON.
     * @override
     */
    static fromJSON(nodeEXTExample, graph) {
        return this.unmarshall(graph, nodeEXTExample, {
            // If your extension has reference fields (indices pointing to other glTF objects),
            // you would list them here. For example:
            // texture: { factory: Texture },
            // node:    { factory: Node },
        }, this);
    }
}

/**
 * Register the extension with the glTF property system.
 * This is the critical step that tells Revelry Engine how to handle this extension.
 */
registry.add('EXT_example', {
    schema: {
        Node: NodeEXTExample, // When node.extensions.EXT_example is encountered, create a NodeEXTExample instance
    },
});
```

**Key points:**

- **`GLTFProperty` base class**: All extension classes extend `GLTFProperty`, which provides common functionality like extensions support and JSON serialization.
- **`fromJSON` method**: This is how the glTF loader knows how to construct your class from JSON. The `unmarshall` method handles references to other glTF objects (like textures, nodes, buffers) automatically.
- **Registry pattern**: The `registry.add()` call maps the extension name to the class constructor. The schema object indicates which glTF property type (Node, Material, TextureInfo, etc.) this extension attaches to.

### Step 3: Register in the Extensions Module

Add an export to ensure your extension is loaded when the library initializes.

**`extensions/extensions.js`**
```js
...
export * from './EXT/EXT_example.js';
```

This export has two effects: 
1. It executes the `registry.add()` call in your implementation file, registering the extension with the system
2. It makes `NodeEXTExample` available when users import from `revelryengine/gltf/gltf.js` (since `gltf.js` re-exports everything from `extensions/extensions.js`)

### Step 4: Using Your Extension

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

### What Happens Behind the Scenes

When `GLTF.fromJSON()` is called:

1. The loader encounters `node.extensions.EXT_example` in the JSON
2. It looks up `'EXT_example'` in the registry
3. It finds the mapping to `NodeEXTExample` for the `Node` schema
4. It calls `NodeEXTExample.fromJSON(...)` with the JSON data
5. The `fromJSON` method creates a new instance via the constructor
6. The instance is assigned to `node.extensions.EXT_example`

All of this happens automatically, giving users a seamless, strongly-typed experience when working with glTF extensions.
