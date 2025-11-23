# Revelry Engine glTF Development Guide

This guide helps developers navigate and contribute to the Revelry Engine glTF library codebase. It covers the package structure, coding conventions, the unmarshalling system, and the process for adding new glTF extensions. Whether you're fixing bugs, adding features, or creating custom extensions, this document provides the foundational knowledge needed to work effectively with the codebase.

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

### Other files
  - `constants.js` - Shared constants and enumerations
  - `extensions.js` - Re-exports all built-in extensions
  - `extensions.types.d.ts` - TypeScript declaration merging for extension interfaces. See [Adding Extensions](./adding-extensions.md) for more details.


### Vendor-Specific Extension Folders:

The glTF extension system is organized into folders by vendor prefix

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

## Unmarshalling

The `GLTFProperty.unmarshall()` static method is the core mechanism for converting raw JSON glTF data into typed JavaScript class instances. This method handles the complex task of dereferencing indices to object references and managing the object graph during deserialization.

### What is Unmarshalling?

In glTF JSON files, relationships between objects are represented as **numeric indices**. For example:
```json
{
  "meshes": [
    {
      "primitives": [{
        "attributes": { "POSITION": 0 },
        "indices": 1,
        "material": 0
      }]
    }
  ],
  "accessors": [...],
  "materials": [...]
}
```

The `indices: 1` is an index pointing to `accessors[1]`, and `material: 0` points to `materials[0]`. Unmarshalling converts these numeric indices into direct object references, creating a navigable object graph.

### The unmarshall Method Signature

```javascript
static unmarshall({ uri, root, parent }, json, referenceFields, ctor)
```

**Parameters:**
- **`graph`** (`FromJSONGraph`): Context for unmarshalling
  - `uri`: Base URI for resolving relative paths (used for images, buffers)
  - `root`: The root glTF object containing all collections (nodes, materials, etc.)
  - `parent`: The immediate parent object in the hierarchy
- **`json`**: The raw JSON object to unmarshall
- **`referenceFields`**: An object describing which fields contain references and how to resolve them
- **`ctor`**: The constructor function to create the final instance

**Returns:** An instance of the specified class with all references resolved to object instances.

### Reference Field Types

The `referenceFields` parameter defines how each field in the JSON should be dereferenced. There are several types of reference fields:

#### 1. Simple Collection Reference

The most common pattern - resolves a numeric index to an object from a root collection.

```javascript
static fromJSON(meshPrimitive, graph) {
    return this.unmarshall(graph, meshPrimitive, {
        indices:  { factory: Accessor, collection: 'accessors' },
        material: { factory: Material, collection: 'materials' },
    }, this);
}
```

**Properties:**
- `factory`: The class constructor to instantiate (e.g., `Accessor`, `Material`)
- `collection`: The collection name in the root glTF object (e.g., `'accessors'`, `'materials'`)

This converts `{ indices: 1 }` to `{ indices: <Accessor instance from root.accessors[1]> }`.

**Array support:** If the JSON field is an array of indices, unmarshall automatically maps over them:
```javascript
{ 
    children: { factory: Node, collection: 'nodes' } // converts [0, 1, 2] → [Node, Node, Node]
}
```

#### 2. Parent Collection Reference

References objects from the parent object's collection instead of the root.

```javascript
static fromJSON(animationChannel, graph) {
    return this.unmarshall(graph, animationChannel, {
        sampler: { factory: AnimationSampler, collection: 'samplers', location: 'parent' }
    }, this);
}
```

**Properties:**
- `location`: `'parent'` (default is `'root'`)

Used when the reference is scoped to the parent container. For example, animation channels reference samplers within their parent animation object, not from a global collection.

#### 3. Nested Collection Path

For extensions that add collections to the root glTF under `extensions.*`, use an array path.

```javascript
{
    light: { 
        factory: KHRLight, 
        collection: ['extensions', 'KHR_lights_punctual', 'lights'] 
    }
}
```

This navigates `root.extensions.KHR_lights_punctual.lights[index]` to resolve the reference.

#### 4. Inline Object Reference

When the field contains a nested object (not an index), only specify the factory.

```javascript
{
    target: { factory: AnimationChannelTarget } // JSON contains object, not index
}
```

Unmarshall will instantiate the factory class with the nested object data.

#### 5. Nested Reference Fields

For complex objects with their own reference fields (like `attributes` in mesh primitives).

```javascript
static fromJSON(meshPrimitive, graph) {
    return this.unmarshall(graph, meshPrimitive, {
        attributes: { 
            referenceFields: {
                POSITION:   { factory: Accessor, collection: 'accessors' },
                NORMAL:     { factory: Accessor, collection: 'accessors' },
                TEXCOORD_0: { factory: Accessor, collection: 'accessors' },
                // ...
            } 
        }
    }, this);
}
```

This handles the case where the JSON structure is:
```json
{
  "attributes": {
    "POSITION": 0,
    "NORMAL": 1,
    "TEXCOORD_0": 2
  }
}
```

Each property of `attributes` is dereferenced individually according to its own reference field definition.

#### 6. JSON Pointer Resolver

For the `KHR_animation_pointer` extension, which uses JSON Pointer strings to reference any property in the glTF tree.

```javascript
static fromJSON(khrAnimationPointerTarget, graph) {
    return this.unmarshall(graph, khrAnimationPointerTarget, {
        pointer: { pointer: 'resolve' }
    }, this);
}
```

**Properties:**
- `pointer`: Name for the resolver function (typically `'resolve'`)

Instead of a direct object reference, this creates a **resolver function** that lazily evaluates the JSON Pointer path. The pointer string (e.g., `"/nodes/3/translation"`) is parsed to locate the target object and property.

The resolver function returns an object with:
- `target`: The object containing the property
- `path`: The property name
- `root.collection`: The root collection name
- `root.target`: The root collection target object

This is used for animation systems that need to target arbitrary properties anywhere in the scene graph.

#### 7. URL References

Special handling for URI fields that should be resolved relative to the glTF file's location.

```javascript
{
    uri: { factory: URL }
}
```

Converts relative URI strings into absolute `URL` objects based on the `graph.uri` base URL.

#### 8. Additional Options

- **`assign`**: Properties to merge into the resolved object
  ```javascript
  { material: { factory: Material, collection: 'materials', assign: { alpha: true } } }
  ```

- **`alias`**: Create an additional reference under a different name
  ```javascript
  { texture: { factory: Texture, collection: 'textures', alias: 'tex' } }
  // Result has both `texture` and `tex` pointing to the same instance
  ```

### Instance Caching

The unmarshall method maintains a `WeakMap` cache of instances per root glTF object. This ensures:
- **Object identity preservation**: Multiple references to the same index resolve to the same instance
- **Cycle handling**: Circular references (e.g., nodes with parent/child relationships) don't cause infinite loops
- **Memory efficiency**: Instances are garbage collected when the root glTF is released

### Extension Handling

After unmarshalling the main object, the method automatically processes the `extensions` field:
1. Looks up each extension name in the registry
2. Finds the appropriate factory for the parent class type
3. Recursively unmarshalls each extension using its factory's `fromJSON` method
4. Replaces raw JSON extension data with class instances

This creates a fully typed extension tree where `node.extensions.REV_game_object` is an instance of `NodeREVGameObject`, not plain JSON.


## Guides

### Adding Extensions

See [Adding Extensions](./adding-extensions.md) for details on how to add extensions.
