/**
 * WorkerHelper utility module for managing web workers and shared workers.
 * @module
 */
import { importmapContent } from './importmap-content.js';
import { requestLock      } from './lock.js';

const esModuleShimsURL = import.meta.resolve('es-module-shims');

/** @type {Promise<string>} */
let esModuleShimsPromise;

/**
 * @typedef {object} WorkerHelperOptions - Options for the WorkerHelper.
 * @property {boolean} [shared] - If true, creates a SharedWorker instead of a Worker.
 *
 * @callback AsyncModuleMethod - A method that can be called asynchronously on the worker module.
 * @param {...unknown} args - The arguments to pass to the method.
 * @param {AbortSignal} [signal] - An optional AbortSignal to cancel the method call.
 * @returns {Promise<{ result: unknown, transfer: Transferable[] }>}
 */

/**
 * WorkerHelper is a utility class that facilitates communication between the main thread and web workers.
 * It handles worker initialization, module loading, method calling, and fetch proxying.
 *
 * A fetch proxy in this case is used to allow workers to proxy fetch requests through the script that created the worker,
 * this is important to make sure that requests work correctly in restricted origin environments such as vscode-extensions.
 *
 * Use `options.shared = true` to create a SharedWorker instead of a Worker. This is not supported in Deno.
 *
 * @example
 * ```javascript
 * const workerHelper = new WorkerHelper('path/to/worker/script.js', { type: 'module' });
 * await workerHelper.connect();
 * const result = await workerHelper.callMethod({ method: 'myMethod', args: [1, 2, 3] });
 * ```
 */
export class WorkerHelper {
    /** @type {Promise<any>|null} */
    #connectPromise = null;

    #abortCtl = new AbortController();

    /** @type {'disconnected'|'connecting'|'connected'|'error'} */
    #status = 'disconnected';

    /**
     * The current status of the WorkerHelper.
     */
    get status() {
        return this.#status;
    }

    #error = '';
    /**
     * The error message if the WorkerHelper is in an error state.
     */
    get error() {
        return this.#error;
    }

    /**
     * @type {Worker|SharedWorker|null}
     */
    #worker = null;

    /**
     * The Worker or SharedWorker instance.
     */
    get worker () {
        return this.#worker
    };

    /**
     * @type {MessageChannel|null}
     */
    #channel = null;

    /**
     * The MessageChannel used for communication with the worker
     */
    get channel () {
        return this.#channel
    };

