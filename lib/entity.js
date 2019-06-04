import { GameNode } from './gom/game-node.js';
import { IdSet    } from './utils/id-set.js';

export class Entity extends GameNode {
  /**
   * Creates an instance of Entity.
   * @param {String|UUID} id
   */
  constructor(id) {
    super(id);

    /**
     * A Set of all the components for this entity.
     * @type {IdSet<Object>}
     */
    this.components = new IdSet();

    /**
     * A Set of all the {@link EntityModels} for this entity.
     * @type {IdSet<EntityModel>}
     */
    this.models = new IdSet();
  }

  /**
   * A reference to the parent of an Entity which is the {@link Stage}.
   *
   * @type {Stage}
   * @readonly
   */
  get stage() {
    return this.parent;
  }

  /**
   * A reference to the parent of a Entity's parent which is the {@link Game}.
   *
   * @type {Game}
   * @readonly
   */
  get game() {
    return this.parent ? this.parent.parent : undefined;
  }
}

export default Entity;
