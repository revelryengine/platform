// deno-lint-ignore-file no-empty-interface

/**
 * Augments the glTF extension interfaces to include KHR_xmp_json_ld types.
 * @module @revelryengine/gltf/extensions
 */

declare module '@revelryengine/gltf/extensions' {
    interface glTFExtensions {
        /** A json object representing the KHR_xmp_json_ld extension */
        'KHR_xmp_json_ld'?: import('./KHR_xmp_json_ld.js').khrXMPJSONLD,
    }
    interface GLTFExtensions {
        /** A KHRXMP instance */
        'KHR_xmp_json_ld'?: import('./KHR_xmp_json_ld.js').KHRXMPJSONLD,
    }

    interface assetExtensions {
        /** A json object representing the KHR_xmp_json_ld extension */
        'KHR_xmp_json_ld'?: import('./KHR_xmp_json_ld.js').objectKHRXMPJSONLD,
    }
    interface AssetExtensions {
        /** A ObjectKHRXMP instance */
        'KHR_xmp_json_ld'?: import('./KHR_xmp_json_ld.js').ObjectKHRXMPJSONLD,
    }

    interface sceneExtensions {
        /** A json object representing the KHR_xmp_json_ld extension */
        'KHR_xmp_json_ld'?: import('./KHR_xmp_json_ld.js').objectKHRXMPJSONLD,
    }
    interface SceneExtensions {
        /** A ObjectKHRXMP instance */
        'KHR_xmp_json_ld'?: import('./KHR_xmp_json_ld.js').ObjectKHRXMPJSONLD,
    }

    interface nodeExtensions {
        /** A json object representing the KHR_xmp_json_ld extension */
        'KHR_xmp_json_ld'?: import('./KHR_xmp_json_ld.js').objectKHRXMPJSONLD,
    }
    interface NodeExtensions {
        /** A ObjectKHRXMP instance */
        'KHR_xmp_json_ld'?: import('./KHR_xmp_json_ld.js').ObjectKHRXMPJSONLD,
    }

    interface meshExtensions {
        /** A json object representing the KHR_xmp_json_ld extension */
        'KHR_xmp_json_ld'?: import('./KHR_xmp_json_ld.js').objectKHRXMPJSONLD,
    }
    interface MeshExtensions {
        /** A ObjectKHRXMP instance */
        'KHR_xmp_json_ld'?: import('./KHR_xmp_json_ld.js').ObjectKHRXMPJSONLD,
    }

    interface materialExtensions {
        /** A json object representing the KHR_xmp_json_ld extension */
        'KHR_xmp_json_ld'?: import('./KHR_xmp_json_ld.js').objectKHRXMPJSONLD,
    }
    interface MaterialExtensions {
        /** A ObjectKHRXMP instance */
        'KHR_xmp_json_ld'?: import('./KHR_xmp_json_ld.js').ObjectKHRXMPJSONLD,
    }

    interface imageExtensions {
        /** A json object representing the KHR_xmp_json_ld extension */
        'KHR_xmp_json_ld'?: import('./KHR_xmp_json_ld.js').objectKHRXMPJSONLD,
    }
    interface ImageExtensions {
        /** A ObjectKHRXMP instance */
        'KHR_xmp_json_ld'?: import('./KHR_xmp_json_ld.js').ObjectKHRXMPJSONLD,
    }

    interface animationExtensions {
        /** A json object representing the KHR_xmp_json_ld extension */
        'KHR_xmp_json_ld'?: import('./KHR_xmp_json_ld.js').objectKHRXMPJSONLD,
    }
    interface AnimationExtensions {
        /** A ObjectKHRXMP instance */
        'KHR_xmp_json_ld'?: import('./KHR_xmp_json_ld.js').ObjectKHRXMPJSONLD,
    }


    interface ExtendableProperties {
        /** KHRXMP property */
        KHRXMPJSONLD: true,
        /** ObjectKHRXMP property */
        ObjectKHRXMPJSONLD: true,
    }

    /** Interface for adding khrXMPJSONLD extension json properties. */
    interface khrXMPJSONLDExtensions {}
    /** Interface for adding KHRXMPJSONLD extension instance properties. */
    interface KHRXMPJSONLDExtensions {}

    /** Interface for adding objectKHRXMPJSONLD extension json properties. */
    interface objectKHRXMPJSONLDExtensions {}
    /** Interface for adding ObjectKHRXMPJSONLD extension instance properties. */
    interface ObjectKHRXMPJSONLDExtensions {}
}