    get #target() {
        if (this.options?.shared) {
            return  /** @type {SharedWorker} */(this.worker).port;
        }
        return /** @type {Worker} */(this.worker);
    }

    /**
     * Creates an instance of WorkerHelper.
     * @param {URL|string} uri - a string representing the URL of the module script the worker will execute.
     * @param {WorkerOptions & WorkerHelperOptions} [options] - options to pass to the Worker constructor.
     */
    constructor(uri, options) {
        /**
         * Ths URI of the worker script.
         */
        this.uri = uri.toString();
        /**
         * The options for the Worker constructor.
         */
        this.options = options;

        if (this.options?.shared && typeof SharedWorker === 'undefined') {
            throw new Error('SharedWorker is not supported in this environment');
        }

    }

    /**
     * Creates a blob URL for the worker script.
     */
    async #createWorkerBlobURL() {
        const preamble = await WorkerHelper.#getModulePreamble(this.uri);
        return URL.createObjectURL(new Blob([`${preamble}`], { type: 'application/javascript' }));
    }

    /**
     * Creates a blob URL for a SharedWorker script.
     * @return {Promise<string>}
     */
    async #createSharedWorkerBlobURL() {
        return new Promise((resolve, reject) => {
            requestLock(`SharedWorker:${this.uri}`, { ifAvailable: true }, async (lock) => {
                if (lock) {
                    const blob = await this.#createWorkerBlobURL();
                    resolve(blob);
                } else {
                    const channel = new BroadcastChannel(`SharedWorker:${this.uri}`);
                    return new Promise((resolve, reject) => {
                        channel.onmessage = (e) => resolve(e.data);
                        channel.postMessage(null);
                        setTimeout(() => reject('timeout'), 1000);
                    }).then(resolve).catch(reject).finally(() => {
                        channel.close();
                    });
                }
            });
        });
    }

    /**
     * Creates a new Worker instance using the generated blob URL.
     * @return {Promise<Worker|SharedWorker>}
     */
    async #createWorker() {
        if (this.options?.shared) {
            return new SharedWorker(await this.#createSharedWorkerBlobURL(), this.options);
        }
        return new Worker(await this.#createWorkerBlobURL(), this.options);
    }

    /**
     * Initializes the worker and prepares it for communication.
     */
    connect() {
        this.#connectPromise ??= (async () => {
            this.#abortCtl?.abort('Re-initializing worker');
            this.#abortCtl = new AbortController();

            this.#status = 'connecting';
            this.#worker  = await this.#createWorker();
            this.#channel = new MessageChannel();

            try {
                await new Promise((resolve, reject) => {
                    const channel = /** @type {MessageChannel} */(this.#channel);

                    channel.port1.onmessage = async ({ data: { type, error, uri, options }, ports: [port]}) => {
                        switch(type) {
                            case 'connect':
                                resolve(null);
                                break;
                            case 'error':
                                reject(error);
                                break;
                            case 'fetch': {
                                try {
                                    const res = await fetch(uri, options);
                                    const headers = new Headers(res.headers);

                                    const buffer = await res.arrayBuffer();

                                    if (res.ok && !res.headers.get('content-type') && uri.startsWith('file://') && uri.endsWith('.js')) {
                                        headers.set('Content-Type', 'application/javascript');
                                    }
                                    port.postMessage({ uri, headers: Object.fromEntries(headers), status: res.status, statusText: res.statusText, body: buffer }, [buffer]);
                                } catch {
                                    // Deno throws network errors on missing files so just simulate a 404 here.
                                    port.postMessage({ uri, status: 404, statusText: 'Not Found' });

                                }
                                port.close()
                            }
                        }

                    }

                    globalThis.addEventListener('pagehide', () => this.disconnect(), { signal: this.#abortCtl.signal });

                    this.#target.postMessage({ type: 'connect' }, [channel.port2]);
                });

                this.#status = 'connected';
            } catch(e) {
                this.#status = 'error';
                this.#error  = String(e);
                throw e;
            }

        })();
        return this.#connectPromise;
    }

    /**
     * Checks if the worker is connected.
     * @return {this is { status: 'connected', worker: Worker|SharedWorker, channel: MessageChannel}}
     */
    isConnected() {
        return this.#status === 'connected' && this.#worker !== null && this.#channel !== null;
    }

    /**
     * Disconnects from the worker.
     */
    disconnect() {
        if (this.channel) {
            this.channel.port1.postMessage({ type: 'disconnect' });
            this.channel.port1.close();
            this.channel.port2.close();

            this.#worker  = null;
            this.#channel = null;
        }
        this.#abortCtl.abort('Worker disconnected');
        this.#abortCtl = new AbortController();

        this.#status = 'disconnected';
    }

    /**
     * Calls a method on the worker.
     * @param {object} details - The method call details.
     * @param {string} details.method - The name of the method to call.
     * @param {any[]} [details.args] - The arguments to pass to the method.
     * @param {Iterable<Transferable>} [details.transfer] - Transferable objects to pass with the method call.
     * @param {AbortSignal} [details.signal] - An optional AbortSignal to cancel the method call.
     */
    async callMethod({ method, args, transfer, signal }) {
        if (!this.isConnected()) {
            throw new Error('Worker not connected');
        }
        const response = await WorkerHelper.#asyncPostMessage(this.channel.port1, { type: 'method', method, args }, transfer, signal);

        if (response.data?.ok) {
            return response.data.result;
        } else {
            throw response.data.error;
        }
    }

    /**
     * Generates the preamble script for the worker, which includes fetch proxying and import map handling.
     * @param {string} uri
     */
    static async #getModulePreamble(uri) {
        esModuleShimsPromise ??= fetch(esModuleShimsURL).then((res) => res.text());

        const esModuleShimsContent = await esModuleShimsPromise;
        return /* javascript */`// @ts-nocheck
            // === Fetch Proxy ======================================
            ${WorkerHelper.#asyncPostMessage.toString()
                .replace('async #asyncPostMessage', 'async function asyncPostMessage')
                .replace(/^ {4}/gm, '            ')
                .trim()
            }
            /**
             * This is required for es-module-shims to work correctly
             */
            class ResponseWrapper extends Response {
                #url;
                get url() { return this.#url; }
                constructor(body, init) {
                    super(body, init);
                    this.#url = init.url;
                }
            }

            globalThis.fetch = async (uri, options) => {
                const client = clients[0];
                clients.push(clients.shift());

                return asyncPostMessage(client, { type: 'fetch', uri: uri.toString(), options }).then(response => {
                    const { uri, headers, status, statusText, body } = response.data;
                    return new ResponseWrapper(body, { headers, status, statusText, url: uri });
                });
            }
            // === es-module-shims ===================================
            ${esModuleShimsContent}
            // === Preamble ==========================================
            const clients = [];

            globalThis.Worker ??= class {
                constructor() {
                    throw new Error('Worker not supported in this context');
                }
            }

            globalThis.SharedWorker ??= class {
                constructor() {
                    throw new Error('SharedWorker not supported in this context');
                }
            }

            globalThis.REV = { importmap: { content: ${JSON.stringify(await importmapContent())} } };
            importShim.addImportMap(globalThis.REV.importmap.content);

            let initPromise;
            let workerModule;

            async function init(moduleUrl) {
                workerModule = await importShim(moduleUrl);
            }

            self.onmessage = async ({ ports: [client] }) => {
                clients.push(client);

                client.onmessage = async ({ data, ports: [port] }) => {
                    switch(data.type) {
                        case 'disconnect':
                            client.close();
                            clients.splice(clients.indexOf(client), 1);
                            if (clients.length === 0) {
                                self.close();
                            }
                            break;
                        case 'method':
                            const { method, args = [] } = data;

                            const abortCtl = new AbortController();

                            port.onmessage = (message) => abortCtl.abort(message.data);

                            try {
                                const { result, transfer } = await workerModule[method]?.(...args, abortCtl.signal);

                                if (abortCtl.signal.aborted){ // check aborted in case method does not honor signal
                                    throw new DOMException(abortCtl.signal.reason, 'AbortError');
                                }

                                port.postMessage({ ok: true, result }, transfer);
                            } catch(e) {
                                port.postMessage({ ok: false, error: e });
                            }
                            break;
                    }
                    port.close();
                }

                try {
                    initPromise ??= init('${uri}');
                    await initPromise;
                    client.postMessage({ type: 'connect' });
                } catch(e) {
                    client.postMessage({ type: 'error', error: e });
                }
            }

            // SharedWorker Support
            let lock;
            self.onconnect = ({ ports: [port] }) => {
                lock ??= navigator.locks.request('SharedWorker:${uri}', () => {
                    const blobChannel = new BroadcastChannel('SharedWorker:${uri}');
                    blobChannel.onmessage = () => blobChannel.postMessage(import.meta.url);
                    return new Promise(() => {});
                });
                port.onmessage = ({ ports: [client] }) => {
                    self.onmessage({ ports: [client] });
                    port.close();
                }
            }
            //# sourceURL=${uri}?preamble
        `.replace(/^ {12}/gm, '').trim();
    }

    /**
     * Extends a postMessage call with MessageChannel and returns a promise that resolves when the MessagePort responds on the worker side.
     *
     * @param {MessagePort|Worker} target
     * @param {any} message
     * @param {Iterable<Transferable>} [transfer]
     * @param {AbortSignal} [signal]
     */
    static async #asyncPostMessage(target, message, transfer, signal) {
        const channel = new MessageChannel();

        target.postMessage(message, transfer ? [channel.port2, ...transfer] : [channel.port2]);

        return new Promise((resolve, reject) => {
            signal?.addEventListener('abort', () => {
                channel.port1.postMessage(signal.reason);
                reject(new DOMException(signal.reason, 'AbortError'));
            }, { once: true });
            channel.port1.onmessage = (e) => resolve(e);
        }).finally(() => {
            channel.port1.close();
            channel.port2.close();
        });
    }
}

