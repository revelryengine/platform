import { describe, it, beforeEach, afterEach } from 'https://deno.land/std@0.208.0/testing/bdd.ts';
import { spy, assertSpyCall, assertSpyCalls  } from 'https://deno.land/std@0.208.0/testing/mock.ts';
import { FakeTime                            } from 'https://deno.land/std@0.208.0/testing/time.ts';

import { assertEquals       } from 'https://deno.land/std@0.208.0/assert/assert_equals.ts';
import { assertThrows       } from 'https://deno.land/std@0.208.0/assert/assert_throws.ts';
import { assertStrictEquals } from 'https://deno.land/std@0.208.0/assert/assert_strict_equals.ts';

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
        /** @type {Stage} */
        let stage;
        /** @type {System} */
        let system;

        beforeEach(() => {
            stage   = new Stage();
            system = new System();
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

        /** @type {Spy} */
        let stageConnected;
        /** @type {Spy} */
        let systemConnected

        beforeEach(() => {
            stage  = new Stage();
            system = new System();

            stageConnected  = spy(stage, 'connectedCallback');
            systemConnected = spy(system, 'connectedCallback');

            stage.systems.add(system);
            game.stages.add(stage);
        });

        it('should assign game to stage', () => {
            assertStrictEquals(stage.game, game);
        });

        it('should assign stage to system', () => {
            assertStrictEquals(system.stage, stage);
        });

        it('should not error if stage already exists', () => {
            game.stages.add(stage);
        });

        it('should error if another stage with the same name is added', () => {
            assertThrows(() => {
                game.stages.add(new Stage({ id: stage.id }));
            }, `Stage with id ${stage.id} already exists`)
        });

        it('should call connectedCallback on stage', () => {
            assertSpyCalls(stageConnected, 1);
        });

        it('should call connectedCallback on system', () => {
            assertSpyCalls(systemConnected, 1);
        });

        it('should not call connectedCallback on system if stage is not connected', () => {
            const stage  = new Stage();
            const system = new System();
            const systemConnected = spy(system, 'connectedCallback');
            stage.systems.add(system);
            assertSpyCalls(systemConnected, 0);
        });

        it('should not call disconnectedCallback on system if stage is not connected', () => {
            const stage  = new Stage();
            const system = new System();
            const systemDisconnected = spy(system, 'disconnectedCallback');
            stage.systems.add(system);
            stage.systems.delete(system);
            assertSpyCalls(systemDisconnected, 0);
        });
    });

    describe('stages.delete', () => {
        /** @type {Stage} */
        let stage;
        /** @type {System} */
        let system;


        beforeEach(() => {
            stage  = new Stage();
            system = new System();

            stage.systems.add(system);

            game.stages.add(stage);
            game.stages.delete(stage);
        });

        it('should unassign game from stage', () => {
            assertStrictEquals(stage.game, null);
        });

        it('should unassign game from system', () => {
            assertStrictEquals(system.game, null);
        });

        it('should return false if stage is not present', () => {
            assertEquals(game.stages.delete(new Stage()), false);
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
            stageA   = new Stage({ id: 'stageA' });
            stageB   = new Stage({ id: 'stageB' });

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
            stageA   = new Stage({ id: 'stageA' });
            stageB   = new Stage({ id: 'stageB' });

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
});
