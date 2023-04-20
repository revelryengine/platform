import { describe, it, beforeEach, afterEach } from 'std/testing/bdd.ts';
import { assertEquals                        } from 'std/testing/asserts.ts';
import { spy, assertSpyCall, assertSpyCalls  } from 'std/testing/mock.ts';
import { FakeTime                            } from 'std/testing/time.ts';

import { Game   } from '../../lib/game.js';
import { Stage  } from '../../lib/stage.js';
import { System } from '../../lib/system.js';

describe('Game', () => {
    let game, command, time;    

    beforeEach(() => {
        time = new FakeTime();
        game = new Game();

        spy(game, 'loop');
        spy(game, 'update');
        spy(game, 'render');
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
            assertSpyCalls(game.loop, 3);
        });
    });

    describe('pause', () => {
        beforeEach(() => {
            game.start();
        });

        it('should cancel requestAnimationFrame and loop should not be called', async () => {
            await time.tickAsync(game.targetFrameRate);
            await time.tickAsync(game.targetFrameRate);
            assertSpyCalls(game.loop, 2);
            game.pause();
            await time.tickAsync(game.targetFrameRate);
            assertSpyCalls(game.loop, 2);
        });
    });

    describe('loop', () => {
        it('should call game.update with a fixed timeloop of config.targetFrameRate', async () => {
            await game.loop(game.targetFrameRate * 2);
            assertSpyCalls(game.update, 2);
            assertSpyCall(game.update, 0, { args: [game.targetFrameRate ]});
        });

        it('should drop any frames after config.frameThreshold', async () => {
            await game.loop(game.frameThreshold * 2);
            assertSpyCalls(game.update, Math.floor(game.frameThreshold / game.targetFrameRate));
        });

        it('should call render exactly once', async () => {
            await game.loop(game.targetFrameRate * 2);
            assertSpyCalls(game.render, 1);
        });

        it('should not call render if an update has not occured', async () => {
            await game.loop(game.targetFrameRate / 2);
            assertSpyCalls(game.render, 0);
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
        let stageA, systemA;
        beforeEach(() => {
            stageA  = new Stage('stageA');
            systemA = new System('systemA');
            stageA.systems.add(systemA);

            game.stages.add(stageA);
        });

        it('should return the stage by id', () => {
            assertEquals(game.getContext('stageA'), stageA);
        });

        it('should return the system by stage:system id', () => {
            assertEquals(game.getContext('stageA:systemA'), systemA);
        });
    });

    describe('requestAnimationFrame', () => {
        it('should polyfill requestAnimationFrame with setTimeout', () => {
            spy(globalThis, 'setTimeout');
            game = new Game();
            game.requestAnimationFrame();
            assertSpyCalls(globalThis.setTimeout, 1);
            globalThis.setTimeout.restore();
        });

        it('should use globalThis.requestAnimationFrame if defined', () => {
            globalThis.requestAnimationFrame = spy();
            game = new Game();
            game.requestAnimationFrame();
            assertSpyCalls(globalThis.requestAnimationFrame, 1);
            delete globalThis.requestAnimationFrame;
        })
    });

    describe('cancelAnimationFrame', () => {
        it('should polyfill cancelAnimationFrame with clearTimeout', () => {
            spy(globalThis, 'clearTimeout');
            game = new Game();
            game.cancelAnimationFrame();
            assertSpyCalls(globalThis.clearTimeout, 1);
            globalThis.clearTimeout.restore();
        });

        it('should use globalThis.cancelAnimationFrame if defined', () => {
            globalThis.cancelAnimationFrame = spy();
            game = new Game();
            game.cancelAnimationFrame();
            assertSpyCalls(globalThis.cancelAnimationFrame, 1);
            delete globalThis.cancelAnimationFrame;
        })
    })
});
