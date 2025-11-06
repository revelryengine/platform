// @ts-types="npm:@types/chai"
import { expect, use } from 'https://cdn.jsdelivr.net/npm/chai@6.2.0/+esm';

// @ts-types="npm:@types/sinon"
import sinon from 'https://cdn.jsdelivr.net/npm/sinon@21.0.0/+esm';

// @ts-types="npm:@types/sinon-chai"
import sinonChai from 'https://cdn.jsdelivr.net/npm/sinon-chai@4.0.1/+esm';

// @ts-types="npm:@types/chai-as-promised"
import chaiAsPromised from 'https://cdn.jsdelivr.net/npm/chai-as-promised@8.0.2/+esm';

use(sinonChai);
use(chaiAsPromised);

/**
 * @typedef {{
 *  describe:   (desc: string, fn: () => (void | Promise<void>)) => void
 *  it:         (desc: string, fn: () => (void | Promise<void>)) => void
 *  beforeEach: (fn: () => (void | Promise<void>)) => void
 *  afterEach:  (fn: () => (void | Promise<void>)) => void
 * }} BDDInterface
 */

export const { describe, it, beforeEach, afterEach } = /** @type {BDDInterface} */(typeof Deno !== 'undefined' ? await import('jsr:@std/testing@1.0.16/bdd') : globalThis);

export { expect, sinon };

export class PromiseDeferred extends Promise {
    /**
     *
     * @param {(resolve: (value?: any) => void, reject: (reason?: any) => void) => void} [resolver]
     */
    constructor(resolver) {
        // deno-coverage-ignore-start
        /** @type {(value?: any) => void} */
        let resolve = () => {};
        /** @type {(reason?: any) => void} */
        let reject = () => {};
        // deno-coverage-ignore-stop

        super((res, rej) => { resolve = res; reject = rej; });

        this.resolve = resolve;
        this.reject = reject;

        resolver?.(this.resolve, this.reject);
    }

    /**
     * Returns a promise that rejects after a timeout.
     * @param {Promise<unknown>} promise
     * @param {number} ms
     * @param {string} message
     */
    static async timeout(promise, ms, message = 'Promise timed out') {
        const deferred = new PromiseDeferred();
        // deno-coverage-ignore-start
        const timeout = setTimeout(() => deferred.reject(new Error(message)), ms);
        // deno-coverage-ignore-stop
        return Promise.race([promise, deferred]).finally(() => clearTimeout(timeout));
    }
}
