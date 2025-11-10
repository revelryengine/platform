/// <reference path="./lib.revelry.d.ts" />

import { Model, System    } from 'revelryengine/ecs/ecs.js';
import { vec3, quat, mat4 } from 'revelryengine/deps/gl-matrix.js';
import { Node as GLTFNode, NodeREVGameObject  } from 'revelryengine/gltf/gltf.js';
import { NonNull } from 'revelryengine/utils/utils.js';
import { TransformUtils } from './transform.js';

const _matrix = mat4.create();

/**
 * @import { SystemBundle, ComponentTypeSchema } from 'revelryengine/ecs/ecs.js';
 * @import { EULER_ORDER, ROTATION_MODE } from './transform.js';
 */

export const MetaSchema = /** @type {const} @satisfies {ComponentTypeSchema}*/({
    type: 'object',
    properties: {
        name:    { type: 'string'  },
        hidden:  { type: 'boolean', default: false },
        parent:  { type: 'string',  component: 'meta' },
    },
    observed: ['name', 'hidden', 'parent'],
    required: ['name'],
});

export class GameObjectNode extends GLTFNode {
    /**
     * @param {GameObjectModel} model
     */
    constructor(model) {
        super({
            children: []
        });

        this.extensions = {
            REV_game_object: new NodeREVGameObject({ id: model.entity }),
        };

        this.model = model;

        const meta      = model.components.meta.value;
        const transform = model.components.transform.value;
        const rotation  = quat.create(); //rotation may be in another rotation mode and gltf expects a quaternion

        Object.defineProperties(this, {
            translation: { get: () => transform.translation },
            rotation:    { get: () => TransformUtils.getRotation(transform, rotation) },
            scale:       { get: () => transform.scale },
        });

        Object.defineProperties(this.extensions.REV_game_object, {
            hidden:  { get: () => meta.hidden },
        });
    }
}

