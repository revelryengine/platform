import { describe, it, expect, beforeEach, afterEach, PromiseDeferred, browserOnly, denoOnly } from 'bdd';

import { WorkerHelper, WorkerHelperPool } from '../worker-helper.js';

describe('WorkerHelper', () => {
    /**
     * @type {WorkerHelper}
     */
    let helper;
    beforeEach(() => {
        helper = new WorkerHelper(import.meta.resolve('./__fixtures__/worker.js'), { type: 'module' });
    });

    afterEach(() => {
        helper.disconnect();
    });

    describe('status', () => {
        it('returns correct connection status', async () => {
            expect(helper.status).to.equal('disconnected');
            const initPromise = helper.connect();
            expect(helper.status).to.equal('connecting');
            await initPromise;
            expect(helper.status).to.equal('connected');
            helper.disconnect();
            expect(helper.status).to.equal('disconnected');
        });

        it('returns error after a failed init', async () => {
            const helper = new WorkerHelper(import.meta.resolve('./__fixtures__/bad-worker.js'), { type: 'module' });
            await expect(helper.connect()).to.be.rejected;
            expect(helper.status).to.equal('error');
            expect(helper.error).to.include('404 Not Found');
            helper.disconnect();
        });
    });

    describe('worker', ()=> {
        it('returns the Worker instance after init', async () => {
            await helper.connect();
            expect(helper.worker).to.be.instanceOf(Worker);
        });
    });

    describe('channel', ()=> {
        it('returns the MessageChannel instance after init', async () => {
            await helper.connect();
            expect(helper.channel).to.be.instanceOf(MessageChannel);
        });
    });

    describe('callMethod', () => {
        it('calls a method on the worker and returns the result', async () => {
            await helper.connect();

            const result = await helper.callMethod({ method: 'method', args: [] });
            expect(result).to.equal('bar');
        });

        it('aborts the method call when the provided signal is aborted', async () => {
            await helper.connect();
            const controller = new AbortController();
            const promise = helper.callMethod({ method: 'method', args: [], signal: controller.signal });
            controller.abort('test abort');
            await expect(promise).to.be.rejectedWith('test abort');
        });

        it('rejects the method call when the worker method throws an error', async () => {
            await helper.connect();
            const promise = helper.callMethod({ method: 'methodError', args: [] });
            await expect(promise).to.be.rejectedWith('Test error');
            helper.disconnect();
        });

        it('transfers ownership of Transferable objects to the worker', async () => {
            await helper.connect();

            const bytes  = new Uint8Array([1, 2, 3, 4, 5]);
            const result = await helper.callMethod({ method: 'methodTransfer', args: [bytes], transfer: [bytes.buffer] });

            expect(bytes.byteLength).to.equal(0);
            expect(result.byteLength).to.equal(5);
            expect(result).to.deep.equal(new Uint8Array([5, 4, 3, 2, 1]));

            helper.disconnect();
        });

        it('rejects method calls made when the worker is not connected', async () => {
            const promise = helper.callMethod({ method: 'method', args: [] });
            await expect(promise).to.be.rejectedWith('Worker not connected');
        });
    });


    describe('disconnect', () => {
        it('terminates the worker and updates the status', async () => {
            await helper.connect();
            expect(helper.status).to.equal('connected');
            helper.disconnect();
            expect(helper.status).to.equal('disconnected');
        });
    });

    describe('isConnected', () => {
        it('returns true when connected', async () => {
            expect(helper.isConnected()).to.be.false;
            const promise = helper.connect();
            expect(helper.isConnected()).to.be.false;
            await promise;
            expect(helper.isConnected()).to.be.true;
            helper.disconnect();
            expect(helper.isConnected()).to.be.false;
        });
    });

    denoOnly('classic worker', () => {
         it('throws if classic worker not supported in environment', async () => {
            const helperUndefined = new WorkerHelper(import.meta.resolve('./__fixtures__/worker.js'));
            const helperClassic   = new WorkerHelper(import.meta.resolve('./__fixtures__/worker.js'), { type: 'classic' });

            await expect(helperUndefined.connect()).to.be.rejectedWith('Classic workers are not supported.');
            helperUndefined.disconnect();

            await expect(helperClassic.connect()).to.be.rejectedWith('Classic workers are not supported.');
            helperClassic.disconnect();
        });
    });
});

