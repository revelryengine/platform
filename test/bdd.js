/// <reference path="revelryengine/settings.d.ts" />
/// <reference path="revelryengine/utils/importmap-content.types.d.ts" />
/// <reference path="npm:@types/sinonjs__fake-timers@15.0.1" />

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
 *  before:     (fn: () => (void | Promise<void>)) => void
 *  after:      (fn: () => (void | Promise<void>)) => void
 *  beforeEach: (fn: () => (void | Promise<void>)) => void
 *  afterEach:  (fn: () => (void | Promise<void>)) => void
 * }} BDDInterface
 */

export const { describe, it, before, after, beforeEach, afterEach } = /** @type {BDDInterface} */(typeof Deno !== 'undefined' ? await import('jsr:@std/testing@1.0.16/bdd') : globalThis);

export { expect, sinon };

export class PromiseDeferred extends Promise {
    /**
     *
     * @param {(resolve: (value?: any) => void, reject: (reason?: any) => void) => void} [resolver]
     */
    constructor(resolver) {
        /** @type {(value?: any) => void} */
        let resolve = () => {};
        /** @type {(reason?: any) => void} */
        let reject = () => {};

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

        const timeout = setTimeout(() => deferred.reject(new Error(message)), ms);

        return Promise.race([promise, deferred]).finally(() => clearTimeout(timeout));
    }
}

/**
 * Run a callback only in browser environments.
 * @param {string} summary
 * @param {() => void} callback
 */
export function browserOnly(summary, callback) {
    if (typeof Deno === 'undefined') {
        describe(`[Browser Only]: ${summary}`, callback);
    }
}

/**
 * Run a callback only in deno environments.
 * @param {string} summary
 * @param {() => void} callback
 */
export function denoOnly(summary, callback) {
    if (typeof Deno !== 'undefined') {
        describe(`[Deno Only]: ${summary}`, callback);
    }
}

if (typeof Deno !== 'undefined') {
    globalThis.REV ??= {};
    globalThis.REV.importmap ??= {};
    globalThis.REV.importmap.url ??= new URL('../importmap.dev.json', import.meta.url);
}
