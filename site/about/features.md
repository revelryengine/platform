# Revelry Engine Features

## Editor

Because Revelry Engine is written with web technologies first, the editor can be fully integrated in an IDE that supports web view extensions such as VS Code and VS Codium. This allows developers to write code and create game content in the same application.

Features:
  - Stage Editor
  - Prefab Editor
  - Asset Viewer
  - Customizable UI
  - Support for Add-ons

### VS Code Extension

> [!IMPORTANT]
> **Coming Soon** To the VS Code Marketplace and Open VSX Registry


## Renderer

The Reverly Engine renderer is a WebGPU first forward renderer. It supports an automatic fallback to WebGL2 on devices that do not support WebGPU. The renderer is a runtime implementation of the glTF 2.0 specification with support for additional extensions and renderering features.

Features:
  - Physically Based Rendering as defined in the glTF 2.0 Specification
    - Implemented glTF Extensions:
      - KHR_animation_pointer
      - KHR_draco_mesh_compression
      - KHR_environment_map
      - KHR_lights_punctual
      - KHR_materials_clearcoat
      - KHR_materials_emissive_strength
      - KHR_materials_ior
      - KHR_materials_iridescence
      - KHR_materials_sheen
      - KHR_materials_specular
      - KHR_materials_transmission
      - KHR_materails_unlit
      - KHR_materails_variants
      - KHR_materails_volume
      - KHR_texture_basisu
      - KHR_texture_transform
      - KHR_xmp_json_ld
      - EXT_texture_webp
    - Coming Soon:
      - KHR_materials_anisotropy
      - KHR_materials_dispersion
      - KHR_materials_diffuse_transmission
  - Screenspace Ambient Occlusion
  - Motion Blur
  - MSAA
  - TAA
  - Bloom
  - Cascaded Shadow Maps
  - Depth of Field
  - Transparency Modes:
    - Sorted
    - Weighted (Order Independant Transparency)
  - Object outlining
  - Render Modes:
    - Standard glTF
    - Solid
    - Material Preview
    - Wireframe
    - Additional custom modes can be added via addon


## ECS

Revelry Engine is built on the Entity Component Systems (ECS) architecture, a popular and efficient design pattern used in game development. This architecture allows for greater flexibility and scalability, making it easier for developers to manage complex systems and behaviors in their games.

Revelry Engine uses the Entity Component Systems (ECS) architecture. In ECS, every object in a game's world is an Entity, which consists of one or more Components that give it behavior. Systems provide the logic that manipulates these entities. This architecture allows for a high degree of flexibility and scalability, making it easier to manage complex systems and behaviors in your games.

## Web Component Based UI

> [!IMPORTANT]
> **Details Coming Soon**


## Controller/Gamepad Support

> [!IMPORTANT]
> **Details Coming Soon**

## Future Plans

- Steam Bundler
  - Steam Input
  - Steam Interface Overlay
  - Steam Networking

