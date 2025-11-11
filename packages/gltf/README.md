# Revelry Engine glTF

This Revelry Engine glTF library facilitates loading glTF/glb files and preparing them for the rendering pipeline. 

## Usage

This library has two main objectives:
 - [Simplify the glTF API](#simplify-the-gltf-api)
 - [Binary Data Initialization](#binary-data-initialization)

### Simplify the glTF API

This library simplifies the glTF object API by dereferencing indices into object references ahead of time. 

#### Example

In raw glTF JSON, relationships are expressed as numeric indices:

```json
{
    "nodes": [
        { "name": "MyNode", "mesh": 0, "children": [1, 2] }
    ],
    "meshes": [
        { "primitives": [...] }
    ]
}
```

This library automatically converts indices to direct object references:

```js
const gltf = GLTF.fromJSON(gltfJson);

// Instead of: gltf.meshes[gltfJson.nodes[0].mesh]
// You can access directly:
const node = gltf.nodes[0];
console.log(node.mesh); // Mesh instance, not index 0
console.log(node.children); // Array of Node instances, not [1, 2]
```

This makes working with glTF data more intuitive and type-safe.

### Binary Data Initialization

This library loads all binary data, textures, etc into buffers that are ready to be sent to the GPU.

#### Example

In raw glTF JSON, binary data is referenced by URIs or buffer views:

```json
{
    "buffers": [
        { "uri": "data.bin", "byteLength": 1024 }
    ],
    "images": [
        { "uri": "texture.png" }
    ]
}
```

This library automatically fetches and initializes all binary data:

```js
const gltf = await GLTF.load('https://example.com/model.gltf');

// Binary data is already loaded into ArrayBuffers
const buffer = gltf.buffers[0];
console.log(buffer.getArrayBuffer()); // ArrayBuffer ready for GPU upload

// Images are loaded and ready to create textures
const image = gltf.images[0];
console.log(image.blob); // Blob ready for texture creation

// Accessors provide typed views into buffer data
const accessor = gltf.accessors[0];
const positions = accessor.getTypedArray(); // Float32Array of vertex positions
```

This eliminates the need for manual fetching and parsing of external resources.

### Loading glTF Files

This library provides multiple ways to load glTF files depending on your use case.

#### Loading from a URL

Use the static `load` method to fetch a glTF file from a URL and automatically load all binary data:

```js
import { GLTF } from 'revelryengine/gltf/gltf.js';

// Load a .gltf or .glb file from a URL
const gltf = await GLTF.load('https://example.com/models/scene.gltf');

// Access the loaded data
console.log(gltf.scenes);
console.log(gltf.nodes);
console.log(gltf.meshes);

// Get the default scene
const scene = gltf.scene;
```

The `load` method automatically:
- Fetches the glTF/GLB file
- Parses JSON or binary format
- Loads all referenced binary buffers and images
- Instantiates all glTF objects and extensions

#### Loading from JSON

Use the static `fromJSON` method when you already have the glTF JSON data:

```js
import { GLTF } from 'revelryengine/gltf/gltf.js';

// Parse glTF from JSON data
const gltfJson = {
    asset: { version: '2.0' },
    scenes: [{ nodes: [0] }],
    nodes: [{ name: 'MyNode', mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    // ... more glTF data
};

const gltf = GLTF.fromJSON(gltfJson);

// The instance is created, but binary data isn't loaded yet
// Call load() to fetch all binary resources
await gltf.load();

// Now you can access fully loaded data
const node = gltf.nodes[0];
console.log(node.name); // 'MyNode'
```

#### Working with Extensions

Extensions are automatically instantiated when loading glTF files (via `load` or `fromJSON`):

```js
import { GLTF, NodeREVGameObject } from 'revelryengine/gltf/gltf.js';

const gltf = await GLTF.load('https://example.com/models/game-scene.gltf');

// Access extensions with full type safety
const node = gltf.nodes[0];
if (node.extensions.REV_game_object) {
    console.log(node.extensions.REV_game_object instanceof NodeREVGameObject); // true
    // Access extension properties
    console.log(node.extensions.REV_game_object.components);
}

// Access root-level extensions
if (gltf.extensions.KHR_lights_punctual) {
    const lights = gltf.extensions.KHR_lights_punctual.lights;
    console.log(lights); // Array of light objects
}
```

### Adding a new gltf extensions from your project

Follow the [Adding Extensions Guide](https://github.com/revelryengine/platform/blob/main/packages/gltf/DEVELOP.md#adding-extensions)

The process is mostly the same with two key diffreences. 

1. The import locations should use the `revelryengine` specifier.

```js
import { GLTFProperty } from 'revelryengine/gltf/gltf-property.js';
import { registry     } from 'revelryengine/gltf/extensions/registry.js';

/**
 * @import { glTFPropertyData, GLTFPropertyData, FromJSONGraph } from 'revelryengine/gltf/gltf-property.js';
 * @import { nodeEXTExampleExtensions, NodeEXTExampleExtensions } from '@revelryengine/gltf/extensions';
 */
```

2. You should skip step 3 and import your implementation file directly.


## Contributing

See the [Development Guide](https://github.com/revelryengine/platform/blob/main/packages/gltf/DEVELOP.md) for details on how to contribute to this library.


