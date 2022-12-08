import { importUMD } from './import-umd.js';

const ES_MODULE_SHIMS_URL = 'https://ga.jspm.io/npm:es-module-shims@1.6.2/dist/es-module-shims.wasm.js';

export class WorkerHelper {
    #initPromise;
    #workerPool = [];
    constructor({ url, count = 1 }) {
        this.count  = count;
        this.url = url;

        const promises = [];
        for(let i = 0; i < this.count; i++) {
            const worker = new Worker(WorkerHelper.createShimBlob(this.url) /*, { type: 'module' } */); //converted to module by shim
            worker.nextTaskId = 1;
            worker.tasks = {};
            worker.addEventListener('message', (message) => {
                const { taskId, error } = message.data;
                const task = worker.tasks[taskId];
                if(task) {
                    if(task.abortCtl && task.abortCtl.signal && task.abortCtl.signal.aborted) task.reject(new DOMException('Aborted', 'AbortError'));
                    else if(error) task.reject(error);
                    else task.resolve(message.data)
                    delete worker.tasks[taskId];
                }
            });

            promises.push(new Promise((resolve, reject) => worker.tasks[0] = { resolve, reject }));
            
            this.#workerPool[i] = worker;
        }
        this.#initPromise = Promise.all(promises);
    }

    get initialized() {
        return this.#initPromise.then(() => true);
    }

    async postMessage(message, transfer, abortCtl) {
        const worker = this.#workerPool.sort((a, b) => {
            return Object.entries(a.tasks).length - Object.entries(b.tasks).length;
        })[0];
        
        return await new Promise((resolve, reject) => {
            const taskId = worker.nextTaskId++;
            worker.tasks[taskId] = { resolve, reject, abortCtl };
            worker.postMessage({ ...message, taskId }, transfer);
        });
    }

    static createWorkerBlob({ worker, constants = {}, helpers = {} }) {
        function getFunctionAsync(fn) {
            return `${fn.constructor.name === 'AsyncFunction' ? 'async ': ''}`;
        }
        
        function getFunctionParams(fn) {
            const str = fn.toString();
            return `${str.substring(str.indexOf('(') + 1, str.indexOf(')'))}`;
        }
        
        function getFunctionBody(fn) {
            const str = fn.toString();
            return `${str.substring(str.indexOf('{') + 1, str.lastIndexOf('}'))}`;
        }

        helpers.importUMD = importUMD;

        return URL.createObjectURL(new Blob([
            `${Object.entries(constants).map(([name, value]) => `const ${name} = '${value}';`).join('\n')}

            ${Object.entries(helpers).map(([name, value]) => `
            ${getFunctionAsync(value)}function ${name}(${getFunctionParams(value)}){
                ${getFunctionBody(value).trim()}
            };`).join('\n')}
            ${getFunctionBody(worker)}
        `], { type : 'application/javascript' } ));
    }

    static createShimBlob(url) {
        return URL.createObjectURL(new Blob(
            [
                `importScripts('${ES_MODULE_SHIMS_URL}');
                importShim.addImportMap(${JSON.stringify(importShim.getImportMap())});
                importShim('${new URL(url).href}').catch(e => setTimeout(() => { throw e; }))`
            ],  { type: 'application/javascript' }));
    }
}

export function ready() {
    self.postMessage({ taskId: 0 });
}

export function addMessageHandler(type, handler) {
    self.addEventListener('message', async ({ data }) => {
        if(data.type === type) {
            try {
                self.postMessage({ taskId: data.taskId, ...(await handler(data)) });
            } catch(error) {
                console.error(error);
                self.postMessage({ taskId: data.taskId, error });
            }
        }
    })
}

export { importUMD };
export default WorkerHelper;