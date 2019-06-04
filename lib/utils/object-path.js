/**
 * An array of property keys. Can be use to get/set nested properties on object when the full object path is not known or complete.
 */
export class ObjectPath extends Array {
  /**
   * Assign a value to a target at the nested property path.
   *
   * Assumes positive integer number property keys will be assigned to an array instead of an object
   *
   * @param {Object} target
   * @param {*} value
   *
   * @example
   * const foo = { foo: { bar: [1,2,3], baz: 123 } };
   * const path = new ObjectPath('foo', 'bar', 0);
   * path.assign(foo, null);
   * // results in: { foo: { bar: [null,2,3], baz: 123 } }
   *
   * @example
   * const foo = { foo: { bar: [1,2,3], baz: 123 } };
   * const path = new ObjectPath('foo', 'baz');
   * path.assign(foo, null);
   * // results in: { foo: { bar: [1,2,3], baz: null } }
   *
   * @example
   * const foo = { foo: { bar: [1,2,3], baz: 123 } };
   * const path = new ObjectPath('foo', 'bat', 0);
   * path3.assign(foo, null);
   * // results in: { foo: { bar: [1,2,3], baz: 123, bat: null } }
   */
  assign(target, value) {
    const deep = this.slice(0, -1).reduce((t, k, i) => {
      t[k] = t[k] || (Number.isInteger(this[i + 1]) && this[i + 1] >= 0 ? [] : {});
      return t[k];
    }, target);
    deep[this[this.length - 1]] = value;
  }

  /**
   * Reads a value from a target at the nested property path. Returns undefined if any of the properties are not defined in the tree.
   *
   * @param {Object} target
   * @returns {*}
   *
   * @example
   * const foo = { foo: { bar: [1,2,3], baz: 123 } };
   * const path = new ObjectPath('foo', 'bar', 0);
   * path.read(foo) === 1;
   *
   * @example
   * const foo = { foo: { bar: [1,2,3], baz: 123 } };
   * const path = new ObjectPath('foo', 'baz');
   * path2.read(foo) === 123;
   *
   * @example
   * const foo = { foo: { bar: [1,2,3], baz: 123 } };
   * const path = new ObjectPath('foo', 'bat', 0);
   * path3.read(foo) === undefined;
   */
  read(target) {
    return this.reduce((t, k) => t && t[k], target);
  }
}

export default ObjectPath;
