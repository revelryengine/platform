import { ObjectPath } from './object-path.js';
import { UUID       } from './uuid.js';
/**
 * A proxy that watches all properties and sub properties of an object and fires a handler on change.
 * Symbol Properties are not watched.
 *
 * @example
 * const target = { foo: 'bar' };
 * const proxy = new WatchedProxy(target, (proxy, path, newValue, oldValue) => {
 *   console.log(newValue, oldValue);
 * });
 * proxy.foo = 'changed'; //'changed' 'bar' output to console
 */
export class WatchedProxy {
  /**
   * Creates an instance of WatchedProxy.
   * @param {Object} target The target to watch for changes
   * @param {Function} handler The handler to call on change
   * @param {WatchedProxy} [root=null] This should not be set directly as it is used internally for nested properties
   * @param {ObjectPath} [path=new ObjectPath()] This should not be set directly as it is used internally for nested properties
   */
  constructor(target, handler, root = null, path = new ObjectPath()) {
    const proxies = {};

    const proxy = new Proxy(target, {
      get: (_, property) => (proxies[property] || target[property]),
      set: (_, property, value) => {
        if (typeof property !== 'symbol') {
          if (typeof value === 'object' && !(value instanceof UUID)) {
            proxies[property] = new WatchedProxy(value, handler, root || proxy, path.concat(property));
          } else {
            delete proxies[property];
          }

          if (target[property] !== value) {
            handler(root || proxy, path.concat(property), value, target[property]);
          }
        }
        return Reflect.set(target, property, value);
      },
      deleteProperty: (_, property) => {
        delete proxies[property];

        if (typeof property !== 'symbol') {
          if (target[property] !== undefined) {
            handler(root || proxy, path.concat(property), undefined, target[property]);
          }
        }

        return Reflect.deleteProperty(target, property);
      },
    });

    // Initialize child proxies by invoking target proxy handlers now
    for (const property of Object.getOwnPropertyNames(target)) {
      if (typeof target[property] === 'object' || Array.isArray(target[property])) {
        proxy[property] = target[property];
      }
    }

    return proxy;
  }
}

export default WatchedProxy;
