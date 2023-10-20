import { System                 } from 'revelryengine/ecs/lib/system.js';
import { Model                  } from 'revelryengine/ecs/lib/model.js';
import { WeakCache              } from 'revelryengine/ecs/lib/utils/weak-cache.js';
import { GLTF                   } from 'revelryengine/gltf/lib/gltf.js';
import { Node                   } from 'revelryengine/gltf/lib/node.js';
import { Camera                 } from 'revelryengine/gltf/lib/camera.js';
import { KHRLightsPunctualLight } from 'revelryengine/gltf/lib/extensions/KHR_lights_punctual.js';
import { Renderer               } from 'revelryengine/renderer/lib/renderer.js';

await Renderer.requestDevice();

/**
 * @typedef {{  
 *     worldRender: { value: {} },
 *     camera: { value: { name?: string } },
 *     light:  { value: { name?: string } },
 * } & import('./mesh.js').ComponentTypes & import('./game-object.js').ComponentTypes } ComponentTypes
 */

const types = /** @type {ComponentTypes} */({});
const TypedModel  = Model.Typed(types);
const TypedSystem = System.Typed(types);

export class WorldRenderModel extends TypedModel({
    components: {
        settings: { type: 'worldRender' },
    } 
}) {}

export class CameraModel extends TypedModel({
    components: {
        camera:    { type: 'camera'    },
        transform: { type: 'transform' },
    }
}) {
    node = new Node({ name: this.camera.name, matrix: this.transform, camera: new Camera(this.camera) });

    get renderPath() {
        return this.camera.renderPath;
    }
}

export class LightModel extends TypedModel({
    components: {
        light:     { type: 'light'     },
        transform: { type: 'transform' },
    }
}) {
    node = new Node({ name: this.light.name, matrix: this.transform, extensions: { KHR_lights_punctual: { light: new KHRLightsPunctualLight(this.light) } } });
}

export class RendererSystem extends TypedSystem({
    models: {
        worldRender: { model: WorldRenderModel         },
        cameras:     { model: CameraModel, isSet: true },
        lights:      { model: LightModel,  isSet: true },
    }
}) {
    id = 'renderer';

    gltf = new GLTF({ 
        asset: { 
            version: '2.0', generator: 'Reverly Engine Runtime Generation',
        },
        scenes: [{ name: 'Revelry Engine Runtime Scene' }],
        scene: 0,
    });

    /**
     * @param {WorldRenderModel|CameraModel|LightModel} model
     * @param {'render'|'cameras'|'lights'} key
     */
    onModelAdd(model) {
        if(model instanceof WorldRenderModel) {
            this.renderer = new Renderer({ ...this.worldRender.settings });
            this.graph    = this.renderer.getSceneGraph(this.gltf.scene);
        } else {
            if(model.node) this.addGraphNode(model.node);

            model.watch('transform:notify', { 
                deferred: true,
                handler:  () => model.node && this.updateGraphNode(model.node),
            });
        }
    }

    /**
     * @param {WorldRenderModel|CameraModel|LightModel} model
     * @param {'render'|'cameras'|'lights'} key
     */
    onModelDelete(model) {
        if(model instanceof WorldRenderModel) {
            this.renderer = null;
            this.graph    = null;
        } else if(model.node) {
            this.deleteGraphNode(model.node);
        }
    }

    /**
     * @param {import('revelryengine/gltf/lib/node.js').Node} node
     */
    addGraphNode(node) {
        this.gltf.scene.nodes.push(node);
        this.graph.updateNode(node);
    }

     /**
     * @param {import('revelryengine/gltf/lib/node.js').Node} node
     */
    updateGraphNode(node) {
        this.graph.updateNode(node);
    }

    /**
     * @param {import('revelryengine/gltf/lib/node.js').Node} node
     */
    deleteGraphNode(node) {
        const index = this.gltf.scene.nodes.indexOf(node);
        if(index !== -1) {
            this.gltf.scene.nodes.splice(this.gltf.scene.nodes.indexOf(node), 1);
            this.graph.deleteNode(node);
        }
    }

    /** @type {WeakCache<{ frustum: import('revelryengine/renderer/lib/frustum.js').Frustum }>} */
    #cameraCache = new WeakCache();
    update() {
        if(!this.renderer) return;

        const { renderer, graph } = this;

        for(const camera of this.cameras) {
            const cache = this.#cameraCache.ensure(camera);
            cache.frustum ??= renderer.createFrustum();

            graph.updateNode(camera.node);
            cache.frustum.update({ graph, cameraNode: camera.node });
        }
    }

    render() {
        if(!this.renderer) return;

        const { renderer, graph } = this;

        for(const camera of this.cameras) {
            const { renderPath = 'standard' } = camera;
            const { frustum } = this.#cameraCache.get(camera);

            renderer.render({ graph, frustum, renderPath });
        }
    }

    /** @param {string} cameraEntityId */
    getCameraFrustum(cameraEntityId) {
        const model = this.stage?.getEntityModel(cameraEntityId, CameraModel);
        return model && this.#cameraCache.get(model)?.frustum;
    }
}

export default RendererSystem;