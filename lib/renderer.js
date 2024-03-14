import { Model, System                                } from '../deps/ecs.js';
import { GLTF, Node as GLTFNode, Camera as GLTFCamera } from '../deps/gltf.js';
import { Renderer                                     } from '../deps/renderer.js';
import { CanvasAutoResizer, NonNull                   } from '../deps/utils.js';
import { quat, vec3                                   } from '../deps/gl-matrix.js';

import { bundle as OrbitBundle } from './orbit-controls.js';

import { KHRLightsPunctualLight, KHRLightsPunctualNode, KHREnvironmentMapScene } from '../deps/gltf.js';


await Renderer.requestDevice();


const FORWARD = vec3.fromValues(0, 0, -1);

export class CameraModel extends Model.Typed({
    components: {
        transform: { type: 'transform' },
        camera:    { type: 'camera'    },
    },
}) {
    node = /**@type {import('../deps/renderer.js').ViewportCameraNode} */(new GLTFNode({ matrix: this.transform, camera: this.camera }));

    /**
     * @type {HTMLCanvasElement|null}
     */
    #canvas = null;

    get canvas() { return NonNull(this.#canvas) }

    /**
     * @type {import('../deps/renderer.js').Viewport|null}
     */
    #viewport = null;

    get viewport() { return NonNull(this.#viewport) }


    /**
     * @type {CanvasAutoResizer|null}
     */
    #autoResizer = null;


    #forward  = vec3.create();
    #rotation = quat.create();
    /**
     * @param {Revelry.ECS.Stage} stage
     * @param {string} entity
     */
    constructor(stage, entity) {
        super(stage, entity);

        this.transform.watch(() => {
            vec3.transformQuat(this.#forward, FORWARD, this.transform.getRotation(this.#rotation));
            vec3.normalize(this.#forward, this.#forward);
        });

        this.reconfigure();
    }

    get forward() {
        return this.#forward;
    }

    reconfigure() {
        const { renderOptions } = this.camera;

        const target = renderOptions?.target ?? { type: 'canvas', autosize: true, scale: 1 };

        this.#canvas ??= document.createElement('canvas');

        if('width' in target) {
            this.#canvas.width  = target.width;
            this.#canvas.height = target.height;
        } else {
            this.#autoResizer?.stop();
            this.#autoResizer = new CanvasAutoResizer({
                canvas:      this.#canvas,
                renderScale: (target.scale ?? 1) / devicePixelRatio,
                onresize:    () => {
                    this.viewport.reconfigure();

                    const graph = this.stage.getContext('renderer')?.graph;
                    if(graph) {
                        this.viewport.render({ graph, cameraNode: this.node });
                    }
                },
            });
        }

        this.#viewport ??= this.stage.getContext('renderer').renderer.createViewport({ ...renderOptions, target: { type: 'canvas', canvas: this.canvas } });
        this.#viewport.reconfigure(this.camera.renderOptions);
    }


    cleanup(){
        this.#autoResizer?.stop();
        this.#viewport?.destroy();
    }

    get type() { return this.camera.type; }
    set type(v) { this.camera.type = v;   }

    get renderPath() {
        return this.camera.renderOptions?.renderPath;
    }

    set renderPath(v) {
        const oldValue = this.camera.renderOptions?.renderPath;
        this.camera.renderOptions ??= {};
        this.camera.renderOptions.renderPath = v;
        if(oldValue !== v) {
            this.#viewport?.destroy();
            this.#viewport = null;
            this.reconfigure();
        }
    }

    get renderFlags() {
        return this.viewport.renderPath.settings.flags;
    }

    get renderValues() {
        return this.viewport.renderPath.settings.values;
    }

    get frustum() {
        return this.viewport.frustum;
    }

    get aspectRatio() {
        return this.camera.getAspectRatio() ?? (this.viewport ? this.viewport.width / this.viewport.height : 1);
    }
}

export class LightModel extends Model.Typed({
    components: {
        light:     { type: 'light'     },
        transform: { type: 'transform' },
    }
}) {
    node = new GLTFNode({ name: this.light.name, matrix: this.transform, extensions: { KHR_lights_punctual: new KHRLightsPunctualNode({ light: KHRLightsPunctualLight.fromJSON(this.light, { root: {} }) }) } });
}

export class RendererSystem extends System.Typed({
    models: {
        cameras:     { model: CameraModel, isSet: true },
        lights:      { model: LightModel,  isSet: true },
    }
}) {
    id = 'renderer';

    gltf = GLTF.fromJSON({
        asset: {
            version: '2.0', generator: 'Reverly Engine Runtime Generation',
        },
        scenes: [{ name: 'Revelry Engine Runtime Scene', nodes: [], extensions: {} }],
        scene: 0,
    });

    renderer = new Renderer({ forceWebGL2: globalThis.REVELRY_FORCE_WEBGL2 });
    graph    = this.renderer.getSceneGraph(this.gltf.scene);

    /**
     * @this {this & { stage: Revelry.ECS.Stage }}
     * @param {CameraModel|LightModel} model
     */
    onModelAdd(model) {
        this.gltf.extensionsUsed

        if(model.node) this.addGraphNode(model.node);
            model.components.transform.watch('value:notify', {
                deferred: true,
                handler:  () => model.node && this.updateGraphNode(model.node),
            });
    }

    /**
     * @param {CameraModel|LightModel} model
     */
    onModelDelete(model) {
        if(model.node) {
            this.deleteGraphNode(model.node);
        }
    }

    /**
     * @param {import('../deps/gltf.js').Node} node
     */
    addGraphNode(node) {
        this.gltf.scene.nodes.push(node);
        this.graph.updateNode(node);
    }

    /**
     * @param {import('../deps/gltf.js').Node} node
     */
    updateGraphNode(node) {
        this.graph.updateNode(node);
    }

    /**
     * @param {import('../deps/gltf.js').Node} node
     */
    deleteGraphNode(node) {
        const index = this.gltf.scene.nodes.indexOf(node);
        if(index !== -1) {
            this.gltf.scene.nodes.splice(this.gltf.scene.nodes.indexOf(node), 1);
            this.graph.deleteNode(node);
        }
    }

    /**
     * @param {import('../deps/gltf.js').KHREnvironmentMapData|null} map
     */
    setEnvironmentMap(map) {
        this.gltf.scene.extensions ??= {};
        this.gltf.scene.extensions.KHR_environment_map = map ? new KHREnvironmentMapScene({
            environment_map: map
        }) : undefined
    }

    getEnvironmentMap() {
        return  this.gltf.scene.extensions?.KHR_environment_map?.environment_map;
    }

    // update() {
    //     if(!this.renderer) return;

    //     const { renderer, graph } = this;

    //     for(const camera of this.cameras) {
    //         const { target, renderPath = 'standard', settings } = camera;
    //         if(!target) continue;
    //         this.#viewports.ensure(camera, () => renderer.createViewport({ renderPath, target, settings }));
    //         graph.updateNode(camera.node);
    //     }
    // }

    render() {
        if(!this.renderer) return;

        const { graph } = this;

        for(const camera of this.cameras) {
            camera.viewport?.render({ graph, cameraNode: camera.node });
        }
    }

    /**
     * @param {string} cameraEntityId
     */
    getCameraModel(cameraEntityId) {
        return this.stage?.getEntityModel(cameraEntityId, CameraModel);
    }

    /**
     * @param {string} cameraEntityId
     */
    getCameraFrustum(cameraEntityId) {
        const model = this.getCameraModel(cameraEntityId);
        return model?.viewport?.frustum;
    }
}

/** @satisfies {Revelry.ECS.SystemBundle} */
export const bundle = {
    systems: [RendererSystem, ...OrbitBundle.systems],
    initializers: {
        camera: (c) => {
            const { type, perspective, orthographic, renderOptions } = c.value;
            const camera = /** @type {Revelry.ECS.ComponentData<'camera'>['value'] & { toJSON: () => any }} */(GLTFCamera.fromJSON({ type, perspective, orthographic }, { root: {} }));
            camera.renderOptions = renderOptions;
            camera.toJSON = () => {
                const  { type, perspective, orthographic, renderOptions } = camera;
                return { type, perspective, orthographic, renderOptions }
            }
            return camera;
        }
    }
}
