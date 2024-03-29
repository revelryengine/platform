import { Model, System                                } from '../deps/ecs.js';
import { GLTF, Node as GLTFNode, Camera as GLTFCamera, REVGameObjectNode } from '../deps/gltf.js';
import { Renderer, Viewport                           } from '../deps/renderer.js';
import { CanvasAutoResizer, NonNull                   } from '../deps/utils.js';
import { quat, vec3                                   } from '../deps/gl-matrix.js';

import { bundle as OrbitBundle } from './orbit-controls.js';

import { KHRLightsPunctualLight, KHRLightsPunctualNode, KHREnvironmentMapScene } from '../deps/gltf.js';

const FORWARD = vec3.fromValues(0, 0, -1);

/**
 * @typedef {Viewport<Revelry.Renderer.RenderPaths[Exclude<Revelry.Renderer.RenderPathKeys, 'query'>]>} NonQueryViewport
 * @typedef {Viewport<Revelry.Renderer.RenderPaths['query']>} QueryViewport
 */

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
     * @type {NonQueryViewport|null}
     */
    #viewport = null;
    get viewport() { return NonNull(this.#viewport); }


    /**
     * @type {QueryViewport|null}
     */
    #queryViewport = null;
    get queryViewport() { return this.#queryViewport; }

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
        const { renderOptions = { renderPath: 'standard' }, query } = this.camera;

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
                    this.reconfigure();

                    const graph = this.stage.getContext('renderer')?.graph;
                    if(graph) {
                        this.viewport.render({ graph, cameraNode: this.node });
                    }

                    this.notify('canvas:resize');
                },
            });
        }

        this.#viewport ??= this.stage.getContext('renderer').renderer.createViewport({ ...renderOptions, target: { type: 'canvas', canvas: this.canvas } });
        this.#viewport.reconfigure(this.camera.renderOptions);

        if(query) {
            this.#queryViewport ??= this.stage.getContext('renderer').renderer.createViewport({ renderPath: 'query', target: { type: 'virtual', virtual: this.canvas } });
            this.#queryViewport.reconfigure();
        }
    }


    cleanup(){
        this.#autoResizer?.stop();
        this.#viewport?.destroy();
        this.#queryViewport?.destroy();
    }

    get type() { return this.camera.type; }
    set type(v) { this.camera.type = v;   }

    get renderPath() {
        return this.camera.renderOptions?.renderPath;
    }

    set renderPath(v) {
        const oldValue = this.camera.renderOptions?.renderPath;
        this.camera.renderOptions ??= { renderPath: 'standard' };
        this.camera.renderOptions.renderPath = v ?? 'standard';
        if(oldValue !== v) {
            this.#viewport?.destroy();
            this.#viewport = null;
            this.reconfigure();
        }
    }

    get query() { return this.camera.query; }
    set query(v) {
        this.camera.query = v;
        this.reconfigure();
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
    },
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
     * @type {Map<string, GLTFNode & { extensions: { REV_game_object: REVGameObjectNode } }>}
     */
    nodesByGameObjectId = new Map();

    /**
     * @this {this & { stage: Revelry.ECS.Stage }}
     * @param {CameraModel|LightModel} model
     */
    onModelAdd(model) {
        this.gltf.extensionsUsed

        this.graph.addNode(model.node);

        const abortCtl = new AbortController();

        model.components.transform.watch('value:notify', {
            deferred: true,
            handler:  () => model.node && this.graph.updateNode(model.node),
            signal:   abortCtl.signal,
        });

        const type = model instanceof CameraModel ? 'camera' : 'light';

        this.stage.components.watch(`component:delete:${model.entity}:${type}`, { once: true, handler: () => {
            this.graph.deleteNode(model.node);
            abortCtl.abort();
        } });
    }

    /**
     * @param {import('./game-object.js').GameObjectAssetNode} node
     */
    addGameObjectAssetNode(node) {
        const abortCtl = new AbortController();

        this.graph.addNode(node)

        node.meta.watch({ deferred: true, handler: () => this.graph.updateNode(node), signal: abortCtl.signal });

        node.transform.watch('change', { deferred: true, handler: () => this.graph.updateNode(node), signal: abortCtl.signal });

        node.asset.watch('instance:create', { deferred: true, handler: ({ previous }) => {
            if(previous) this.graph.deleteNode(previous?.node);
            this.graph.updateNode(node);
        }, signal: abortCtl.signal });

        node.asset.watch('node:change',     { deferred: true, handler: () => this.graph.updateNode(node), signal: abortCtl.signal });
        node.asset.watch('material:change', { deferred: true, handler: (material) => this.graph.updateMaterial(material), signal: abortCtl.signal });

        this.stage?.components.watch(`component:delete:${node.asset.entity}:${node.type}`, { once: true, handler: () => {
            this.graph.deleteNode(node);
            abortCtl.abort();
        } });
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


    render() {
        if(!this.renderer) return;

        const { graph } = this;

        for(const camera of this.cameras) {
            camera.viewport?.render({ graph, cameraNode: camera.node });
        }
    }

    /**
     * @param {CameraModel} cameraModel
     * @param {{ mode: 'point'|'bounds', point?: vec2, min?: vec2, max?: vec2, filter?: import('../deps/renderer.js').GameObjectFilterOptions }} options
     */
    async renderQuery(cameraModel, { mode, point = [0, 0], min = [0, 0], max = [0, 0], filter }) {
        if(!cameraModel.queryViewport) throw new Error('Query rendering is not supported for this camera');

        cameraModel.queryViewport.reconfigure({ flags: { mode }, values: { point, min, max } });
        cameraModel.queryViewport.render({ graph: this.graph, cameraNode: cameraModel.node, filter });
        return await cameraModel.queryViewport.renderPath.results;
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
            const { type, perspective, orthographic, renderOptions, query } = c.value;
            const camera = /** @type {Revelry.ECS.ComponentData<'camera'>['value'] & { toJSON: () => any }} */(GLTFCamera.fromJSON({ type, perspective, orthographic }, { root: {} }));
            camera.renderOptions = renderOptions;
            camera.query = query;
            camera.toJSON = () => {
                const  { type, perspective, orthographic, renderOptions } = camera;
                return { type, perspective, orthographic, renderOptions }
            }
            return camera;
        }
    },
    load: async () => {
        await Renderer.requestDevice();
    }
}
