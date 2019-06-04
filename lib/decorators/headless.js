import { extensions } from '../extensions.js';

/**
 * To configure headless mode add #headless to the url or run the following command:
 *
 * game.command('headless', true);
 */

let headless = window.location.hash.startsWith('#headless');

extensions.set('command:headless', (game, value) => {
  headless = value;
});

/**
 * Used to decorate methods that will only be run when not in headless mode
 *
 * @param {*} target
 * @param {*} key
 * @param {*} descriptor
 * @returns {descriptor}
 */
export function nonheadlessOnly(target, key, descriptor) {
  const { value } = descriptor;
  const noop = Object.getPrototypeOf(value).constructor();
  return {
    get() {
      return headless ? noop : value;
    },
    set(v) {
      Object.defineProperty(this, key, { value: v });
      return v;
    },
  };
}

/**
 * Used to decorate methods that will only be run when in headless mode
 *
 * @export
 * @param {*} target
 * @param {*} key
 * @param {*} descriptor
 * @returns {descriptor}
 */
export function headlessOnly(target, key, descriptor) {
  const { value } = descriptor;
  const noop = Object.getPrototypeOf(value).constructor();
  return {
    get() {
      return headless ? value : noop;
    },
    set(v) {
      Object.defineProperty(this, key, { value: v });
      return v;
    },
  };
}

