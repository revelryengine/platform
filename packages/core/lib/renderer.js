import { Model, Stage, System } from '../deps/ecs.js';

import { GLTF, Node as GLTFNode, Camera as GLTFCamera, NodeREVGameObject, KHRLightsPunctualSpot       } from '../deps/gltf.js';
import { KHRLightsPunctualLight, KHRLightsPunctualNode, KHREnvironmentMapScene } from '../deps/gltf.js';
import { CameraOrthographic, CameraPerspective } from '../deps/gltf.js';

import { PBR_DEBUG_MODES, PBR_TONEMAPS, Renderer, Viewport         } from '../deps/renderer.js';
import { CanvasAutoResizer, keys, NonNull } from '../deps/utils.js';
import { quat, vec3                 } from '../deps/gl-matrix.js';

import { bundle as OrbitBundle } from './orbit-controls.js';
import { GameObjectModel } from './game-object.js';

const FORWARD = vec3.fromValues(0, 0, -1);

/**
 * @import { SystemBundle, ComponentTypeSchema     } from '../deps/ecs.js'
 * @import { ViewportCameraNode, GameObjectFilterOptions } from '../deps/renderer.js'
 *
 * @typedef {Viewport<Revelry.Renderer.RenderPaths[Exclude<Revelry.Renderer.RenderPathKeys, 'query'>]>} NonQueryViewport
 * @typedef {Viewport<Revelry.Renderer.RenderPaths['query']>} QueryViewport
 */

export const CameraSchema = /** @type {const} @satisfies {ComponentTypeSchema}*/({
    type: 'object',
    properties: {
        type: { type: 'string', enum: ['perspective', 'orthographic'] },
        perspective: { type: 'object', properties: {
            aspectRatio: { type: 'number' },
            yfov:        { type: 'number' },
            zfar:        { type: 'number' },
            znear:       { type: 'number' },
        }, required: ['yfov', 'znear'], observed: ['aspectRatio', 'yfov', 'zfar', 'znear'], default: { yfov: 1, znear: 0.1 } },
        orthographic: { type: 'object', properties: {
            xmag:  { type: 'number' },
            ymag:  { type: 'number' },
            zfar:  { type: 'number' },
            znear: { type: 'number' },
        }, required: ['xmag', 'ymag', 'zfar', 'znear'], observed: ['xmag', 'ymag', 'zfar', 'znear'], default: { xmag: 1, ymag: 1, znear: 0.1, zfar: 1000 } },
        renderOptions: { type: 'object', properties: {
            target: { type: 'object', properties: {
                type:     { type: 'string', enum: ['canvas'], default: 'canvas'},
                width:    { type: 'number'  },
                height:   { type: 'number'  },
                autosize: { type: 'boolean' },
                scale:    { type: 'number', default: 1 },
            } },
            renderPath: { type: 'string', enum: ['standard', 'preview', 'solid', 'wireframe'], default: 'standard' },
            flags: { type: 'object', properties: {
                msaa:         { type: 'number',  default: 4     },
                taa:          { type: 'boolean', default: false },
                grid:         { type: 'boolean', default: false },
                outline:      { type: 'boolean', default: true  },

                environment:  { type: 'boolean', default: true  },
                punctual:     { type: 'boolean', default: true  },
                transmission: { type: 'boolean', default: true  },
                shadows:      { type: 'boolean', default: true  },

                fog:          { type: 'boolean', default: false },
                ssao:         { type: 'boolean', default: false },
                lens:         { type: 'boolean', default: false },
                bloom:        { type: 'boolean', default: false },
                motionBlur:   { type: 'boolean', default: false },
                skybox:       { type: 'boolean', default: false },
                passiveInput: { type: 'boolean', default: false },

                alphaBlendMode: { type: 'string', enum: ['ordered', 'weighted'],            default: 'ordered' },
                tonemap:        { type: 'string', enum: [...PBR_TONEMAPS, 'None'],          default: 'None'    },
                debugPBR:       { type: 'string', enum: [...keys(PBR_DEBUG_MODES), 'None'], default: 'None'    },
                debugAABB:      { type: 'boolean', default: false },

                audio:      { type: 'boolean', default: true },
                maxLights:  { type: 'number',  default: 12   },
                maxShadows: { type: 'number',  default: 6    },
            } },
            values: { type: 'object', properties: {
            } },
        } },
        query: { type: 'boolean' },
    },
    observed: ['type', 'perspective', 'orthographic', 'renderOptions', 'query'],
    required: ['type'],
});