/**
 * A pool of worker helpers for managing multiple web workers.
 * This class allows for distributing tasks across a specified number of workers,
 * balancing the load by assigning tasks to the least busy worker.
 * @example
 * ```javascript
 * const pool = new WorkerHelperPool('path/to/worker/script.js', { type: 'module' });
 * await pool.connect(4);
 * const result = await pool.callMethod({ method: 'myMethod', args: [1, 2, 3] });
 * ```
 */
export class WorkerHelperPool {
    /** @type {Promise<this>|null} */
    #connectPromise = null;

    /** @type {'disconnected'|'connecting'|'connected'|'error'} */
    #status = 'disconnected';

    /**
     * The current status of the WorkerHelperPool.
     */
    get status() {
        return this.#status;
    }

    /**
     * The number of workers in the pool.
     */
    get count() {
        return this.#workers.length;
    }

    /** @type {WorkerHelper[]} */
    #workers = [];

    get workers() {
        return this.#workers;
    }

    /**
     * @type {WeakMap<WorkerHelper, number>} - Map to track the number of tasks per worker.
     */
    #tasks = new WeakMap();

    /**
     * Creates an instance of WorkerHelperPool.
     * @param {URL|string} uri - a string representing the URL of the module script the worker will execute.
     * @param {WorkerOptions} options - options to pass to the Worker constructor.
     */
    constructor(uri, options) {
        /**
         * The URI of the worker script.
         */
        this.uri    = uri;

        /**
         * The options for the Worker constructor.
         */
        this.options = options;
    }