describe('WorkerHelperPool', () => {
    /**
     * @type {WorkerHelperPool}
     */
    let pool;
    beforeEach(() => {
        pool = new WorkerHelperPool(import.meta.resolve('./__fixtures__/worker.js'), { type: 'module' });
    });

    afterEach(() => {
        pool.disconnect();
    });

    describe('status', () => {
        it('returns correct connection status', async () => {
            expect(pool.status).to.equal('disconnected');
            const initPromise = pool.connect();
            expect(pool.status).to.equal('connecting');
            await initPromise;
            expect(pool.status).to.equal('connected');
            pool.disconnect();
            expect(pool.status).to.equal('disconnected');
        });

        it('returns error after a failed init', async () => {
            const pool = new WorkerHelperPool(import.meta.resolve('./__fixtures__/bad-worker.js'), { type: 'module' });
            await expect(pool.connect()).to.be.rejected;
            expect(pool.status).to.equal('error');
            expect(pool.workers[0].error).to.include('404 Not Found');
            pool.disconnect();
        });
    });

    describe('connect', () => {
        it('connects the specified number of workers', async () => {
            await pool.connect(3);
            expect(pool.workers).to.have.lengthOf(3);
        });

        it('connects the default number of workers if not specified', async () => {
            await pool.connect();
            expect(pool.workers).to.have.lengthOf(2);
        });

        it('reconnects with different number of workers', async () => {
            await pool.connect(2);
            expect(pool.workers).to.have.lengthOf(2);
            await pool.connect(4);
            expect(pool.workers).to.have.lengthOf(4);
        });

        it('disconnects extra workers when reducing the pool size', async () => {
            await pool.connect(4);
            expect(pool.workers).to.have.lengthOf(4);
            const disconnectedWorkers = pool.workers.slice(2);
            await pool.connect(2);
            expect(pool.workers).to.have.lengthOf(2);
            disconnectedWorkers.forEach((worker) => {
                expect(worker.status).to.equal('disconnected');
            });
        });
    });

    describe('workers', () => {
        it('returns the WorkerHelper instances after init', async () => {
            await pool.connect(2);
            expect(pool.workers).to.have.lengthOf(2);
            expect(pool.workers[0]).to.be.instanceOf(WorkerHelper);
            expect(pool.workers[1]).to.be.instanceOf(WorkerHelper);
        });
    });

    describe('count', () => {
        it('returns 0 before connect', () => {
            expect(pool.count).to.equal(0);
        });

        it('returns the number of workers after connect', async () => {
            await pool.connect(3);
            expect(pool.count).to.equal(3);
        });
    });

    describe('callMethod', () => {
        it('calls a method on the worker and returns the result', async () => {
            await pool.connect();

            const result = await pool.callMethod({ method: 'method', args: [] });
            expect(result).to.equal('bar');
        });

        it('aborts the method call when the provided signal is aborted', async () => {
            await pool.connect();
            const controller = new AbortController();
            const promise = pool.callMethod({ method: 'method', args: [], signal: controller.signal });
            controller.abort('test abort');
            await expect(promise).to.be.rejectedWith('test abort');
        });

        it('rejects the method call when the worker method throws an error', async () => {
            await pool.connect();
            const promise = pool.callMethod({ method: 'methodError', args: [] });
            await expect(promise).to.be.rejectedWith('Test error');
            pool.disconnect();
        });

        it('transfers ownership of Transferable objects to the worker', async () => {
            await pool.connect();

            const bytes  = new Uint8Array([1, 2, 3, 4, 5]);
            const result = await pool.callMethod({ method: 'methodTransfer', args: [bytes], transfer: [bytes.buffer] });

            expect(bytes.byteLength).to.equal(0);
            expect(result.byteLength).to.equal(5);
            expect(result).to.deep.equal(new Uint8Array([5, 4, 3, 2, 1]));

            pool.disconnect();
        });

        it('rejects method calls made when the worker is not connected', async () => {
            const promise = pool.callMethod({ method: 'method', args: [] });
            await expect(promise).to.be.rejectedWith('Worker not connected');
        });
    });

    describe('isConnected', () => {
        it('returns true when connected', async () => {
            expect(pool.isConnected()).to.be.false;
            const promise = pool.connect();
            expect(pool.isConnected()).to.be.false;
            await promise;
            expect(pool.isConnected()).to.be.true;
            pool.disconnect();
            expect(pool.isConnected()).to.be.false;
        });
    });
});

denoOnly('WorkerHelper shared=true', () => {
    it('throws if trying to use SharedWorker in unsupported environment', () => {
        const fn = () => new WorkerHelper(import.meta.resolve('./__fixtures__/worker.js'), { type: 'module', shared: true });
        expect(fn).to.throw('SharedWorker is not supported in this environment');
    });
});