export class CameraProperty extends GLTFCamera {
    /**
     * @param {CameraModel} model
     */
    constructor(model) {
        const camera = model.components.camera.value;

        super({
            type: camera.type,
            perspective:  new CameraPerspective(camera.perspective),
            orthographic: new CameraOrthographic(camera.orthographic),
        });

        this.model = model;

        Object.defineProperties(this, {
            type: { get: () => camera.type },
        });

        Object.defineProperties(this.perspective, {
            aspectRatio: { get: () => camera.perspective?.aspectRatio },
            yfov:        { get: () => camera.perspective?.yfov        },
            zfar:        { get: () => camera.perspective?.zfar        },
            znear:       { get: () => camera.perspective?.znear       },
        });

        Object.defineProperties(this.orthographic, {
            xmag:  { get: () => camera.orthographic?.xmag  },
            ymag:  { get: () => camera.orthographic?.ymag  },
            zfar:  { get: () => camera.orthographic?.zfar  },
            znear: { get: () => camera.orthographic?.znear },
        });
    }
}

export class CameraModel extends Model.Typed(/** @type {const} */({
    components: ['transform', 'meta', 'camera'],
})) {
    node = /** @type {ViewportCameraNode} */(new GLTFNode({ camera: new CameraProperty(this) }));

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

    /**
     * @param {Stage} stage
     * @param {string} entity
     */
    constructor(stage, entity) {
        super(stage, entity);

        this.components.transform.watch(() => {
            vec3.transformQuat(this.#forward, FORWARD, this.components.transform.value.rotation);
            vec3.normalize(this.#forward, this.#forward);
            this.notify('transform:change');
        });

        this.components.camera.watch(() => {
            this.notify('camera:change');
        });

        this.reconfigure();
    }

    get forward() {
        return this.#forward;
    }

    get type() {
        return this.components.camera.value.type;
    }

    set type(v) {
        this.components.camera.value.type = v;
    }

    get perspective() {
        return this.components.camera.value.perspective;
    }

    get orthographic() {
        return this.components.camera.value.orthographic;
    }

    reconfigure() {
        const { renderOptions = { renderPath: 'standard' }, query } = this.components.camera.value;

        const target = renderOptions?.target ?? { type: 'canvas', autosize: true, scale: 1 };

        this.#canvas ??= document.createElement('canvas');

        if(target.width && target.height) {
            this.#canvas.width  = target.width;
            this.#canvas.height = target.height;
        } else {
            this.#autoResizer?.stop();
            this.#autoResizer = new CanvasAutoResizer({
                canvas:      this.#canvas,
                renderScale: (target.scale) / devicePixelRatio,
                onresize:    () => {
                    this.reconfigure();

                    const graph = this.stage.getContext('renderer')?.graph;
                    if(graph) {
                        this.viewport.render({ graph, cameraNode: this.node }); //avoid flickering
                    }

                    this.notify('canvas:resize');
                },
            });
        }

        this.#viewport ??= this.stage.getContext('renderer').renderer.createViewport({ ...renderOptions, target: { type: 'canvas', canvas: this.canvas } });
        this.#viewport.reconfigure(this.components.camera.value.renderOptions);

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


    get renderPath() {
        return this.components.camera.value.renderOptions?.renderPath;
    }

    set renderPath(v) {
        const oldValue = this.components.camera.value.renderOptions?.renderPath;
        this.components.camera.value.renderOptions ??= { renderPath: 'standard' };
        this.components.camera.value.renderOptions.renderPath = v ?? 'standard';
        if(oldValue !== v) {
            this.#viewport?.destroy();
            this.#viewport = null;
            this.reconfigure();
        }
    }

    get query() { return this.components.camera.value.query; }
    set query(v) {
        this.components.camera.value.query = v;
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
        return this.node.camera.getAspectRatio() ?? (this.viewport ? this.viewport.width / this.viewport.height : 1);
    }
}

export const LightSchema = /** @type {const} @satisfies {ComponentTypeSchema}*/({
    type: 'object',
    properties: {
        type:      { type: 'string', enum: ['directional', 'point', 'spot'] },
        range:     { type: 'number', default: Infinity },
        color:     { type: 'array',  items: [{ type: 'number' }, { type: 'number' }, { type: 'number' }], default: [1, 1, 1] },
        intensity: { type: 'number', default: 1 },
        spot:      { type: 'object', properties: {
            innerConeAngle: { type: 'number', default: 0 },
            outerConeAngle: { type: 'number', default: Math.PI / 4 },
        } },
    },
    required: ['type'],
});

export class LightProperty extends KHRLightsPunctualLight {
    /**
     * @param {LightModel} model
     */
    constructor(model) {
        const light = model.components.light.value;

        super({ type: light.type, spot: new KHRLightsPunctualSpot({}) });

        this.model = model;

        Object.defineProperties(this, {
            type:      { get: () => light.type      },
            range:     { get: () => light.range     },
            color:     { get: () => light.color     },
            intensity: { get: () => light.intensity },
        });

        Object.defineProperties(this.spot, {
            innerConeAngle: { get: () => light.spot?.innerConeAngle },
            outerConeAngle: { get: () => light.spot?.outerConeAngle },
        });
    }
}

export class LightModel extends Model.Typed(/** @type {const} */({
    components: ['transform', 'meta', 'light'],
})) {
    node = new GLTFNode({ extensions: { KHR_lights_punctual: new KHRLightsPunctualNode({ light: new LightProperty(this) }) } });
}

export class RendererSystem extends System.Typed(/** @type {const} */({
    id: 'renderer',
    models: {
        cameras:     { model: CameraModel,     isSet: true },
        lights:      { model: LightModel,      isSet: true },
        gameObjects: { model: GameObjectModel, isSet: true },
    },
})) {

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
     * @type {Map<string, GLTFNode & { extensions: { REV_game_object: NodeREVGameObject } }>}
     */
    nodesByGameObjectId = new Map();

    /**
     * @type {Set<GLTFNode>}
     */
    #updates = new Set();

    /**
     * @param {CameraModel|LightModel|GameObjectModel} model
     */
    onModelAdd(model) {
        if(!(model instanceof GameObjectModel)) {
            const gameObject = NonNull(this.stage.getEntityModel(model.entity, GameObjectModel));
            gameObject.addChildNode(model.node);

            if(model instanceof CameraModel) {
                model.components.transform.watch(() => {
                    //update the frustum now because other systems may depend on it
                    this.graph.updateNode(gameObject.node);
                    model.frustum.update({ graph: this.graph, cameraNode: model.node });
                });
            }

        } else {
            if(!model.components.meta.value.parent) {
                this.graph.addNode(model.node);
            }

            model.watch('node:add', () => {
                this.#updates.add(model.node)
            });
            model.watch('node:update', () => {
                this.#updates.add(model.node)
            });
            model.watch('node:delete', (node) => {
                this.graph.deleteNode(node);
            });

            model.components.transform.watch(() => {
                this.#updates.add(model.node);
            });

            model.components.meta.watch(() => {
                this.#updates.add(model.node);
            });
        }
    }

    /**
     * @param {CameraModel|LightModel|GameObjectModel} model
     */
    onModelDelete(model) {
        if(!(model instanceof GameObjectModel)) {
            const gameObject = this.stage.getEntityModel(model.entity, GameObjectModel);
            gameObject?.deleteChildNode(model.node);
        } else {
            this.graph.deleteNode(model.node);
            this.#updates.delete(model.node);
        }

        if('cleanup' in model) {
            model.cleanup();
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

    update() {
        this.graph.updateNodes(this.#updates);
        this.#updates.clear();
    }

    render() {
        if(!this.renderer) return;

        const { graph } = this;

        for(const camera of this.models.cameras) {
            camera.viewport?.render({ graph, cameraNode: camera.node });
        }
    }

    /**
     * @param {CameraModel} cameraModel
     * @param {{ mode: 'point'|'bounds', point?: vec2, min?: vec2, max?: vec2, filter?: GameObjectFilterOptions }} options
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
        return this.stage.getEntityModel(cameraEntityId, CameraModel);
    }

    /**
     * @param {string} cameraEntityId
     */
    getCameraFrustum(cameraEntityId) {
        const model = this.getCameraModel(cameraEntityId);
        return model?.viewport?.frustum;
    }
}

/** @satisfies {SystemBundle} */
export const bundle = {
    bundles: [OrbitBundle],
    systems: [RendererSystem],
    schemas: {
        camera: CameraSchema,
        light:  LightSchema,
    },
    load: async () => {
        await Renderer.requestDevice();
    }
}