    /**
     * Connects the worker pool based on the specified number of workers.
     *
     * @param {number} [n] - The number of workers to connect in the pool.
     */
    connect(n = 2) {
        if (n !== this.#workers.length) {
            this.#connectPromise = null;

            for (let i = 0; i < n; i++) { // Create new workers
                this.#workers[i] ??= new WorkerHelper(this.uri, this.options);
            }

            for (let i = n; i < this.#workers.length; i++) { // Disconnect extra workers
                this.#workers[i]?.disconnect();
            }

            this.#workers.length = n;
        }

        this.#connectPromise ??= (async () => {
            this.#status = 'connecting';
            try {
                for (const worker of this.#workers) {
                    await worker.connect();
                }
                this.#status = 'connected';
            } catch(e) {
                this.#status = 'error';
                throw e;
            }
            return this;
        })();

        return this.#connectPromise;
    }

    /**
     * Calls a method on the least busy worker in the pool.
     * @param {object} details - The method call details.
     * @param {string} details.method - The name of the method to call.
     * @param {any[]} [details.args] - The arguments to pass to the method.
     * @param {Iterable<Transferable>} [details.transfer] - Transferable objects to pass with the method call.
     * @param {AbortSignal} [details.signal] - An optional AbortSignal to cancel the method call.
     */
    async callMethod({ method, args, transfer, signal }) {
        if (!this.isConnected()) {
            throw new Error('Worker not connected');
        }

        const [target] = this.#workers.sort((a, b) => this.#getTasksCount(a) - this.#getTasksCount(b));

        this.#incTasksCount(target, 1);

        return target.callMethod({ method, args, transfer, signal }).finally(() => this.#incTasksCount(target, -1));
    }

    /**
     * @param {WorkerHelper} worker
     */
    #getTasksCount(worker) {
        return this.#tasks.get(worker) ?? 0;
    }

    /**
     * @param {WorkerHelper} worker
     * @param {number} n
     */
    #incTasksCount(worker, n) {
        const count = this.#getTasksCount(worker);
        this.#tasks.set(worker, count + n);
    }

    /**
     * Returns true if the worker pool is connected.
     * @return {this is { status: 'connected', pool: ({ worker: Worker|SharedWorker, channel: MessageChannel })[] }}
     */
    isConnected() {
        return this.#status === 'connected';
    }

    /**
     * Disconnects all workers in the pool.
     */
    disconnect() {
        for (const worker of this.#workers) {
            worker.disconnect();
        }
        this.#workers.length = 0;
        this.#connectPromise = null;
        this.#status = 'disconnected';
    }
}
