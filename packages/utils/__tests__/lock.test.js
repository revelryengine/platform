import { describe, it, expect, PromiseDeferred, denoOnly, browserOnly } from 'bdd';

import { requestLock } from '../lock.js';

describe('requestLock', () => {
    describe('options', () => {
        it('defaults to exclusive mode', async () => {
            let modeUsed = null;
            await requestLock('test-lock', {}, async (lock) => {
                modeUsed = lock?.mode;
            });
            expect(modeUsed).to.equal('exclusive');
        });

        it('accepts shared mode', async () => {
            let modeUsed = null;
            await requestLock('test-lock', { mode: 'shared' }, async (lock) => {
                modeUsed = lock?.mode;
            });
            expect(modeUsed).to.equal('shared');
        });

        it('accepts exclusive mode', async () => {
            let modeUsed = null;
            await requestLock('test-lock', { mode: 'exclusive' }, async (lock) => {
                modeUsed = lock?.mode;
            });
            expect(modeUsed).to.equal('exclusive');
        });

        it('throws for an empty lock name', async () => {
            expect(() => requestLock('', { mode: 'exclusive' }, async () => {})).to.throw(TypeError, 'Lock name must be a non-empty string.');
        });

        it('accepts a callback as the second argument', async () => {
            let modeUsed = null;
            await requestLock('test-lock', async (lock) => {
                modeUsed = lock?.mode;
            });
            expect(modeUsed).to.equal('exclusive');
        });

        it('throws if the callback is not a function', async () => {
            expect(() => requestLock('test-lock', { mode: 'exclusive' }, undefined)).to.throw(TypeError, 'Lock callback must be a function.');
        });
    });

    browserOnly('browser environments', () => {

        /**
         * @param {'exclusive' | 'shared'} [mode='exclusive']
         */
        async function openSecondSource(mode = 'exclusive') {
            const page = globalThis.open(`${import.meta.resolve('./__fixtures__/lock-browser.html')}#${mode}`, '_blank');

            return PromiseDeferred.timeout(new Promise((resolve) => {
                globalThis.addEventListener('message', resolve, { once: true });
            }), 1000, 'Timeout').finally(() => page?.close());
        }

        describe('mode=exclusive', () => {
            it('acquires the lock when only a single page is running', async () => {
                let lockAquired = false;
                requestLock('test-lock', { mode: 'exclusive' }, async () => {
                    lockAquired = true;
                });
                await new Promise((resolve) => setTimeout(resolve, 100));
                expect(lockAquired).to.be.true;
            });

            it('blocks second source until first releases lock', async () => {
                let lockAquired = false;

                const deferred = new PromiseDeferred();

                // First acquire the lock and hold it
                requestLock('test-lock', { mode: 'exclusive' }, async () => {
                    await deferred;
                });

                // Give the first lock a moment to be acquired
                await new Promise((resolve) => setTimeout(resolve, 50));

                // Now open a second source
                const secondSourcePromise = openSecondSource().then(() => lockAquired = true);

                // Second source should not be able to acquire the lock yet (give it some time to try)
                await new Promise((resolve) => setTimeout(resolve, 200));
                expect(lockAquired).to.be.false;

                // Now release the lock
                deferred.resolve();

                // Wait for the second source to acquire the lock
                await secondSourcePromise;
                expect(lockAquired).to.be.true;
            });
        });

        describe('mode=shared', () => {
            it('allows multiple sources to acquire shared lock simultaneously', async () => {
                let lockAquired = false;

                const deferred = new PromiseDeferred();

                // First acquire the lock and hold it
                requestLock('test-lock', { mode: 'shared' }, async () => {
                    await deferred;
                });

                // Give the first lock a moment to be acquired
                await new Promise((resolve) => setTimeout(resolve, 50));

                openSecondSource('shared').then(() => lockAquired = true);

                // Give process a moment to attempt to acquire the lock
                await new Promise((resolve) => setTimeout(resolve, 500));
                expect(lockAquired).to.be.true;

                deferred.resolve();
            });
        });

        describe('signal', () => {
            it('aborts lock request when signal is aborted', async () => {
                const controller = new AbortController();
                const signal = controller.signal;
                let lockAquired = false;

                const deferred = new PromiseDeferred();

                // First acquire the lock and hold it
                requestLock('test-lock', { mode: 'exclusive' }, async () => {
                    await deferred;
                });

                // Give the first lock a moment to be acquired
                await new Promise((resolve) => setTimeout(resolve, 50));

                const promise2 = requestLock('test-lock', { mode: 'exclusive', signal }, async () => {
                    lockAquired = true;
                });

                controller.abort('test abort');
                await expect(promise2).to.be.rejectedWith('test abort');
                expect(lockAquired).to.be.false;
                deferred.resolve();
            });

            it('aborts lock request when signal is aborted before requesting lock', async () => {
                const controller = new AbortController();
                const signal = controller.signal;
                controller.abort('test abort');
                let lockAquired = false;
                const promise = requestLock('test-lock', { mode: 'exclusive', signal }, async () => {
                    lockAquired = true;
                });
                await expect(promise).to.be.rejectedWith('test abort');
                expect(lockAquired).to.be.false;
            });
        });
    });

    denoOnly('deno environment', () => {
        /**
         * @param {'exclusive' | 'shared'} [mode='exclusive']
         */
        async function openSecondSource(mode = 'exclusive') {
            const process = new Deno.Command(Deno.execPath(), {
                args: [
                    'run', '-A', '--location', 'http://revelry.local',
                    import.meta.resolve('./__fixtures__/lock-deno.js'), mode
                ],
                stdout: 'inherit',
                stderr: 'inherit'
            }).spawn();

            return PromiseDeferred.timeout(process.output(), 1000, 'Timeout').finally(() => {
                try { process.kill('SIGKILL'); } catch { /* */ }
            });
        }

        describe('mode=exclusive', () => {
            it('acquires the lock when only a single Deno subprocess is running', async () => {
                let lockAquired = false;
                requestLock('test-lock', { mode: 'exclusive' }, async () => {
                    lockAquired = true;
                });
                await new Promise((resolve) => setTimeout(resolve, 100));
                expect(lockAquired).to.be.true;
            });

            it('blocks second source until first releases lock', async () => {
                let lockAquired = false;

                const deferred = new PromiseDeferred();

                // First acquire the lock and hold it
                requestLock('test-lock', { mode: 'exclusive' }, async () => {
                    await deferred;
                });

                // Give the first lock a moment to be acquired
                await new Promise((resolve) => setTimeout(resolve, 50));

                // Now open a second source
                const secondSourcePromise = openSecondSource().then(() => lockAquired = true);

                // Second source should not be able to acquire the lock yet (give it some time to try)
                await new Promise((resolve) => setTimeout(resolve, 200));
                expect(lockAquired).to.be.false;

                // Now release the lock
                deferred.resolve();

                // Wait for the second source to acquire the lock
                await secondSourcePromise;
                expect(lockAquired).to.be.true;
            });
        });

        describe('mode=shared', () => {
            it('allows multiple sources to acquire shared lock simultaneously', async () => {
                let lockAquired = false;

                const deferred = new PromiseDeferred();

                // First acquire the lock and hold it
                requestLock('test-lock', { mode: 'shared' }, async () => {
                    await deferred;
                });

                // Give the first lock a moment to be acquired
                await new Promise((resolve) => setTimeout(resolve, 50));

                openSecondSource('shared').then(() => lockAquired = true);

                // Give process a moment to attempt to acquire the lock
                await new Promise((resolve) => setTimeout(resolve, 250));
                expect(lockAquired).to.be.true;

                deferred.resolve();
            });
        });

        describe('ifAvailable', () => {
            it('throws an error when trying to use ifAvailable option in Deno', async () => {
                let lockAquired = false;
                const fn = () => requestLock('test-lock', { mode: 'exclusive', ifAvailable: true }, async () => {
                    lockAquired = true;
                });
                expect(fn).to.throw('The ifAvailable option is not supported in this environment.');
                expect(lockAquired).to.be.false;
            });
        });

        describe('signal', () => {
            it('aborts lock request when signal is aborted', async () => {
                const controller = new AbortController();
                const signal = controller.signal;
                let lockAquired = false;

                const deferred = new PromiseDeferred();

                // First acquire the lock and hold it
                requestLock('test-lock', { mode: 'exclusive' }, async () => {
                    await deferred;
                });

                // Give the first lock a moment to be acquired
                await new Promise((resolve) => setTimeout(resolve, 50));

                const promise2 = requestLock('test-lock', { mode: 'exclusive', signal }, async () => {
                    lockAquired = true;
                });

                controller.abort('test abort');
                await expect(promise2).to.be.rejectedWith('test abort');
                expect(lockAquired).to.be.false;
                deferred.resolve();
            });

            it('aborts lock request when signal is aborted before requesting lock', async () => {
                const controller = new AbortController();
                const signal = controller.signal;
                controller.abort('test abort');
                let lockAquired = false;
                const promise = requestLock('test-lock', { mode: 'exclusive', signal }, async () => {
                    lockAquired = true;
                });
                await expect(promise).to.be.rejectedWith('test abort');
                expect(lockAquired).to.be.false;
            });
        });
    });
});

