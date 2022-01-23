export class WorkerHelper {
    #workerPool = [];
    constructor({ worker, count = 4, constants = '' }) {
        this.count = count;

        const fn = worker.toString();
        this.blob = URL.createObjectURL(new Blob([/* js */`
        ${constants}
        async function importUMD(path) {
            globalThis.exports = {};
            await import(path);
            const { exports } = globalThis;
            delete globalThis.exports;
            return exports;
        }
        ${fn.substring(fn.indexOf('{') + 1, fn.lastIndexOf('}'))}
        `], { type : 'application/javascript' } ));
    }

    get initialized(){
        return this.#workerPool.length !== 0;
    }

    init() {
        for(let i = 0; i < this.count; i++) {
            const worker = new Worker(this.blob, { type: 'module' });
            
            worker.nextTaskId = 0;
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
            this.#workerPool[i] = worker;
        }
    }

    async postMessage(message, abortCtl) {
        const worker = this.#workerPool.sort((a, b) => {
            return Object.entries(a.tasks).length - Object.entries(b.tasks).length;
        })[0];
        
        return new Promise((resolve, reject) => {
            const taskId = worker.nextTaskId++;
            worker.tasks[taskId] = { resolve, reject, abortCtl };
            worker.postMessage({ ...message, taskId });
        });
    }
}

export default WorkerHelper;