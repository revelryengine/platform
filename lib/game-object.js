import { Model, System, Watchable } from '../deps/ecs.js';
import { Material, Node, REVGameObjectNode  } from '../deps/gltf.js';
import { Asset } from './asset.js';

import { Transform } from './transform.js';

/**
 * @typedef {{
 *  'name:change':     string,
 *  'parent:change':   string | undefined,
 *  'hidden:change':   boolean,
 *  'open:change':     boolean,
 *  'active:change':   boolean,
 *  'outline:change':  [number, number, number, number]|null,
 * }} GameObjectMetaEvents
 */

/** @extends Watchable<GameObjectMetaEvents> */
export class GameObjectMeta extends Watchable {
    #name;
    #parent;
    #hidden = false;

    // Runtime specific state
    #open   = false;
    #active = false;

    /**
     * @type {[number, number, number, number]|null}
     */
    #outline = null;

    /**
     * @param {{ name: string, parent?: string, hidden?: boolean}} value
     */
    constructor({ name, parent, hidden = false }) {
        super();
        this.#name   = name;
        this.#parent = parent;
        this.#hidden = hidden;
    }

    get name() {
        return this.#name;
    }

    set name(v) {
        const pre = this.#name;
        this.#name = v;
        this.notify('name:change', pre);
    }

    get parent() {
        return this.#parent;
    }

    set parent(v) {
        const pre = this.#parent;
        this.#parent = v;
        this.notify('parent:change', pre);
    }

    get hidden() {
        return this.#hidden;
    }

    set hidden(v) {
        const pre = this.#hidden;
        this.#hidden = v;
        this.notify('hidden:change', pre);
    }

    get open() {
        return this.#open;
    }

    set open(v) {
        const pre = this.#open;
        this.#open = v;
        this.notify('open:change', pre);
    }

    get active() {
        return this.#active;
    }

    set active(v) {
        const pre = this.#active;
        this.#active = v;
        this.notify('active:change', pre);
    }

    get outline() {
        return this.#outline;
    }

    set outline(v) {
        const pre = this.#outline;
        this.#outline = v;
        this.notify('outline:change', pre);
    }

