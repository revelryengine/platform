// deno-lint-ignore-file no-empty-interface

/**
 * glTF extension interfaces.
 * @module @revelryengine/gltf/extensions
 * @mergeTarget
 */
declare module '@revelryengine/gltf/extensions' {
    /**
     * glTF Properties that can be extended.
     */
    interface ExtendableProperties {
        /** Accessor property */
        Accessor: true,
        /** AccessorSparse property */
        AccessorSparse: true,
        /** AccessorSparseIndices property */
        AccessorSparseIndices: true,
        /** AccessorSparseValues property */
        AccessorSparseValues: true,
        /** Animation property */
        Animation: true,
        /** AnimationChannel property */
        AnimationChannel: true,
        /** AnimationChannelTarget property */
        AnimationChannelTarget: true,
        /** AnimationSampler property */
        AnimationSampler: true,
        /** Asset property */
        Asset: true,
        /** Buffer property */
        Buffer: true,
        /** BufferView property */
        BufferView: true,
        /** Camera property */
        Camera: true,
        /** CameraOrthographic property */
        CameraOrthographic: true,
        /** CameraPerspective property */
        CameraPerspective: true,
        /** GLTF property */
        GLTF: true,
        /** Image property */
        Image: true,
        /** Material property */
        Material: true,
        /** MaterialNormalTextureInfo property */
        MaterialNormalTextureInfo: true,
        /** MaterialOcclusionTextureInfo property */
        MaterialOcclusionTextureInfo: true,
        /** MaterialPBRMetallicRoughness property */
        MaterialPBRMetallicRoughness: true,
        /** Mesh property */
        Mesh: true,
        /** MeshPrimitive property */
        MeshPrimitive: true,
        /** MeshPrimitiveTarget property */
        MeshPrimitiveTarget: true,
        /** Node property */
        Node: true,
        /** Sampler property */
        Sampler: true,
        /** Scene property */
        Scene: true,
        /** Skin property */
        Skin: true,
        /** TextureInfo property */
        TextureInfo: true,
        /** Texture property */
        Texture: true,
    }

    /**
     * Names of glTF Properties that can be extended.
     */
    type ExtendablePropertyNames = Extract<keyof ExtendableProperties, string>;

    /** Interface for adding glTF accessor extensions json properties. */
    interface accessorExtensions {}
    /** Interface for adding glTF accessor sparse extensions json properties. */
    interface accessorSparseExtensions {}
    /** Interface for adding glTF accessor sparse indices extensions json properties. */
    interface accessorSparseIndicesExtensions {}
    /** Interface for adding glTF accessor sparse values extensions json properties. */
    interface accessorSparseValuesExtensions {}
    /** Interface for adding glTF animations extensions json properties. */
    interface animationExtensions {}
    /** Interface for adding glTF animation channels extensions json properties. */
    interface animationChannelExtensions {}
    /** Interface for adding glTF animation channel target extensions json properties. */
    interface animationChannelTargetExtensions {}
    /** Interface for adding glTF animation sampler extensions json properties. */
    interface animationSamplerExtensions {}
    /** Interface for adding glTF asset extensions json properties. */
    interface assetExtensions {}
    /** Interface for adding glTF buffer extensions json properties. */
    interface bufferExtensions {}
    /** Interface for adding glTF buffer view extensions json properties. */
    interface bufferViewExtensions {}
    /** Interface for adding glTF camera extensions json properties. */
    interface cameraExtensions {}
    /** Interface for adding glTF orthographic camera extensions json properties. */
    interface cameraOrthographicExtensions {}
    /** Interface for adding glTF perspective camera extensions json properties. */
    interface cameraPerspectiveExtensions {}
    /** Interface for adding root glTF-level extensions json properties. */
    interface glTFExtensions {}
    /** Interface for adding glTF image extensions json properties. */
    interface imageExtensions {}
    /** Interface for adding glTF material extensions json properties. */
    interface materialExtensions {}
    /** Interface for adding glTF material normal texture info extensions json properties. */
    interface materialNormalTextureInfoExtensions {}
    /** Interface for adding glTF material occlusion texture info extensions json properties. */
    interface materialOcclusionTextureInfoExtensions {}
    /** Interface for adding glTF metallic-roughness material extensions json properties. */
    interface materialPBRMetallicRoughnessExtensions {}
    /** Interface for adding glTF mesh extensions json properties. */
    interface meshExtensions {}
    /** Interface for adding glTF mesh primitive extensions json properties. */
    interface meshPrimitiveExtensions {}
    /** Interface for adding glTF mesh primitive target extensions json properties. */
    interface meshPrimitiveTargetExtensions {}
    /** Interface for adding glTF node extensions json properties. */
    interface nodeExtensions {}
    /** Interface for adding glTF sampler extensions json properties. */
    interface samplerExtensions {}
    /** Interface for adding glTF scene extensions json properties. */
    interface sceneExtensions {}
    /** Interface for adding glTF skin extensions json properties. */
    interface skinExtensions {}
    /** Interface for adding glTF texture info extensions json properties. */
    interface textureInfoExtensions {}
    /** Interface for adding glTF texture extensions json properties. */
    interface textureExtensions {}

