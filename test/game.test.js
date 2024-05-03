import { describe, it, beforeEach, afterEach } from 'https://deno.land/std@0.208.0/testing/bdd.ts';
import { spy, assertSpyCall, assertSpyCalls  } from 'https://deno.land/std@0.208.0/testing/mock.ts';
import { FakeTime                            } from 'https://deno.land/std@0.208.0/testing/time.ts';

import { assert       } from 'https://deno.land/std@0.208.0/assert/assert.ts';
import { assertEquals } from 'https://deno.land/std@0.208.0/assert/assert_equals.ts';
import { assertThrows } from 'https://deno.land/std@0.208.0/assert/assert_throws.ts';
import { assertFalse  } from 'https://deno.land/std@0.208.0/assert/assert_false.ts';

import { Game   } from '../lib/game.js';
import { Stage  } from '../lib/stage.js';
import { System } from '../lib/system.js';



/**
 * @import { Spy } from 'https://deno.land/std@0.208.0/testing/mock.ts'
 */

describe('Game', () => {
    /** @type {Game} */
    let game;
    /** @type {FakeTime} */
    let time;

    /** @type {Spy} */
    let loop;
    /** @type {Spy} */
    let update;
    /** @type {Spy} */
    let render;

    beforeEach(() => {
        time = new FakeTime();
        game = new Game();

        loop   = spy(game, 'loop');
        update = spy(game, 'update');
        render = spy(game, 'render');
    });

    afterEach(() => {
        time.restore();
    });

    describe('start', () => {
        beforeEach(() => {
            game.start();
        });

        it('should loop repeatedly', async () => {
            await time.tickAsync();
            await time.tickAsync(game.targetFrameRate);
            await time.tickAsync(game.targetFrameRate);
            await time.tickAsync(game.targetFrameRate);
            assertSpyCalls(loop, 3);
        });
    });

    describe('pause', () => {
        beforeEach(() => {
            game.start();
        });

        it('should cancel requestAnimationFrame and loop should not be called', async () => {
            await time.tickAsync(game.targetFrameRate);
            await time.tickAsync(game.targetFrameRate);
            assertSpyCalls(loop, 2);
            game.pause();
            await time.tickAsync(game.targetFrameRate);
            assertSpyCalls(loop, 2);
        });
    });

    describe('loop', () => {
        it('should call game.update with a fixed timeloop of config.targetFrameRate', async () => {
            await game.loop(game.targetFrameRate * 2);
            assertSpyCalls(update, 2);
            assertSpyCall(update, 0, { args: [game.targetFrameRate ]});
        });

        it('should drop any frames after config.frameThreshold', async () => {
            await game.loop(game.frameThreshold * 2);
            assertSpyCalls(update, Math.floor(game.frameThreshold / game.targetFrameRate));
        });

        it('should call render exactly once', async () => {
            await game.loop(game.targetFrameRate * 2);
            assertSpyCalls(render, 1);
        });

        it('should not call render if an update has not occured', async () => {
            await game.loop(game.targetFrameRate / 2);
            assertSpyCalls(render, 0);
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
            assertEquals(game.getContext('stage'), stage);
        });

        it('should return the system by stage:system id', () => {
            assertEquals(game.getContext('stage:system'), system);
        });

        it('should throw if stage is not found', () => {
            assertThrows(() => {
                game.getContext('foo');
            }, 'Stage with id "foo" not found');
        });

        it('should throw if system is not found', () => {
            assertThrows(() => {
                game.getContext('stage:foo');
            }, 'System with id "foo" not found');
        });
    });

    describe('requestAnimationFrame', () => {

        it('should polyfill requestAnimationFrame with setTimeout', () => {
            const timeout = spy(globalThis, 'setTimeout');
            game = new Game();
            game.requestAnimationFrame(() => {});
            assertSpyCalls(timeout, 1);
            timeout.restore();
        });

        it('should use globalThis.requestAnimationFrame if defined', () => {
            const raf = /** @type {import('https://deno.land/std@0.208.0/testing/mock.ts').Spy<any, any[], number>} */(spy());
            globalThis.requestAnimationFrame = raf;
            game = new Game();
            game.requestAnimationFrame(() => {});
            assertSpyCalls(raf, 1);
            // @ts-ignore unsetting requestAnimationFrame in deno
            delete globalThis.requestAnimationFrame;
        });
    });

    describe('cancelAnimationFrame', () => {
        it('should polyfill cancelAnimationFrame with clearTimeout', () => {
            const timeout = spy(globalThis, 'clearTimeout');
            game = new Game();
            game.cancelAnimationFrame(0);
            assertSpyCalls(timeout, 1);
            timeout.restore();
        });

        it('should use globalThis.cancelAnimationFrame if defined', () => {
            const caf = /** @type {Spy} */(spy());
            globalThis.cancelAnimationFrame = caf;
            game = new Game();
            game.cancelAnimationFrame(0);
            assertSpyCalls(caf, 1);
            // @ts-ignore unsetting cancelAnimationFrame in deno
            delete globalThis.cancelAnimationFrame;
        });
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
            assertThrows(() => {
                game.stages.add(new Stage(game, stage.id));
            }, `Stage with id ${stage.id} already exists`)
        });
    });

    describe('createStage', () => {
        /** @type {Stage} */
        let stage;

        beforeEach(() => {
            stage = game.createStage('stage');
        });

        it('should add stage to stages', () => {
            assert(game.stages.has(stage));
        });

        it('should error if another stage with the same name is added', () => {
            assertThrows(() => {
                game.createStage('stage');
            }, `Stage with id ${stage.id} already exists`)
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
            assertEquals(game.stages.delete(new Stage(game, 'stageB')), false);
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
            assertFalse(game.stages.has(stage));
        });

        it('should return false if stage is not present', () => {
            assertFalse(game.deleteStage('stage2'));
        });
    });

    describe('update', () => {
        /** @type {Stage} */
        let stageA;
        /** @type {Stage} */
        let stageB;

        /** @type {Spy} */
        let updateA;
        /** @type {Spy} */
        let updateB;

        beforeEach(() => {
            stageA   = new Stage(game, 'stageA' );
            stageB   = new Stage(game, 'stageB' );

            game.stages.add(stageA);
            game.stages.add(stageB);

            updateA = spy(stageA, 'update');
            updateB = spy(stageB, 'update');
        });

        it('should call update on all stages', () => {
            game.update(1);
            assertSpyCalls(updateA, 1);
            assertSpyCalls(updateB, 1);
        });
    });

    describe('render', () => {
        /** @type {Stage} */
        let stageA;
        /** @type {Stage} */
        let stageB;

        /** @type {Spy} */
        let renderA;
        /** @type {Spy} */
        let renderB;

        beforeEach(() => {
            stageA   = new Stage(game, 'stageA');
            stageB   = new Stage(game, 'stageB');

            game.stages.add(stageA);
            game.stages.add(stageB);

            renderA = spy(stageA, 'render');
            renderB = spy(stageB, 'render');
        });

        it('should call render on all stages', () => {
            game.render();
            assertSpyCalls(renderA, 1);
            assertSpyCalls(renderB, 1);
        });
    });

    describe('loadFile', () => {
        /**
         * @type {Spy}
         */
        let fetchSpy;

        beforeEach(async () => {
            fetchSpy = spy(globalThis, 'fetch');

            await game.loadFile(import.meta.resolve('./fixtures/a.revgam'));
        });

        afterEach(() => {
            fetchSpy.restore();
        });

        it('should create a stage for each stage in the file', () => {
            assertEquals(game.stages.size, 2);
        });

        it('should call loadFile on each stage', () => {
            assertSpyCalls(fetchSpy, 3);
        })

        it('should clear any existing stages', async () => {
            await game.loadFile(import.meta.resolve('./fixtures/b.revgam'));
            assertEquals(game.stages.size, 2);
            assert(game.getContext('c'));
            assert(game.getContext('d'));
        });
    });
});
