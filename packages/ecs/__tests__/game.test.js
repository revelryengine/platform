import { describe, it, expect, sinon, beforeEach, afterEach } from 'bdd';

import { Game   } from '../game.js';
import { Stage  } from '../stage.js';
import { System } from '../system.js';

describe('Game', () => {
    /** @type {Game} */
    let game;
    /** @type {sinon.SinonFakeTimers} */
    let clock;

    /** @type {sinon.SinonSpy} */
    let loop;
    /** @type {sinon.SinonSpy} */
    let update;
    /** @type {sinon.SinonSpy} */
    let render;

    beforeEach(() => {
        clock = sinon.useFakeTimers();
        game = new Game();

        loop   = sinon.spy(game, 'loop');
        update = sinon.spy(game, 'update');
        render = sinon.spy(game, 'render');
    });

    afterEach(() => {
        clock.restore();
    });

    describe('start', () => {
        beforeEach(() => {
            game.start();
        });

        it('should loop repeatedly', async () => {
            await clock.tickAsync(0);
            await clock.tickAsync(game.targetFrameRate);
            await clock.tickAsync(game.targetFrameRate);
            await clock.tickAsync(game.targetFrameRate);
            expect(loop).to.have.callCount(3);
        });
    });

    describe('pause', () => {
        beforeEach(() => {
            game.start();
        });

        it('should cancel requestAnimationFrame and loop should not be called', async () => {
            await clock.tickAsync(game.targetFrameRate);
            await clock.tickAsync(game.targetFrameRate);
            expect(loop).to.have.callCount(2);
            game.pause();
            await clock.tickAsync(game.targetFrameRate);
            expect(loop).to.have.callCount(2);
        });
    });

    describe('loop', () => {
        it('should call game.update with a fixed timeloop of config.targetFrameRate', async () => {
            await game.loop(game.targetFrameRate * 2);
            expect(update).to.have.been.calledTwice;
            expect(update).to.have.been.calledWith(game.targetFrameRate);
        });

        it('should drop any frames after config.frameThreshold', async () => {
            await game.loop(game.frameThreshold * 2);
            expect(update).to.have.callCount(Math.floor(game.frameThreshold / game.targetFrameRate));
        });

        it('should call render exactly once', async () => {
            await game.loop(game.targetFrameRate * 2);
            expect(render).to.have.been.calledOnce;
        });

        it('should not call render if an update has not occured', async () => {
            await game.loop(game.targetFrameRate / 2);
            expect(render).not.to.have.been.called;
        });
    });

    describe('getContext', () => {
        /** @type {Stage} */
        let stage;
        /** @type {System} */
        let system;

        beforeEach(() => {
            stage  = new Stage(game, 'stage');
            system = new System(stage);
            stage.systems.add(system);

            game.stages.add(stage);
        });

        it('should return the stage by id', () => {
            expect(game.getContext('stage')).to.equal(stage);
        });

        it('should return the system by stage:system id', () => {
            expect(game.getContext('stage:system')).to.equal(system);
        });

        it('should throw if stage is not found', () => {
            expect(() => {
                game.getContext('foo');
            }).to.throw('Stage with id "foo" not found');
        });

        it('should throw if system is not found', () => {
            expect(() => {
                game.getContext('stage:foo');
            }).to.throw('System with id "foo" not found');
        });
    });

    describe('requestAnimationFrame and cancelAnimationFrame', () => {
        describe('polyfill', () => {
            /**
             * @type {Window['requestAnimationFrame']}
             */
            let originalRequestAnimationFrame;
            /**
             * @type {Window['cancelAnimationFrame']}
             */
            let originalCancelAnimationFrame;

            beforeEach(() => {
                originalRequestAnimationFrame = globalThis.requestAnimationFrame;
                originalCancelAnimationFrame  = globalThis.cancelAnimationFrame;

                // @ts-ignore polyfill for testing
                delete globalThis.requestAnimationFrame;
                // @ts-ignore polyfill for testing
                delete globalThis.cancelAnimationFrame;
            });

            afterEach(() => {
                globalThis.requestAnimationFrame = originalRequestAnimationFrame;
                globalThis.cancelAnimationFrame  = originalCancelAnimationFrame;
            });

            it('should polyfill requestAnimationFrame with setTimeout if not defined', () => {
                const timeout = sinon.spy(globalThis, 'setTimeout');
                game = new Game();
                game.requestAnimationFrame(() => {});
                expect(timeout).to.have.been.calledOnce;
                timeout.restore();
            });

            it('should polyfill cancelAnimationFrame with clearTimeout if not defined', () => {
                const timeout = sinon.spy(globalThis, 'clearTimeout');
                game = new Game();
                game.cancelAnimationFrame(0);
                expect(timeout).to.have.been.calledOnce;
                timeout.restore();
            });
        });

        describe('native', () => {
            /**
             * @type {Window['requestAnimationFrame']}
             */
            let originalRequestAnimationFrame;
            /**
             * @type {Window['cancelAnimationFrame']}
             */
            let originalCancelAnimationFrame;
            beforeEach(() => {
                originalRequestAnimationFrame = globalThis.requestAnimationFrame;
                originalCancelAnimationFrame  = globalThis.cancelAnimationFrame;

                globalThis.requestAnimationFrame = () => 0;
                globalThis.cancelAnimationFrame  = () => 0;
            });

            afterEach(() => {
                globalThis.requestAnimationFrame = originalRequestAnimationFrame;
                globalThis.cancelAnimationFrame  = originalCancelAnimationFrame;
            });

            it('should use globalThis.requestAnimationFrame if defined', () => {
                const raf = sinon.spy();
                globalThis.requestAnimationFrame = raf;
                game = new Game();
                game.requestAnimationFrame(() => {});
                expect(raf).to.have.been.calledOnce;
                // @ts-ignore unsetting requestAnimationFrame in deno
                delete globalThis.requestAnimationFrame;
            });

            it('should use globalThis.cancelAnimationFrame if defined', () => {
                const caf = sinon.spy();
                globalThis.cancelAnimationFrame = caf;
                game = new Game();
                game.cancelAnimationFrame(0);
                expect(caf).to.have.been.calledOnce;
                // @ts-ignore unsetting cancelAnimationFrame in deno
                delete globalThis.cancelAnimationFrame;
            });
        })
    });

    describe('stages.add', () => {
        /** @type {Stage} */
        let stage;
        /** @type {System} */
        let system;


        beforeEach(() => {
            stage  = new Stage(game, 'stage');
            system = new System(stage);

            stage.systems.add(system);
            game.stages.add(stage);
        });

        it('should not error if stage already exists', () => {
            game.stages.add(stage);
        });

        it('should error if another stage with the same name is added', () => {
            expect(() => {
                game.stages.add(new Stage(game, stage.id));
            }).to.throw(`Stage with id ${stage.id} already exists`)
        });
    });

    describe('createStage', () => {
        /** @type {Stage} */
        let stage;

        beforeEach(() => {
            stage = game.createStage('stage');
        });

        it('should add stage to stages', () => {
            expect(game.stages.has(stage)).to.be.true;
        });

        it('should error if another stage with the same name is added', () => {
            expect(() => {
                game.createStage('stage');
            }).to.throw(`Stage with id ${stage.id} already exists`);
        });
    });

    describe('stages.delete', () => {
        /** @type {Stage} */
        let stage;
        /** @type {System} */
        let system;


        beforeEach(() => {
            stage  = new Stage(game, 'stage');
            system = new System(stage);

            stage.systems.add(system);

            game.stages.add(stage);
            game.stages.delete(stage);
        });


        it('should return false if stage is not present', () => {
            expect(game.stages.delete(new Stage(game, 'stageB'))).to.be.false;
        });
    });

    describe('deleteStage', () => {
        /** @type {Stage} */
        let stage;

        beforeEach(() => {
            stage = game.createStage('stage');
            game.deleteStage('stage');
        });

        it('should remove stage from stages', () => {
            expect(game.stages.has(stage)).to.be.false;
        });

        it('should return false if stage is not present', () => {
            expect(game.deleteStage('stage2')).not.to.exist;
        });
    });

    describe('update', () => {
        /** @type {Stage} */
        let stageA;
        /** @type {Stage} */
        let stageB;

        /** @type {sinon.SinonSpy} */
        let updateA;
        /** @type {sinon.SinonSpy} */
        let updateB;

        beforeEach(() => {
            stageA   = new Stage(game, 'stageA' );
            stageB   = new Stage(game, 'stageB' );

            game.stages.add(stageA);
            game.stages.add(stageB);

            updateA = sinon.spy(stageA, 'update');
            updateB = sinon.spy(stageB, 'update');
        });

        it('should call update on all stages', () => {
            game.update(1);
            expect(updateA).to.have.been.calledOnce;
            expect(updateB).to.have.been.calledOnce;
        });
    });

    describe('render', () => {
        /** @type {Stage} */
        let stageA;
        /** @type {Stage} */
        let stageB;

        /** @type {sinon.SinonSpy} */
        let renderA;
        /** @type {sinon.SinonSpy} */
        let renderB;

        beforeEach(() => {
            stageA   = new Stage(game, 'stageA');
            stageB   = new Stage(game, 'stageB');

            game.stages.add(stageA);
            game.stages.add(stageB);

            renderA = sinon.spy(stageA, 'render');
            renderB = sinon.spy(stageB, 'render');
        });

        it('should call render on all stages', () => {
            game.render();
            expect(renderA).to.have.been.calledOnce;
            expect(renderB).to.have.been.calledOnce;
        });
    });

    describe('loadFile', () => {
        /**
         * @type {sinon.SinonSpy}
         */
        let fetchSpy;

        beforeEach(async () => {
            fetchSpy = sinon.spy(globalThis, 'fetch');

            await game.loadFile(import.meta.resolve('./__fixtures__/a.revgam'));
        });

        afterEach(() => {
            fetchSpy.restore();
        });

        it('should create a stage for each stage in the file', () => {
            expect(game.stages.size).to.equal(2);
        });

        it('should call loadFile on each stage', () => {
            expect(fetchSpy).to.have.callCount(3);
        })

        it('should clear any existing stages', async () => {
            await game.loadFile(import.meta.resolve('./__fixtures__/b.revgam'));
            expect(game.stages.size).to.equal(2);
            expect(game.getContext('c')).to.exist;
            expect(game.getContext('d')).to.exist;
        });
    });
});