    toJSON() {
        return { name: this.#name, parent: this.#parent, hidden: this.#hidden ? true : undefined };
    }

    /**
     * @param {{ name: string, parent?: string, hidden?: boolean}} value
     */
    set({ name, parent, hidden = false }) {
        this.name   = name;
        this.parent = parent;
        this.hidden = hidden;
    }

    clone() {
        return new GameObjectMeta(this);
    }
}

export class GameObjectModel extends Model.Typed({
    components: {
        meta:      { type: 'meta'      },
        transform: { type: 'transform' },
    },
    events: /** @type {{ 'parent:resolve': void, 'children:change': GameObjectModel[] }} */({}),
}) {
    /** @type {GameObjectModel|null} */
    #parent = null;
    /**
     * @type {Revelry.ECS.ComponentReference<'meta'>|null}
     */
    #parentRef = null;

    /** @type {GameObjectModel[]} */
    #children = [];

    /**
    * @param {import('../deps/ecs.js').Stage} stage
    * @param {string} entity
    */
    constructor(stage, entity) {
        super(stage, entity);

        this.#createParentRelationship();

        this.meta.watch('parent:change', () => {
            this.#deleteParentRelationship();
            this.#createParentRelationship();
        });
    }


    async #createParentRelationship() {
        if(this.meta.parent) {
            this.#parentRef = this.stage.components.references.add({ entity: this.entity, type: 'meta' }, { entity: this.meta.parent, type: 'meta' });

            if(this.#parentRef.state === 'pending') await this.#parentRef.waitFor('resolve');

            this.notify('parent:resolve');

            const parent = this.stage.getEntityModel(this.meta.parent, GameObjectModel);
            if(parent) {
                this.#parent = parent;
                this.transform.setParent(this.#parent.transform);
                this.#parent.children.push(this);
                this.#parent.notify('children:change', this.#parent.children);
            }
        }
    }

    #deleteParentRelationship() {
        if(this.#parent) {
            this.#parentRef?.release();
            this.transform.setParent(null);

            const index = this.#parent.children.indexOf(this);
            if(index !== -1) {
                this.#parent.children.splice(index, 1);
                this.#parent.notify('children:change', this.#parent.children);
            }

            this.#parent    = null;
            this.#parentRef = null;
        }
    }

    cleanup() {
        this.#deleteParentRelationship();
    }

    get children() {
        return this.#children;
    }

    get parent() {
        return this.#parent;
    }

    get orphaned() {
        return !!(this.meta.parent && !this.#parent);
    }
}

/**
 * @typedef {{ instance: { node: Node }, events: { 'node:change': void, 'material:change': Material } }} GameObjectAssetDefinition
 */

/**
 * Use this class to create a GameObject GLTF node that is automatically updated with meta and transform components.
 *
 * See `./mesh.js` and `./sprite.js` for examples of how to use this class with the renderer system.
 *
 * @template {import('./asset.js').Asset<GameObjectAssetDefinition & { data: any }>} [A=import('./asset.js').Asset<GameObjectAssetDefinition & { data: any }>]
 */
export class GameObjectAssetNode extends Node {
    /**
     * @param {{
     *  type:      Revelry.ECS.ComponentTypeKeys,
     *  asset:     A,
     *  meta:      GameObjectMeta,
     *  transform: Transform,
     * }} config
     */
    constructor({ type, asset, meta, transform }) {
        super({
            matrix:   transform,
            children: [],
            extensions: {
                REV_game_object: new REVGameObjectNode({ id: asset.entity }),
            }
        });

        this.type      = type;
        this.asset     = asset;
        this.meta      = meta;
        this.transform = transform;

        Object.defineProperty(this.extensions?.REV_game_object, 'hidden',  { get: () => this.meta.hidden });
        Object.defineProperty(this.extensions?.REV_game_object, 'outline', { get: () => this.meta.outline });

        this.asset.watch('instance:create', ({ instance }) => {
            this.children = [instance.node];
        });
    }
}

export class GameObjectSystem extends System.Typed({
    models: {
        gameObjects: { model: GameObjectModel, isSet: true },
    },
    events: /** @type {{ 'root:change': void }} */({}),
}) {

    id = 'game-object';

    /**
     * @type {Map<string, GameObjectModel>}
     */
    #gameObjects = new Map();
    /**
     * @type {Set<string>}
     */
    #names = new Set();

    /**
     * @param {GameObjectModel} model
     */
    onModelAdd(model) {
        this.#gameObjects.set(model.entity, model);

        this.#names.add(model.meta.name);

        model.meta.watch('parent:change', (previousValue) => {
            if(!previousValue || !model.parent) this.notify('root:change');
        });

        model.watch('parent:resolve', () => {
            this.notify('root:change');
        });

        model.meta.watch('name:change', (previousValue) => {
            this.#names.delete(previousValue);
            this.#names.add(model.meta.name);

            if(!model.parent) this.notify('root:change');
        });

        if(!model.parent) {
            this.notify('root:change');
        }
    }

    /**
     * @param {GameObjectModel} model
     */
    onModelDelete(model) {
        this.#gameObjects.delete(model.entity);
        this.#names.delete(model.meta.name);

        if(!model.parent) {
            this.notify('root:change');
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

    /**
     * @param {string} name
     * @param {Set<string>} [subset]
     */
    getUnusedNameIncrement(name, subset) {
        if(!this.#names.has(name) && !subset?.has(name)) return name;

        let [,unenumerated, numeral] = /(.+?)(\d*)$/.exec(name) ?? [];

        unenumerated = unenumerated?.trim();

        let count  = Number(numeral) || 1;
        let search = unenumerated;
        while(this.#names.has(search) || subset?.has(search)) {
            search = `${unenumerated} ${++count}`;
        }
        return search;
    }
}

/** @satisfies {Revelry.ECS.SystemBundle} */
export const bundle = {
    systems: [GameObjectSystem],
    initializers: { meta: (c) => new GameObjectMeta(c.value) }
}
