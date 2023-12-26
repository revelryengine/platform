import { describe, it, beforeEach, afterEach } from 'https://deno.land/std@0.208.0/testing/bdd.ts';
import { spy, assertSpyCall, assertSpyCalls  } from 'https://deno.land/std@0.208.0/testing/mock.ts';
import { FakeTime                            } from 'https://deno.land/std@0.208.0/testing/time.ts';

import { assertEquals } from 'https://deno.land/std@0.208.0/assert/assert_equals.ts';
import { assertThrows } from 'https://deno.land/std@0.208.0/assert/assert_throws.ts';

import { Game   } from '../lib/game.js';
import { Stage  } from '../lib/stage.js';
import { System } from '../lib/system.js';


/** @typedef {import('https://deno.land/std@0.208.0/testing/mock.ts').Spy} Spy */

describe('Game', () => {
    /** @type {Game} */
    let game;
    /** @type {Spy} */
    let command;
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

    describe('command', () => {
        beforeEach(() => {
            command = spy();
            game.extensions.set('command:test-command', command);
        });

        it('should call the defined function with a game reference followed by supplied arguments', () => {
            game.command('test-command', 0, 1, 2, 'test');
            assertSpyCall(command, 0, { args: [game, 0, 1, 2, 'test'] });
        });
    });

    describe('stages', () => {
        it('should be a reference to the game children', () => {
            assertEquals(game.stages, game.children);
        });
    });

    describe('getContext', () => {
        /** @type {Stage} */
        let stageA;
        /** @type {System} */
        let systemA;

        beforeEach(() => {
            stageA  = new Stage({ id: 'stageA' });
            systemA = new System({ id: 'systemA' });
            stageA.systems.add(systemA);

            game.stages.add(stageA);
        });

        it('should return the stage by id', () => {
            assertEquals(game.getContext('stageA'), stageA);
        });

        it('should return the system by stage:system id', () => {
            assertEquals(game.getContext('stageA:systemA'), systemA);
        });

        it('should throw if stage is not found', () => {
            assertThrows(() => {
                game.getContext('foo');
            }, 'Stage context not found');
        });

        it('should throw if system is not found', () => {
            assertThrows(() => {
                game.getContext('stageA:foo');
            }, 'System context not found');
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
    })
});
