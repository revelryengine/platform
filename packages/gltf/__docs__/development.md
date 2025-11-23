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

The [`GLTFProperty.fromJSON()`](../gltf-property#fromjson) static method is the core mechanism for converting raw JSON glTF data into typed JavaScript class instances. This method handles the complex task of dereferencing indices to object references and managing the object graph during deserialization.

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

### The static referenceFields property

The static `referenceFields` property defines how each field in the JSON should be dereferenced. There are several types of reference fields:

#### Simple Collection Reference

The most common pattern - resolves a numeric index to an object from a root collection.

```javascript
class ExampleProperty extends GLTFProperty {
    static referenceFields = {
        indices:  { factory: () => Accessor, collection: 'accessors' },
        // converts { indices: 0 } -> { indices: <Accessor instance from root.accessors[0]> }
        material: { factory: () => Material, collection: 'materials' },
        // converts { material: 1 } -> { material: <Material instance from root.materials[1]> }
    }
}
```

**Properties:**
- `factory`: A function that returns the class constructor to instantiate (e.g., `Accessor`, `Material`)
- `collection`: The collection name in the root glTF object (e.g., `'accessors'`, `'materials'`)


**Array support:** If the value in the JSON field is an array of indices, unmarshall automatically maps over them:
```javascript
static referenceFields = { 
    children: { factory: () => Node, collection: 'nodes' } 
    // converts { children: [0, 1, 2] } -> { children: [Node, Node, Node] }
}
```

#### Parent Collection Reference

References objects from the parent object's collection instead of the root.

```javascript
static referenceFields = {
    sampler: { 
        factory: () => AnimationSampler, collection: 'samplers', location: 'parent'
        // converts { sampler: 0 } -> { sampler: <AnimationSampler instance from parent.samplers[0]>}
    }
}
```

**Properties:**
- `location`: `'parent'` (default is `'root'`)

Used when the reference is scoped to the parent container. For example, animation channels reference samplers within their parent animation object, not from a global collection.

#### Nested Collection Path

For extensions that add collections to the root glTF under `extensions.*`, use an array path.

```javascript
static referenceFields = {
    light: { 
        factory: () => KHRLight, collection: ['extensions', 'KHR_lights_punctual', 'lights'] 
        // converts { light: 0 } -> { light: <KHRLight instance from root.extensions.KHR_lights_punctual.lights[0]>}
    }
}
```

#### Inline Object Reference

When the field value contains a nested object (not an index), only specify the factory.

```javascript
static referenceFields = {
    target: { factory: () => AnimationChannelTarget }
    // converts { target: { ... } } -> { target: AnimationChannelTarget }
}
```

This will instantiate the factory class with the nested object data.

#### Nested Reference Fields

For complex objects with their own reference fields (like `attributes` in mesh primitives).

```javascript
static referenceFields = {
    attributes: { 
        referenceFields: {
            POSITION:   { factory: () => Accessor, collection: 'accessors' },
            NORMAL:     { factory: () => Accessor, collection: 'accessors' },
            TEXCOORD_0: { factory: () => Accessor, collection: 'accessors' },
        }
    }
}
```

This handles the cases similar to what is found in Primitive where the JSON structure is:
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

#### URL References

Special handling for URI fields that should be resolved relative to the glTF file's location.

```javascript
static referenceFields = {
    uri: { factory: () => URL }
}
```

Converts relative URI strings into absolute `URL` objects based on the `graph.uri` base URL.

#### JSON Pointer Resolver

It's possible to resolve a JSON pointers instead of numeric indices. The KHR_animation_pointer extension uses this approach.

```javascript
import { JSONPointer } from 'revelryengine/gltf/gltf-property.js';

static referenceFields = {
    pointer: { factory: () => JSONPointer }
}
```
Instead of a direct object reference, this creates a [JSONPointer](../gltf-property#jsonpointer) object that lazily evaluates the JSON Pointer path. The pointer string (e.g., `"/nodes/3/translation"`) is parsed to locate the target object and property.

The JSONPointer object has the following properties with:
- `target`: The object containing the property
- `path`: The property name
- `collection`: The root collection name
- `rootTarget`: The root collection target object

This is used for animation systems that need to target arbitrary properties anywhere in the scene graph.

#### Additional Options

- **`assign`**: Properties to merge into the resolved object
  ```javascript
  { material: { factory: () => Material, collection: 'materials', assign: { alpha: true } } }
  ```

- **`alias`**: Create an additional reference under a different name
  ```javascript
  { texture: { factory: () => Texture, collection: 'textures', alias: 'tex' } }
  // Result has both `texture` and `tex` pointing to the same instance
  ```

### Prepare JSON

`GLTFProperty.fromJSON` calls a companion hook named `prepareJSON(json, graph)` before it touches any reference fields. The default implementation simply ensures that `graph.root` is set (falling back to the JSON payload) and then returns the inputs unchanged, but subclasses can override the hook to inject validation, default graph metadata, or augmented JSON structures.

Guidelines for overriding:

1. Always call `super.prepareJSON` if you only need to extend the behavior. If no `graph.root` is provided, it will default to the top level object that prepareJSON was called on. If you do not call `super.prepareJSON`, you must set a root manually.
2. Return a `{ json, graph }` pair. Either value can be a new object if you need to mutate data without affecting the caller.
3. Never call `super.fromJSON` from inside the hook. The hook should be a pure transformation step; `fromJSON` invokes it automatically.

#### Example: Validating the root glTF document

`GLTF` overrides the hook to enforce version support before any of the collections are dereferenced:

```javascript
static prepareJSON(glTF, graph) {
  ensureSupport(glTF); // throws when the file targets an unsupported version/extension
  return super.prepareJSON(glTF, graph);
}
```

#### Example: Attaching parent context in an extension

Extensions that need information from their parent object can copy that data into the JSON payload before unmarshalling. The Draco mesh compression extension needs the decoded primitive’s attribute accessors, so it overrides the hook this way:

```javascript
static prepareJSON(extensionJSON, graph) {
  const primitive = graph?.parent;

  return {
    json: {
      ...extensionJSON,
      primitive: {
        indices:    primitive.indices,
        attributes: primitive.attributes,
      }
    },
    graph,
  };
}
```

Because the hook runs before the reference fields are resolved, the added `primitive` object is ready for the standard `referenceFields` definition (and still benefits from instance caching).

### Instance Caching

The fromJSON method maintains a `WeakMap` cache of instances per root glTF object. This ensures:
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
