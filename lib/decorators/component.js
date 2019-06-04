import { EntityRegistry } from '../entity-registry.js';

/**
 * Returns a decorator that can be applied to a property of an EntityModel subclass.
 *
 * The specified type will be registered with the EntityRegistry.
 * When a component is added to the stage the EntityRegistry match all the components
 * with the same component.entity against the EntityModel subclass.
 * If the entity has components registered with the EntityModel sublass then it will
 * create a new instance matching all the components to the registered properties,
 * and add the instance to any systems that have registered the model.
 *
 * See {@link model} for more information on registering a model with a system.
 *
 * @example <caption>Registerting a component type with an EntityModel subclass.</caption>
 *
 * class FoobarModel extends EntityModel {
 *   @component('foobar') foobar;
 *   ...
 * }
 *
 * @param {String} type Type of component to register
 * @returns {decorator}
 */
export function component(type) {
  return (target, key, descriptor) => {
    EntityRegistry.registerComponentProperty(target.constructor, key, type);
    return Object.assign(descriptor, { writable: true, enumerable: true, configurable: true });
  };
}

export default component;