    /** Interface for adding glTF accessor extensions instance properties. */
    interface AccessorExtensions {}
    /** Interface for adding glTF accessor sparse extension instance properties. */
    interface AccessorSparseExtensions {}
    /** Interface for adding glTF accessor sparse indices extension instance properties. */
    interface AccessorSparseIndicesExtensions {}
    /** Interface for adding glTF accessor sparse values extension instance properties. */
    interface AccessorSparseValuesExtensions {}
    /** Interface for adding glTF animation extension instance properties. */
    interface AnimationExtensions {}
    /** Interface for adding glTF animation channel extension instance properties. */
    interface AnimationChannelExtensions {}
    /** Interface for adding glTF animation channel target extension instance properties. */
    interface AnimationChannelTargetExtensions {}
    /** Interface for adding glTF animation sampler extension instance properties. */
    interface AnimationSamplerExtensions {}
    /** Interface for adding glTF asset extension instance properties. */
    interface AssetExtensions {}
    /** Interface for adding glTF buffer extension instance properties. */
    interface BufferExtensions {}
    /** Interface for adding glTF buffer view extension instance properties. */
    interface BufferViewExtensions {}
    /** Interface for adding glTF camera extension instance properties. */
    interface CameraExtensions {}
    /** Interface for adding glTF orthographic camera extension instance properties. */
    interface CameraOrthographicExtensions {}
    /** Interface for adding glTF perspective camera extension instance properties. */
    interface CameraPerspectiveExtensions {}
    /** Interface for adding root glTF-level extension instance properties. */
    interface GLTFExtensions {}
    /** Interface for adding glTF image extension instance properties. */
    interface ImageExtensions {}
    /** Interface for adding glTF material extension instance properties. */
    interface MaterialExtensions {}
    /** Interface for adding glTF material normal texture info extension instance properties. */
    interface MaterialNormalTextureInfoExtensions {}
    /** Interface for adding glTF material occlusion texture info extension instance properties. */
    interface MaterialOcclusionTextureInfoExtensions {}
    /** Interface for adding glTF metallic-roughness material extension instance properties. */
    interface MaterialPBRMetallicRoughnessExtensions {}
    /** Interface for adding glTF mesh extension instance properties. */
    interface MeshExtensions {}
    /** Interface for adding glTF mesh primitive extension instance properties. */
    interface MeshPrimitiveExtensions {}
    /** Interface for adding glTF mesh primitive target extension instance properties. */
    interface MeshPrimitiveTargetExtensions {}
    /** Interface for adding glTF node extension instance properties. */
    interface NodeExtensions {}
    /** Interface for adding glTF sampler extension instance properties. */
    interface SamplerExtensions {}
    /** Interface for adding glTF scene extension instance properties. */
    interface SceneExtensions {}
    /** Interface for adding glTF skin extension instance properties. */
    interface SkinExtensions {}
    /** Interface for adding glTF texture info extension instance properties. */
    interface TextureInfoExtensions {}
    /** Interface for adding glTF texture extension instance properties. */
    interface TextureExtensions {}
}

