// deno-lint-ignore-file no-empty-interface

/**
 * Augments the glTF extension interfaces to include KHR_xmp types.
 * @module @revelryengine/gltf/extensions
 */

declare module '@revelryengine/gltf/extensions' {
    interface glTFExtensions {
        /** A json object representing the KHR_xmp extension */
        'KHR_xmp'?: import('./KHR_xmp.js').khrXMP
    }
    interface GLTFExtensions {
        /** A KHRXMP instance */
        'KHR_xmp'?: import('./KHR_xmp.js').KHRXMP
    }

    interface assetExtensions {
        /** A json object representing the KHR_xmp extension */
        'KHR_xmp'?: import('./KHR_xmp.js').objectKHRXMP
    }
    interface AssetExtensions {
        /** A ObjectKHRXMP instance */
        'KHR_xmp'?: import('./KHR_xmp.js').ObjectKHRXMP
    }

    interface sceneExtensions {
        /** A json object representing the KHR_xmp extension */
        'KHR_xmp'?: import('./KHR_xmp.js').objectKHRXMP
    }
    interface SceneExtensions {
        /** A ObjectKHRXMP instance */
        'KHR_xmp'?: import('./KHR_xmp.js').ObjectKHRXMP
    }

    interface nodeExtensions {
        /** A json object representing the KHR_xmp extension */
        'KHR_xmp'?: import('./KHR_xmp.js').objectKHRXMP
    }
    interface NodeExtensions {
        /** A ObjectKHRXMP instance */
        'KHR_xmp'?: import('./KHR_xmp.js').ObjectKHRXMP
    }

    interface meshExtensions {
        /** A json object representing the KHR_xmp extension */
        'KHR_xmp'?: import('./KHR_xmp.js').objectKHRXMP
    }
    interface MeshExtensions {
        /** A ObjectKHRXMP instance */
        'KHR_xmp'?: import('./KHR_xmp.js').ObjectKHRXMP
    }

    interface materialExtensions {
        /** A json object representing the KHR_xmp extension */
        'KHR_xmp'?: import('./KHR_xmp.js').objectKHRXMP
    }
    interface MaterialExtensions {
        /** A ObjectKHRXMP instance */
        'KHR_xmp'?: import('./KHR_xmp.js').ObjectKHRXMP
    }

    interface imageExtensions {
        /** A json object representing the KHR_xmp extension */
        'KHR_xmp'?: import('./KHR_xmp.js').objectKHRXMP
    }
    interface ImageExtensions {
        /** A ObjectKHRXMP instance */
        'KHR_xmp'?: import('./KHR_xmp.js').ObjectKHRXMP
    }

    interface animationExtensions {
        /** A json object representing the KHR_xmp extension */
        'KHR_xmp'?: import('./KHR_xmp.js').objectKHRXMP
    }
    interface AnimationExtensions {
        /** A ObjectKHRXMP instance */
        'KHR_xmp'?: import('./KHR_xmp.js').ObjectKHRXMP
    }


    interface ExtendableProperties {
        /** KHRXMP property */
        KHRXMP: true,
        /** ObjectKHRXMP property */
        ObjectKHRXMP: true,
    }

    /** Interface for adding khrXMP extension json properties. */
    interface khrXMPExtensions {}
    /** Interface for adding KHRXMP extension instance properties. */
    interface KHRXMPExtensions {}

    /** Interface for adding objectKHRXMP extension json properties. */
    interface objectKHRXMPExtensions {}
    /** Interface for adding ObjectKHRXMP extension instance properties. */
    interface ObjectKHRXMPExtensions {}
}