export class GameObjectModel extends Model.Typed(/** @type {const} */({
    components: ['meta', 'transform'],
    events: /** @type {{ 'node:add': GLTFNode, 'node:delete': GLTFNode, 'node:update': void, 'parent:resolve': GameObjectModel | undefined }} */({}),
})) {
    node = new GameObjectNode(this);

    get name() {
        return this.components.meta.value.name;
    }

    set name(v) {
        this.components.meta.value.name = v;
    }

    get hidden() {
        return !!this.components.meta.value.hidden;
    }

    set hidden(v) {
        this.components.meta.value.hidden = v;
    }

    get parent() {
        return this.components.meta.value.parent;
    }

    set parent(v) {
        this.components.meta.value.parent = v;
    }

    get orphaned() {
        return this.parent ? !this.stage.getEntityModel(this.parent, GameObjectModel) : false;
    }

    /**
     * @param {GLTFNode} node
     */
    addChildNode(node) {
        if(this.node.children.includes(node)) return;
        this.node.children.push(node);
        this.notify('node:add', node);
    }

    /**
     * @param {GLTFNode} node
     */
    deleteChildNode(node) {
        if(!this.node.children.includes(node)) return;
        this.node.children.splice(this.node.children.indexOf(node), 1);
        this.notify('node:delete', node);
    }

    * children() {
        for(const node of this.node.children) {
            const id = node.extensions?.REV_game_object?.id;
            if(id) {
                const child = this.stage.getEntityModel(id, GameObjectModel);
                if(child) yield child;
            }
        }
    }

    /**
     * Bottom up iteration of ancestors
     */
    * ancestors() {
        const parents = []

        let search = this.parent ? this.stage.getEntityModel(this.parent, GameObjectModel) : undefined;

        while (search) {
            parents.push(search);
            search = search.parent ? this.stage.getEntityModel(search.parent, GameObjectModel) : undefined;
        }

        yield * parents;
    }


    /**
     * @param {mat4} [out]
     */
    getWorldMatrix(out = mat4.create()) {
        for(const parent of this.ancestors()) {
            const transform = parent.components.transform.value;
            mat4.fromRotationTranslationScale(_matrix, transform.rotation, transform.translation, transform.scale);
            mat4.multiply(out, _matrix, out);
        }
        const transform = this.components.transform.value;
        mat4.fromRotationTranslationScale(_matrix, transform.rotation, transform.translation, transform.scale);
        mat4.multiply(out, out, _matrix);
        return out;
    }

    /**
     * @param {vec3} [out]
     */
    getWorldTranslation(out = vec3.create()) {
        mat4.getTranslation(out, this.getWorldMatrix());
        return out;
    }

    /**
     * @param {quat} [out]
     */
    getWorldRotation(out = quat.create()) {
        mat4.getRotation(out, this.getWorldMatrix());
        return out;
    }

    /**
     * @param {vec3} [out]
     */
    getWorldScale(out = vec3.create()) {
        mat4.getScaling(out, this.getWorldMatrix());
        return out;
    }

    /**
     * @param {{ translation?: vec3, rotation?: quat, scale?: vec3, rotationMode?: ROTATION_MODE }} value
     */
    setTransform({ translation, rotation, scale, rotationMode }) {
        TransformUtils.setTransform(this.components.transform.value, { translation, rotation, scale, rotationMode });
        this.components.transform.notify('value:change');
    }

    /**
     * @param {vec3} [out]
     */
    getTranslation(out) {
        return TransformUtils.getTranslation(this.components.transform.value, out);
    }

    /**
     * @param {vec3} translation
     */
    setTranslation(translation) {
        TransformUtils.setTranslation(this.components.transform.value, translation);
        this.components.transform.notify('value:change');
    }

    /**
     * @param {vec3} [out]
     */
    getScale(out) {
        return TransformUtils.getScale(this.components.transform.value, out);
    }

    /**
     * @param {vec3} scale
     */
    setScale(scale) {
        TransformUtils.setScale(this.components.transform.value, scale);
        this.components.transform.notify('value:change');
    }

    /**
     * @param {quat} [out]
     */
    getRotation(out = vec3.create()) {
        return TransformUtils.getAxisAngle(this.components.transform.value, out);
    }

    /**
     * @param {quat} q
     */
    setRotation(q) {
        TransformUtils.setRotation(this.components.transform.value, q);
        this.components.transform.notify('value:change');
    }

    /**
     * @param {vec3} [out]
     */
    getEuler(out = vec3.create()) {
        return TransformUtils.getEuler(this.components.transform.value, out);
    }

    /**
     * @param {vec3} euler
     * @param {EULER_ORDER} [order]
     */
    setEuler(euler, order) {
        TransformUtils.setEuler(this.components.transform.value, euler, order);
        this.components.transform.notify('value:change');
    }

    /**
     * @param {vec3} out
     */
    getAxisAngle(out = vec3.create()) {
        return TransformUtils.getAxisAngle(this.components.transform.value, out);
    }

    /**
     * @param {vec3} axis
     * @param {number} angle
     */
    setAxisAngle(axis, angle) {
        TransformUtils.setAxisAngle(this.components.transform.value, axis, angle);
        this.components.transform.notify('value:change');
    }

    /**
     * Change the rotation mode
     * @param {ROTATION_MODE} mode
     */
    changeRotationMode(mode) {
        TransformUtils.changeRotationMode(this.components.transform.value, mode);
        this.components.transform.notify('value:change');
    }

    /**
     * Sets the rotation from a quat while maintining the current rotation mode.
     * @param {quat} q
     */
    setRotationFromQuat(q) {
        TransformUtils.setRotationFromQuat(this.components.transform.value, q);
        this.components.transform.notify('value:change');
    }

    /**
     * Sets the rotation from an axis angle while maintining the current rotation mode.
     * @param {vec3} axis
     * @param {number} angle
     */
    setRotationFromAxisAngle(axis, angle) {
        TransformUtils.setRotationFromAxisAngle(this.components.transform.value, axis, angle);
        this.components.transform.notify('value:change');
    }

    /**
     * Sets the rotation from euler angles while maintining the current rotation mode.
     * @param {vec3} euler
     * @param {EULER_ORDER} [order]
     */
    setRotationFromEuler(euler, order = 'zyx') {
        TransformUtils.setRotationFromEuler(this.components.transform.value, euler, order);
        this.components.transform.notify('value:change');
    }

    /**
     * @param {vec3} translation
     */
    translate(translation) {
        TransformUtils.translate(this.components.transform.value, translation);
        this.components.transform.notify('value:change');
    }

    /**
     * @param {vec3} scale
     */
    scale(scale) {
        TransformUtils.scale(this.components.transform.value, scale);
        this.components.transform.notify('value:change');
    }

    /**
     * @param {quat} q
     */
    rotate(q){
        TransformUtils.rotate(this.components.transform.value, q);
        this.components.transform.notify('value:change');
    }

    /**
     * @param {vec3} euler
     */
    rotateEuler(euler) {
        TransformUtils.rotateEuler(this.components.transform.value, euler);
        this.components.transform.notify('value:change');
    }

    /**
     * Rotate the transform by an axis angle
     *
     * @overload
     * @param {vec3} axis
     * @param {number} angle
     * @return {void}
     *
     * @overload
     * @param {vec4} axisAngle
     * @return {void}
     *
     * @param {vec3|vec4} axis
     * @param {number} [angle]
     */
    rotateAxisAngle(axis, angle = axis[3] ?? 0) {
        TransformUtils.rotateAxisAngle(this.components.transform.value, axis, angle);
        this.components.transform.notify('value:change');
    }
}

