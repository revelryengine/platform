import { EntityRegistry } from './entity-registry.js';
import { GameNode       } from './gom/game-node.js';
import { model          } from './decorators/model.js';
import { component      } from './decorators/component.js';
import { UUID           } from './utils/uuid.js';

/**
 * A class that declaratively defines a model.
 */
export class EntityModel extends GameNode {
  /**
   * Creates an instance of EntityModel.
   * @param {Entity} entity
   */
  constructor(entity) {
    super();

    /** @type {String} */
    this.id = `${this.constructor.name}:${entity.id}`;

    /** @type {Entity} */
    this.entity = entity;

    /** @type {Set<Object>} */
    this.components = new Set();
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
   * Returns a model decorator for the EntityModel subclass it is called from
   *
   * @static
   * @readonly
   * @returns {decorator}
   */
  static get model() {
    return model(this);
  }

  /**
   * Spawns the EntityModel by creating all the required components and adding them to the stage.
   *
   * @static
   * @param {Stage} stage
   * @param {Object} [properties={}]
   */
  static async spawn(stage, properties = {}) {
    const entity = properties.entity || new UUID();

    for (const [key, type] of EntityRegistry.componentPropertyDescriptors(this)) {
      if (!properties[key]) throw new Error(`Entity Model requires property '${key}' in order to spawn`);

      for (const comp of [].concat(properties[key])) {
        stage.components.add(Object.assign({ type, entity, id: new UUID() }, comp));
      }
    }
  }
}

export default EntityModel;
export { component };
