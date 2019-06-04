import { EntityRegistry } from '../entity-registry.js';

/**
 * Returns a decorator that can be applied to a property of a System subclass.
 *
 * The specified EntityModel subclass will be registered with the EntityRegistry.
 * When a component is added to the stage the EntityRegistry match all the components
 * with the same component.entity against the EntityModel subclass.
 * If the entity has components registered with the EntityModel sublass then it will
 * create a new instance matching all the components to the registered properties,
 * and add the instance to any systems that have registered the model.
 *
 * See {@link component} for more information on registering a component with a model.
 *
 * @example <caption>Registering a model with a system.</caption>
 *
 * class FoobarModel extends EntityModel {
 *   ...
 * }
 *
 * class FoobarSystem extends System {
 *   @model(FoobarModel) foobar;
 * }
 *
 * @example <caption>For convenience all EntityModel subclasses contain a static method that wraps the model decorator.
 * This removes one import and is the recommended style for readability.</caption>
 * class FoobarModel extends EntityModel {
 *   ...
 * }
 *
 * class FoobarSystem extends System {
 *   @FoobarModel.model foobar;
 *   ...
 * }
 *
 * @param {Function.<EntityModel>} ModelClass The EntityModel subclass to register in the EntityRegistry for this System.
 * @returns {decorator}
 */
export function model(ModelClass) {
  return (target, key, descriptor) => {
    EntityRegistry.registerModelProperty(target.constructor, key, ModelClass);
    return Object.assign(descriptor, { writable: true, enumerable: true, configurable: true });
  };
}

export default model;
