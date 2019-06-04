import { GameNodeChildSet } from './gom/game-node-child-set.js';
import { UUID             } from './utils/uuid.js';
import { WatchedProxy     } from './utils/watched-proxy.js';
import { IdSet            } from './utils/id-set.js';
import { SetMap           } from './utils/set-map.js';
import { Entity           } from './entity.js';
import { ComponentChangeEvent } from './events/events.js';

const CMPNT_PROPS = Symbol('Entity Model Registry Component Properties');
const MODEL_PROPS = Symbol('Entity Model Registry Model Properties');

const _ = new WeakMap();

/**
 * @private
 * @ignore
 */
function addToProperty(target, key, item) {
  if (target[key] instanceof Set) {
    if (target[key].has(item)) return;
    target[key].add(item);
  } else {
    if (target[key] !== undefined) return;
    target[key] = item;
  }
}

/**
 * @private
 * @ignore
 */
function deleteFromProperty(target, key, item) {
  if (target[key] instanceof Set) {
    if (!target[key].has(item)) return;
    target[key].delete(item);
  } else {
    if (target[key] !== item) return;
    delete target[key];
  }
}

/**
 * @private
 * @ignore
 */
function addComponentToSystem(component, system) {
  const entity  = system.stage.entities.getById(component.entity);

  for (const [modelKey, ModelClass] of EntityRegistry.matchingSystemModels(system, entity)) {
    const id  = `${ModelClass.name}:${entity.id}`;
    let model = entity.models.getById(id);
    if (!model) {
      model = new ModelClass(entity);
      for (const cmpnt of entity.components) {
        for (const [cmpntKey, type] of ModelClass.prototype[CMPNT_PROPS]) {
          if (type === cmpnt.type) {
            model.components.add(cmpnt);
            addToProperty(model, cmpntKey, cmpnt);
          }
        }
      }
      entity.models.add(model);
      system.models.add(model);
      addToProperty(system, modelKey, model);
    } else {
      for (const [key, type] of ModelClass.prototype[CMPNT_PROPS]) {
        if (type === component.type) {
          model.components.add(component);
          addToProperty(model, key, component);
        }
      }
    }
  }
}

/**
 * @private
 * @ignore
 */
// function deleteComponentFromSystem(component, system) {

// }

/**
 * The ComponentSet is an {@link IdSet} with added functionality to register components with the {@link EntityRegistry} when they are added.
 * Typically components should be added from the stage.components reference.
 *
 * @example
 *
 * const stage = new Stage('foobar');
 *
 * stage.components.add({ ... });
 */
export class ComponentSet extends IdSet {
  /**
   * Creates an instance of ComponentSet.
   * @param {EntityRegistry} registry
   */
  constructor(registry) {
    super();
    /** @type {EntityRegistry} */
    this.registry = registry;
  }

  /**
   * Calls {@link EntityRegistry.addComponent} and adds a {@link WatchedProxy} for the component to the set.
   *
   * @param {Object} component
   * @returns {ComponentSet}
   */
  add(component) {
    const proxy = this.registry.registerComponent(component);
    return super.add(proxy);
  }

  /**
   * Calls {@link EntityRegistry.deleteComponent} and removes the {@link WatchedProxy} for the component from the set.
   * The proxy for the component will be found by id and removed.
   *
   * @param {Object} component
   * @returns {Boolean} Returns true if the components was present and successfully removed.
   */
  delete(component) {
    const proxy = this.registry.unregisterComponent(component);
    return super.delete(proxy);
  }
}

/**
 * The EntityRegistry is responsible for maintaining the relationships between {@link Systems} and {@link EntityModel}s.
 * When components are registered with the EntityRegistry, the registry will look for all registered systems that have a matching EntityModel for that component type.
 * A model is considered matching if there are at least one component for all component types defined on the model.
 *
 * @example
 *
 * class FoobarModel extends EntityModel {
 *   @component('foobar') foobar;
 * }
 *
 * class FoobarSystem extends System {
 *   @FoobarModel.model foobar;
 *
 * }
 *
 * const system = new FoobarSystem('foobar-system);
 * const stage = new Stage('main-stage');
 *
 * stage.systems.add(system);
 * stage.components.add({ id: new UUID(), entity: new UUID(), type: 'foobar' });
 *
 *
 */
export class EntityRegistry {
  /**
   * Creates an instance of EntityRegistry.
   * @param {Stage} stage
   */
  constructor(stage) {
    this.stage = stage;

    /**
     * A second distinct list of children containing all of the entities for the stage.
     * @type {GameNodeChildSet<Entity>}
     */
    this.entities = new GameNodeChildSet(stage);

    /**
     * @type {ComponentSet<Object>}
     */
    this.components = new ComponentSet(this);

    _.set(this, {
      systemsByType: new SetMap(),
      componentsByType: new SetMap(),
      entitiesByType: new SetMap(),
    });
  }

