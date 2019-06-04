/**
 * A 128 bit UUID stored as a Uint8Array.
 *
 * @example
 * const id = new UUID();
 * const idFromString = new UUID('b47b93ce-4c65-4aba-bf15-287a8934656f');
 * const idFromArray = new UUID([12, 45, 65...])
 */
export class UUID extends Uint8Array {
  /**
   * Creates an instance of UUID.
   * @param {(String|Array)} [value] Value to rebuild UUID from. If this is omitted than a random UUID will be generated.
   */
  constructor(value) {
    if (typeof value === 'string') {
      super(value.replace(/-/g, '').match(/.{1,2}/g).map(u => parseInt(u, 16)));
    } else if (typeof value === 'object') {
      super(value);
    } else {
      super(16);
      window.crypto.getRandomValues(this);
      /** @ignore */
      /* eslint-disable no-bitwise */
      this[6] = (this[6] & 0x0f) | 0x40; // v4
      /** @ignore */
      /* eslint-disable no-bitwise */
      this[8] = (this[8] & 0xbf) | 0x80; // variant: don't care
    }

    const u = [...this].map(b => b.toString(16).padStart(2, '0'));
    const string = `${u[0]}${u[1]}${u[2]}${u[3]}-${u[4]}${u[5]}-${u[6]}${u[7]}-${u[8]}${u[9]}-${u[10]}${u[11]}${u[12]}${u[13]}${u[14]}${u[15]}`;

    Object.defineProperty(this, 'string', {
      enumerable: false,
      writable: false,
      value: string,
    });
  }

  /**
   * Returns a formatted version of the UUID
   *
   * @returns {String}
   *
   * @example
   * const id = new UUID();
   * id.toString() === 'b47b93ce-4c65-4aba-bf15-287a8934656f';
   */
  toString() {
    return this.string;
  }

  /**
   * Returns a formatted version of the UUID
   *
   * @returns {String}
   *
   * @example
   * const id = new UUID();
   * id.toJSON() === 'b47b93ce-4c65-4aba-bf15-287a8934656f';
   */
  toJSON() {
    return this.string;
  }
}

export default UUID;
