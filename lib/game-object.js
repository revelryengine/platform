import { Model, System } from 'revelryengine/ecs/lib/ecs.js';
import { Watchable     } from 'revelryengine/ecs/lib/utils/watchable.js';


/**
 * @typedef {{  
 *     meta: { value: { name: string, parent?: string, hidden?: boolean}, complex: GameObjectMeta },
 * } & import('./transform.js').ComponentTypes} ComponentTypes
 */

/**
 * @template {Extract<keyof ComponentTypes, string>} [K = Extract<keyof ComponentTypes, string>]
 * @typedef {import('revelryengine/ecs/lib/stage.js').ComponentReference<ComponentTypes, K>} ComponentReference
 */

const types = /** @type {ComponentTypes} */({});
const TypedModel  = Model.Typed(types);
const TypedSystem = System.Typed(types);

/**
 * @typedef {{
 *  'name:change':     string,
 *  'parent:change':   string | undefined,
 *  'hidden:change':   boolean,
 *  'open:change':     boolean,
 *  'selected:change': boolean,
 *  'active:change':   boolean,
 * }} GameObjectMetaEvents
 */

/** @extends Watchable<GameObjectMetaEvents> */
export class GameObjectMeta extends Watchable {
    #name;
    #parent;
    #hidden = false; 

    // Runtime specific state
    #open     = false;
    #selected = false;
    #active   = false;

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

    get selected() {
        return this.#selected;
    }

    set selected(v) {
        const pre = this.#selected;
        this.#selected = v;
        this.notify('selected:change', pre);
    }

    get active() {
        return this.#active;
    }

    set active(v) {
        const pre = this.#active;
        this.#active = v;
        this.notify('active:change', pre);
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



class GameObjectModel extends TypedModel({
    components: {
        meta:      { type: 'meta'      },
        transform: { type: 'transform' },
    },
    events: /** @type {{ 'parent:resolve': void, 'children:change': GameObjectModel[] }} */({}),
}) {
    /** @type {GameObjectModel|null} */
    #parent   = null;
    /**
     * @type {ComponentReference<'meta'>|null}
     */
    #parentRef = null;
    
    /** @type {GameObjectModel[]} */
    #children = [];

    /**
    * @param {string} id
    * @param {import("revelryengine/ecs/lib/stage.js").Entity<ComponentTypes>} componentData
    */
    constructor(id, componentData) {
        super(id, componentData);

        this.#createParentRelationship();
        
        this.meta.watch('parent:change', () => {
            this.#deleteParentRelationship();
            this.#createParentRelationship();
        });
    }

    
    async #createParentRelationship() {
        if(this.meta.parent) {
            this.#parentRef = this.stage.getComponentReference(this.meta.parent, 'meta');

            if(this.#parentRef.status === 'pending') await this.#parentRef.waitFor('resolve');

            this.notify('parent:resolve');

            const parent = /** @type {GameObjectModel} */(this.stage.getEntityById(this.meta.parent)?.models.getByClass(GameObjectModel));
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

export class GameObjectSystem extends TypedSystem({
    models: {
        gameObjects: { model: GameObjectModel, isSet: true },
    },
    events: /** @type {{ 'root:change': void }} */({}),
}) {

    id = 'game-object';

    #gameObjects = new Map();
    #names       = new Set();

    /**
     * @param {GameObjectModel} model
     */
    onModelAdd(model) {
        this.#gameObjects.set(model.entity.id, model);

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
        this.#gameObjects.delete(model.entity.id);
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

    getRootGameObjects() {
        return [...this.#gameObjects.values()].filter(gameObject => !gameObject.parent);
    }

    /**
     * @param {string} name 
     * @param {Set<string>} subset
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