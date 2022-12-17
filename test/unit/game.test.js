import { describe, it, beforeEach, afterEach } from 'https://deno.land/std@0.143.0/testing/bdd.ts';
import { assertEquals                        } from 'https://deno.land/std@0.143.0/testing/asserts.ts';
import { spy, assertSpyCall, assertSpyCalls  } from 'https://deno.land/std@0.143.0/testing/mock.ts';
import { FakeTime                            } from 'https://deno.land/std@0.143.0/testing/time.ts';

import 'https://esm.sh/raf/polyfill';
import { Game } from '../../lib/game.js';

describe('Game', () => {
    let game, command, loop, update, render, time;    

    beforeEach(() => {
        time   = new FakeTime();
        game   = new Game();
        loop   = spy(game, 'loop');
        update = spy(game, 'update');
        render = spy(game, 'render');
    });

    afterEach(() => {
        { //clear any leftover rafs
            game.pause();
            time.next();
        }
        
        time.restore();
    });

    describe('stages', () => {
        it('should be a reference to the game children', () => {
            assertEquals(game.stages, game.children);
        });
    });

    describe('start', () => {
        beforeEach(() => {
            game.start();
        });

        it('should loop repeatedly', () => {
            time.next();
            time.next();
            time.next();
            assertSpyCalls(loop, 3);
        });
    });

    describe('pause', () => {
        beforeEach(() => {
            game.start();
        });

        it('should cancel requestAnimationFrame and loop should not be called', () => {
            time.next();
            time.next();
            game.pause();
            time.next();
            assertSpyCalls(loop, 2);
        });
    });

    describe('loop', () => {
        it('should call game.update with a fixed timeloop of config.targetFrameRate', () => {
            game.loop(game.targetFrameRate * 2);
            assertSpyCalls(update, 2);
            assertSpyCall(update, 0, { args: [game.targetFrameRate ]});
        });

        it('should drop any frames after config.frameThreshold', () => {
            game.loop(game.frameThreshold * 2);
            assertSpyCalls(update, Math.floor(game.frameThreshold / game.targetFrameRate));
        });

        it('should call render exactly once', () => {
            game.loop(game.targetFrameRate * 2);
            assertSpyCalls(render, 1);
        });

        it('should not call render if an update has not occured', () => {
            game.loop(game.targetFrameRate / 2);
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
});
