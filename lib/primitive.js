import { GLTFProperty } from './gltf-property.js';
import { MorphTarget  } from './morph-target.js';

/**
 * Geometry to be rendered with the given material.
 * @typedef {glTFProperty} primitive
 * @property {Object} attributes - A dictionary object, where each key corresponds to mesh attribute semantic and each
 * value is the index of the accessor containing attribute's data.
 * @property {Number} [indices] - The index of the accessor that contains the indices.
 * @property {Number} [material] - The index of the material to apply to this primitive when rendering.
 * @property {Number} [mode=4] - The type of primitives to render.
 * @property {Object} [targets] - An array of Morph Targets, each Morph Target is a dictionary mapping attributes (only
 * `POSITION`, `NORMAL`, and `TANGENT` supported) to their deviations in the Morph Target.
 *
 * @see https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#primitive
 */

let ids = 0;
/**
 * A class wrapper around the glTF primitive object.
 */
export class Primitive extends GLTFProperty {
    /**
     * Creates an instance of Primitive.
     * @param {primitive} primitive - The properties of the primitive.
     */
    constructor(primitive) {
        super(primitive);
        
        Object.defineProperty(this, '$id', { value: ids++ });
        
        const { attributes, indices, material, mode = 4, targets } = primitive;
        
        /**
         * A dictionary object, where each key corresponds to mesh attribute semantic and each value is the Accssor or the
         * index of the Accessor containing attribute's data.
         * @type {Object.<String, Number>|Object.<String, Accessor>}
         */
        this.attributes = attributes;
        
        /**
         * The Accessor or the index of the Accessor that contains the indices.
         * @type {Number|Accessor}
         */
        this.indices = indices;
        
        /**
         * The Material or the index of the Material to apply to this primitive when rendering.
         * @type {Number|Material}
         */
        this.material = material;
        
        /**
         * The type of primitives to render.
         * @type {Number}
         */
        this.mode = mode;
        
        /**
         * An array of Morph Targets, each Morph Target is a dictionary mapping attributes (only
         * `POSITION`, `NORMAL`, and `TANGENT` supported) to their deviations in the Morph Target.
         * @type {MorphTarget[]}
         */
        this.targets = targets && targets.map(target => new MorphTarget(target));
    }
    
    static referenceFields = [
        { name: 'indices',    type: 'collection', collection: 'accessors' },
        { name: 'material',   type: 'collection', collection: 'materials' },
        { name: 'attributes', type: 'collection', collection: 'accessors' },
        { name: 'targets',    type: 'sub' },
    ];
    
    /**
     * Dereference glTF index properties.
     * @param {WebGLTF} root - The root WebGLTF object.
     */
    dereference(root) {
        super.dereference(root);
        if (this.indices && this.indices.bufferView) this.indices.bufferView.target = WebGLRenderingContext.ELEMENT_ARRAY_BUFFER;
    }
}

export default Primitive;

