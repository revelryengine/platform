import { extensions } from '../extensions.js';

/** @private */
let timingEnabled = false;

extensions.set('command:timing', (game, value) => {
  timingEnabled = value;
});

/**
 * Uses performance.mark and performance.measure to provide function timings with a unique label whose prefix is
 * Revelry:ClassName.method. Timing is disabled by default but can be enabled or
 * disabled using game.command('timing', true).
 *
 * @param {Object} target
 * @param {String|Symbol} key
 * @param {descriptor} descriptor
 * @returns {descriptor}
 *
 * @example
 * class TimedClass {
 *   @timed
 *   timedMethod(){
 *      ...
 *   }
 * }
 *
 * const t = new TimedClass();
 *
 * game.command('timing', true);
 *
 * t.timedMethod();
 *
 * const measures = performance.getEntriesByName('Revelry:TimedClass.timedMethod');
 * console.log('timedMethod milliseconds:', measures[0].duration);
 *
 */
export function timed(target, key, descriptor) {
  const { value } = descriptor;
  const isAsync = Object.getPrototypeOf(value).constructor === Object.getPrototypeOf(async () => {}).constructor;

  const name  = `Revelry:${target.constructor.name}.${key}`;
  const start = `${name}:start`;
  const end   = `${name}:end`;

  let timedMethod;

  if (isAsync) {
    timedMethod = async function asyncMethod(...args) {
      performance.mark(start);
      try {
        return await value.apply(this, args);
      } finally {
        try {
          performance.mark(end);
          performance.measure(name, start, end);
        } catch (e) {
          console.debug('mark cleared before timed asynchronous method completed');
        }
      }
    };
  } else {
    timedMethod = function syncMethod(...args) {
      performance.mark(start);
      try {
        return value.apply(this, args);
      } finally {
        performance.mark(end);
        performance.measure(name, start, end);
      }
    };
  }
  return {
    get() {
      return timingEnabled ? timedMethod : value;
    },
    set(v) {
      Object.defineProperty(this, key, { value: v });
      return v;
    },
  };
}

export default timed;
