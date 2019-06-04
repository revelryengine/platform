export function ensureKeyAndSet(target, key, item) {
  return (target.get(key) || target.set(key, new Set()).get(key)).add(item);
}

export function ensureKeyAndMap(target, key, item, prop) {
  return (target.get(key) || target.set(key, new Map()).get(key)).set(item[prop], item);
}

/**
 * A binding set will add a property referencing the specified target to each item
 *
 * @example
 * const target = {};
 * const binding = new BindingSet(target, 'foobar');
 * const item = {};
 *
 * binding.add(item);
 *
 * item.foobar === target;
 */
export class BindingSet extends Set {
  /**
   * Creates an instance of BindingSet.
   * @param {Object} target target to bind to each item added to set
   * @param {String} key property key to set on item to reference target
   * @param {Iterable<*>} [iterable] If an iterable object is passed, all of its elements will be added to the new BindingSet. If you don't specify this parameter, or its value is null, the new BindingSet is empty.
   */
  constructor(target, key, iterable) {
    super();
    /** @type {Object} */
    this.target = target;
    /** @type {String} */
    this.key = key;

    if (iterable) {
      for (const item of iterable) {
        this.add(item);
      }
    }
  }

  add(value) {
    value[this.key] = this.target;
    return super.add(value);
  }

  delete(value) {
    delete value[this.key];
    return super.delete(value);
  }
}

/**
 * A set that is items can not be directly added or removed.
 *
 * Reflection must be used to add and remove items. This is mainly
 * used to imply that a set should not be directly modified and will
 * be updated automatically through some other process.
 *
 */
/* eslint-disable class-methods-use-this */
export class ImmutableSet extends Set {
  add() {
    console.warn('This is set is immutable');
  }

  delete() {
    console.warn('This is set is immutable');
  }
}

export function createDefaultProxy(target, defaults = {}) {
  const proxies = {};
  const proxy = new Proxy(target, {
    get: (_, property) => {
      if (proxies[property] !== undefined) {
        return proxies[property];
      } else if (target[property] !== undefined) {
        return target[property];
      }
      return defaults[property];
    },
    set: (_, property, value) => {
      if (typeof value === 'object' && typeof defaults[property] === 'object') {
        proxies[property] = createDefaultProxy(value, defaults[property]);
      } else {
        delete proxies[property];
      }
      return Reflect.set(target, property, value);
    },
    deleteProperty: (_, property) => {
      delete proxies[property];
      return Reflect.deleteProperty(target, property);
    },
  });

  for (const property of Object.getOwnPropertyNames(target)) {
    if (typeof target[property] === 'object') {
      proxy[property] = target[property];
    }
  }

  return proxy;
}
