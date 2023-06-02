export class WorkerHelper {
    #initPromise;
    #workerPool = [];
    constructor({ worker, count = 4, constants = '' }) {
        this.count = count;

        const fn = worker.toString();
        this.blob = URL.createObjectURL(new Blob([/* js */`
        ${constants}
        async function importUMD(path) {
            globalThis.exports = {};
            try {
                importScripts(path);
            } catch {
                await import(path);
            }
            const { exports } = globalThis;
            delete globalThis.exports;
            return exports;
        }
        ${fn.substring(fn.indexOf('{') + 1, fn.lastIndexOf('}'))}
        `], { type : 'application/javascript' } ));
    }

    async init() {
        if(!this.#initPromise) {
            const promises = [];
            for(let i = 0; i < this.count; i++) {
                const worker = new Worker(this.blob, { type: 'module' });
                worker.nextTaskId = 1;
                worker.tasks = {};
                worker.addEventListener('message', (message) => {
                    const { taskId, error } = message.data;
                    const task = worker.tasks[taskId];
                    if(task) {
                        if(task.signal?.aborted) task.reject(new DOMException('Aborted', 'AbortError'));
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
        return await this.#initPromise;
    }

    async postMessage(message, signal) {
        const worker = this.#workerPool.sort((a, b) => {
            return Object.entries(a.tasks).length - Object.entries(b.tasks).length;
        })[0];
        
        return await new Promise((resolve, reject) => {
            const taskId = worker.nextTaskId++;
            worker.tasks[taskId] = { resolve, reject, signal };
            worker.postMessage({ ...message, taskId });
        });
    }
}

export default WorkerHelper;