  /**
   * Extends a Map assigned to a class property by creating a new duplicated map and
   * defines a property getter for the specified key.
   *
   * Useful for extending a Map property using sub classes and decorators.
   *
   * @param {constructor} TargetClass The target class to extend the property map for
   * @param {*} key The key the property map is set on
   * @returns {Map}
   */
  static extendClassPropertyMap(TargetClass, key) {
    const map = new Map([...(TargetClass.prototype[key] || [])]); // allows extension to sub classes
    Reflect.defineProperty(TargetClass.prototype, key, { configurable: true, get: () => map });
    return map;
  }

  /**
   * Register a component property for an {@link EntityModel} subclass.
   *
   * @param {Function.<EntityModel>} ModelClass
   * @param {*} key
   * @param {String} type
   */
  static registerComponentProperty(ModelClass, key, type) {
    const cmpntProps = this.extendClassPropertyMap(ModelClass, CMPNT_PROPS);
    cmpntProps.set(key, type);
  }

  /**
   * Register a model property for a {@link System} subclass.
   *
   * @param {Function.<System>} SystemClass
   * @param {*} key
   * @param {Function.<EntityModel>} ModelClass
   */
  static registerModelProperty(SystemClass, key, ModelClass) {
    const modelProps = this.extendClassPropertyMap(SystemClass, MODEL_PROPS);
    modelProps.set(key, ModelClass);
  }

  static* matchingSystemModels(system, entity) {
    const SystemClass = system.constructor;

    for (const [key, ModelClass] of SystemClass.prototype[MODEL_PROPS]) {
      if (this.componentsMatchModel(entity.components, ModelClass)) {
        yield [key, ModelClass];
      }
    }
  }

  static componentsMatchModel(components, ModelClass) {
    const types = ModelClass.prototype[CMPNT_PROPS].values();
    return [...types].every((type) => {
      for (const component of components) {
        if (type === component.type) return true;
      }
      return false;
    });
  }

  createComponentProxy(component) {
    component.id = new UUID(component.id);

    return new WatchedProxy(component, (comp, path, newValue, oldValue) => {
      this.stage.dispatchEvent(new ComponentChangeEvent(comp, comp, path, newValue, oldValue));
    });
  }

  ensureEntityExists(id) {
    return this.entities.getById(id) || this.entities.add(new Entity(id)).getById(id);
  }

  registerSystem(system) {
    const SystemClass = system.constructor;

    for (const [, ModelClass] of (SystemClass.prototype[MODEL_PROPS] || [])) {
      for (const [, type] of (ModelClass.prototype[CMPNT_PROPS] || [])) {
        _.get(this).systemsByType.add(type, system);

        for (const component of (_.get(this).componentsByType.get(type) || [])) {
          addComponentToSystem(component, system);
        }
      }
    }
  }

  unregisterSystem(system) {
    const SystemClass = system.constructor;

    for (const [, ModelClass] of (SystemClass.prototype[MODEL_PROPS] || [])) {
      for (const [, type] of (ModelClass.prototype[CMPNT_PROPS] || [])) {
        _.get(this).systemsByType.delete(type, system);
      }
    }
  }

  registerComponent(component) {
    let proxy = this.components.getById(component.id);
    if (proxy) {
      Object.assign(proxy, component); return proxy;
    }
    proxy = this.createComponentProxy(component);

    const entity = this.ensureEntityExists(proxy.entity);
    entity.components.add(proxy);

    _.get(this).componentsByType.add(proxy.type, proxy);
    _.get(this).entitiesByType.add(proxy.type, entity);

    for (const system of (_.get(this).systemsByType.get(proxy.type) || [])) {
      addComponentToSystem(proxy, system);
    }

    return proxy;
  }

  unregisterComponent(component) {
    const proxy = this.components.getById(component.id);
    if (!proxy) return false;

    const entity = this.entities.getById(proxy.entity);
    entity.components.delete(proxy);

    for (const model of entity.models) {
      for (const [key, type] of (model.constructor.prototype[CMPNT_PROPS] || [])) {
        if (type === proxy.type) {
          deleteFromProperty(model, key, proxy);
        }
      }

      model.components.delete(proxy);

      if (!EntityRegistry.componentsMatchModel(entity.components, model.constructor)) {
        for (const [key, ModelClass] of (model.system.constructor.prototype[MODEL_PROPS] || [])) {
          if (ModelClass === model.constructor) {
            deleteFromProperty(model.system, key, model);
          }
        }

        model.system.models.delete(model);
        entity.models.delete(model);
      }
    }

    _.get(this).componentsByType.delete(proxy.type, proxy);
    // _.get(this).entitiesByType.add(proxy.type, entity);

    return proxy;
  }

  static* componentPropertyDescriptors(ModelClass) {
    for (const [key, type] of (ModelClass.prototype[CMPNT_PROPS] || [])) {
      yield [key, type];
    }
  }
}

export default EntityRegistry;