export class GameObjectSystem extends System.Typed(/** @type {const} */({
    id: 'game-object',
    models: {
        gameObjects: { model: GameObjectModel, isSet: true },
    },
    events: /** @type {{ 'root:change': void }} */({}),
})) {
    /**
     * @type {Map<string, GameObjectModel>}
     */
    #gameObjects = new Map();

    /**
     * @param {GameObjectModel} model
     */
    onModelAdd(model) {
        this.#gameObjects.set(model.entity, model);


        this.#addNodeToParent(model);
        model.components.meta.watch('value:change:/parent', (previousParent) => {
            if(previousParent) this.#gameObjects.get(previousParent)?.deleteChildNode(model.node);
        });

        model.components.meta.watch(() => this.#addNodeToParent(model));
    }

    /**
     * @param {GameObjectModel} model
     */
    #addNodeToParent(model) {
        if(!model.parent) {
            this.notify('root:change');
        } else {
            this.#gameObjects.get(model.parent)?.addChildNode(model.node);
            this.notify('orphan:change');
        }
    }

    /**
     * @param {GameObjectModel} model
     */
    onModelDelete(model) {
        this.#gameObjects.delete(model.entity);

        if(!model.parent) {
            this.notify('root:change');
        } else {
            this.#gameObjects.get(model.parent)?.deleteChildNode(model.node);
            this.notify('orphan:change');
        }
    }

    /**
     * @param {string} id
     */
    getGameObject(id) {
        return this.#gameObjects.get(id);
    }

    getAllGameObjects() {
        return [...this.#gameObjects.values()];
    }

    getRootGameObjects() {
        return [...this.#gameObjects.values()].filter(gameObject => !gameObject.parent);
    }

    getOrphanGameObjects() {
        return [...this.#gameObjects.values()].filter(gameObject => gameObject.orphaned);
    }

    /**
     * @param {string} name
     * @param {Set<string>} [subset]
     */
    getUnusedNameIncrement(name, subset) {
        const names = new Set();
        for(const gameObject of this.#gameObjects.values()) {
            const meta = gameObject.components.meta.value;
            if(meta.name.startsWith(name)) names.add(meta.name);
        }
        if(!names.has(name) && !subset?.has(name)) return name;

        let [,unenumerated, numeral] = /(.+?)(\d*)$/.exec(name) ?? [];

        unenumerated = unenumerated?.trim();

        let count  = Number(numeral) || 1;
        let search = unenumerated;
        while (names.has(search) || subset?.has(search)) {
            search = `${unenumerated} ${++count}`;
        }
        return search;
    }
}

/** @satisfies {SystemBundle} */
export const bundle = {
    systems: [GameObjectSystem],
    schemas: { meta: MetaSchema }
}