browserOnly('WorkerHelper shared=true', () => {
    afterEach(async() => {
        await new Promise((resolve) => setTimeout(resolve, 50)); // Give time for SharedWorker locks to clear
    });

    describe('api', () => {
        /**
         * @type {WorkerHelper}
         */
        let helper;
        beforeEach(() => {
            helper = new WorkerHelper(import.meta.resolve('./__fixtures__/worker.js'), { type: 'module', shared: true });
        });

        afterEach(() => {
            helper.disconnect();
        });

        describe('status', () => {
            it('returns correct connection status', async () => {
                expect(helper.status).to.equal('disconnected');
                const initPromise = helper.connect();
                expect(helper.status).to.equal('connecting');
                await initPromise;
                expect(helper.status).to.equal('connected');
                helper.disconnect();
                expect(helper.status).to.equal('disconnected');
            });

            it('returns error after a failed init', async () => {
                const helper = new WorkerHelper(import.meta.resolve('./__fixtures__/bad-worker.js'), { type: 'module', shared: true });
                await expect(helper.connect()).to.be.rejected;
                expect(helper.status).to.equal('error');
                expect(helper.error).to.include('404 Not Found');
                helper.disconnect();
            });
        });

        describe('worker', ()=> {
            it('returns the Worker instance after init', async () => {
                await helper.connect();
                expect(helper.worker).to.be.instanceOf(SharedWorker);
            });
        });

        describe('channel', ()=> {
            it('returns the MessageChannel instance after init', async () => {
                await helper.connect();
                expect(helper.channel).to.be.instanceOf(MessageChannel);
            });
        });

        describe('callMethod', () => {
            it('calls a method on the worker and returns the result', async () => {
                await helper.connect();

                const result = await helper.callMethod({ method: 'method', args: [] });
                expect(result).to.equal('bar');
            });

            it('aborts the method call when the provided signal is aborted', async () => {
                await helper.connect();
                const controller = new AbortController();
                const promise = helper.callMethod({ method: 'method', args: [], signal: controller.signal });
                controller.abort('test abort');
                await expect(promise).to.be.rejectedWith('test abort');
            });

            it('rejects the method call when the worker method throws an error', async () => {
                await helper.connect();
                const promise = helper.callMethod({ method: 'methodError', args: [] });
                await expect(promise).to.be.rejectedWith('Test error');
                helper.disconnect();
            });

            it('transfers ownership of Transferable objects to the worker', async () => {
                await helper.connect();

                const bytes  = new Uint8Array([1, 2, 3, 4, 5]);
                const result = await helper.callMethod({ method: 'methodTransfer', args: [bytes], transfer: [bytes.buffer] });

                expect(bytes.byteLength).to.equal(0);
                expect(result.byteLength).to.equal(5);
                expect(result).to.deep.equal(new Uint8Array([5, 4, 3, 2, 1]));
            });

            it('rejects method calls made when the worker is not connected', async () => {
                const promise = helper.callMethod({ method: 'method', args: [] });
                await expect(promise).to.be.rejectedWith('Worker not connected');
            });
        });

        describe('disconnect', () => {
            it('terminates the worker and updates the status', async () => {
                await helper.connect();
                expect(helper.status).to.equal('connected');
                helper.disconnect();
                expect(helper.status).to.equal('disconnected');
            });
        });

        describe('isConnected', () => {
            it('returns true when connected', async () => {
                expect(helper.isConnected()).to.be.false;
                const promise = helper.connect();
                expect(helper.isConnected()).to.be.false;
                await promise;
                expect(helper.isConnected()).to.be.true;
                helper.disconnect();
                expect(helper.isConnected()).to.be.false;
            });
        });
    });

    describe('multiple pages', () => {
        async function openPage() {
            const id = Math.random().toString(16).slice(2);
            const page = globalThis.open(`${import.meta.resolve('./__fixtures__/worker-browser.html')}#${id}`, '_blank');

            if (!page) throw new Error('Failed to open page');

            const abortCtl = new AbortController();

            return PromiseDeferred.timeout(new Promise((resolve) => {
                globalThis.addEventListener('message', (message) => {
                    if (message.data?.id === id) {
                        resolve(message);
                    }
                }, { signal: abortCtl.signal });
            }), 1000, 'Timeout').catch((e) => {
                page?.close();
                throw e;
            }).then((message) => ({ count: message.data.count, page })).finally(() => abortCtl.abort());
        }

        it('disconnects on pagehide', async () => {
            const helper = new WorkerHelper(import.meta.resolve('./__fixtures__/worker.js'), { type: 'module', shared: true });
            await helper.connect();

            globalThis.dispatchEvent(new Event('pagehide'));
            expect(helper.status).to.equal('disconnected');
        });

        it('shares the same worker instance between pages', async () => {
            const helper = new WorkerHelper(import.meta.resolve('./__fixtures__/worker.js'), { type: 'module', shared: true });
            await helper.connect();

            const count0 = await helper.callMethod({ method: 'methodIncrement', args: [] });
            expect(count0).to.equal(0);

            const { count: count1, page: page1 } = await openPage();
            const { count: count2, page: page2 } = await openPage();
            const { count: count3, page: page3 } = await openPage();

            expect(count1).to.equal(1);
            expect(count2).to.equal(2);
            expect(count3).to.equal(3);

            page1.close();
            page2.close();
            page3.close();

            helper.disconnect();
        });

        it('falls back to new worker when original page is closed', async () => {
            const helper0 = new WorkerHelper(import.meta.resolve('./__fixtures__/worker.js'), { type: 'module', shared: true });
            await helper0.connect();

            const count0 = await helper0.callMethod({ method: 'methodIncrement', args: [] });
            expect(count0).to.equal(0);

            const helper1 = new WorkerHelper(import.meta.resolve('./__fixtures__/worker.js'), { type: 'module', shared: true });
            await helper1.connect();

            const count1 = await helper1.callMethod({ method: 'methodIncrement', args: [] });
            expect(count1).to.equal(1);

            helper0.disconnect();

            const { count: count2, page: page2 } = await openPage();
            expect(count2).to.equal(2);

            page2.close();

            helper1.disconnect();
        });
    });
});
