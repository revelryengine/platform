import { describe, it, beforeEach, afterEach } from 'https://deno.land/std@0.180.0/testing/bdd.ts';
import { assertEquals                        } from 'https://deno.land/std@0.180.0/testing/asserts.ts';
import { spy, assertSpyCall, assertSpyCalls  } from 'https://deno.land/std@0.180.0/testing/mock.ts';
import { FakeTime                            } from 'https://deno.land/std@0.180.0/testing/time.ts';

import 'https://esm.sh/raf/polyfill';
import { Game } from '../../lib/game.js';
import { Stage  } from '../../lib/stage.js';
import { System } from '../../lib/system.js';

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
            time.next();
        });

        it('should loop repeatedly', async () => {
            await time.nextAsync();
            await time.nextAsync();
            assertSpyCalls(loop, 3);
        });
    });

    describe('pause', () => {
        beforeEach(() => {
            game.start();
            time.next();
        });

        it('should cancel requestAnimationFrame and loop should not be called', async () => {
            await time.nextAsync();
            await time.nextAsync();
            game.pause();
            await time.nextAsync();
            assertSpyCalls(loop, 3);
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
});
