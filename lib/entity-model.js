import { GameNode } from './gom/game-node.js';
import { UUID     } from './utils/uuid.js';

/**
 * A class that declaratively defines a model.
 */
export class EntityModel extends GameNode {
    /**
     * Creates an instance of EntityModel.
     * @param {Entity} entity
     */
    constructor(id, entity) {
        super();

        /** @type {String} */
        this.id = id;

        /** @type {Entity} */
        this.entity = entity;

        /** @type {Set<Object>} */
        this.components = new Set();

        for (const [name, { isSet }] of Object.entries(this.constructor.components)) {
            if (isSet) this[name] = new Set();
        }
    }

    /**
     * A reference to the parent of an EntityModel which is the {@link System}.
     *
     * @type {System}
     * @readonly
     */
    get system() {
        return this.parent;
    }

    /**
     * A reference to the parent of an EntityModel's parent which is the {@link Stage}.
     *
     * @type {Stage}
     * @readonly
     */
    get stage() {
        return this.parent ? this.parent.parent : undefined;
    }

    /**
     * A reference to the parent of a EntityModel's parent's parent which is the {@link Game}.
     *
     * @type {Game}
     * @readonly
     */
    get game() {
        return this.stage ? this.stage.parent : undefined;
    }

    /**
     * Spawns the EntityModel by creating all the required components and adding them to the stage.
     *
     * @static
     * @param {Stage} stage
     * @param {Object} [properties={}]
     */
    static spawn(stage, properties = {}) {
        const entity = properties.entity || new UUID();
        for(const [key, { type, isSet }] of Object.entries(this.components)) {
            if(!properties[key]) throw new Error('Missing component');
            if(properties[key] instanceof Array && !isSet) throw new Error('Component is not a Set');

            for(const comp of [].concat(properties[key])) {
                stage.components.add({ type, entity, id: new UUID(), ...comp });
            }

        }
    }

    static get components() {
        return {};
    }
}

export default EntityModel;
