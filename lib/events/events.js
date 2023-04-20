import { GameEvent } from './game-event.js';

/** @typedef {import('../model.js').Model} Model */
/** @typedef {import('../gom/game-node.js').GameNode<any, any>} GameNode */

/**
 * @typedef  {Object} ModelAddData
 * @property {Model}  model - The model that was added
 * @property {String} key - The system property key the model was added to
 */

/**
 * An event that is fired whenever a model is initialized and added to the system. 
 * This occurs when all the components required for the model are added to the stage.
 */
export class ModelAddEvent extends GameEvent {
    /**
     * @param {ModelAddData} data
     */
    constructor({ model, key }) {
        super('modeladd');
        this.model = model;
        this.key   = key;
    }
}

/**
 * @typedef  {Object} ModelDeleteData
 * @property {Model}  model - The model that was deleted
 * @property {String} key - The system property key the model was deleted from
 */

/**
 * An event that is fired whenever a model is removed from a system. 
 * This occurs when a component is deleted from the stage that makes the model no longer have all of the required components.
 */
export class ModelDeleteEvent extends GameEvent {
    /**
     * @param {ModelDeleteData} data
     */
    constructor({ model, key }) {
        super('modeldelete');
        this.model = model;
        this.key   = key;
    }
}


/**
 * @typedef  {Object}   NodeAddData
 * @property {GameNode} node - The node that was added
 */

/**
 * An event that is fired whenever a GameNode is added as a child to another GameNode.
 */
export class NodeAddEvent extends GameEvent {
    /**
     * @param {NodeAddData} data
     */
    constructor({ node }) {
        super('nodeadd');
        this.node = node;
    }
}

/**
 * @typedef  {Object}   NodeDeleteData
 * @property {GameNode} node - The node that was deleted
 */

/**
 * An event that is fired whenever a GameNode is removed from another GameNode.
 */
export class NodeDeleteEvent extends GameEvent {
    /**
     * @param {NodeDeleteData} data
     */
    constructor({ node }) {
        super('nodedelete');
        this.node = node;
    }
}
