import { expect, sinon } from '../support/chai.js';

import '../support/performance.js';
import '../support/raf.js';

import { Game } from '../../lib/game.js';

/** @test {Game} */
describe('Game', () => {
    let game, command;

    beforeEach(() => {
        game = new Game();
        game.loop = sinon.spy(game.loop.bind(game));
        game.update = sinon.spy(game.update.bind(game));
        game.render = sinon.spy(game.render.bind(game));
    });

    afterEach(() => {
        game.pause();
    });

    /** @test {Game#stages} */
    describe('stages', () => {
        it('should be a reference to the game children', () => {
            expect(game.stages).to.equal(game.children);
        });
    });

    /** @test {Game#start} */
    describe('start', () => {
        beforeEach(async () => {
            game.start();
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        it('should loop repeatedly with high resolution time (float)', () => {
            expect(game.loop.callCount).to.be.at.least(2);
            expect(game.loop).to.have.been.calledWith(sinon.match.number);
            expect(Number.isInteger(game.loop.lastCall.args[0])).to.be.false;
        });
    });

    /** @test {Game#pause} */
    describe('pause', () => {
        beforeEach(async () => {
            game.start();
            game.pause();
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        it('should cancel requestAnimationFrame and loop should not be called', () => {
            expect(game.loop).not.to.have.been.called;
        });
    });

    /** @test {Game#loop} */
    describe('loop', () => {
        it('should call game.update with a fixed timeloop of config.targetFrameRate', () => {
            game.loop(game.targetFrameRate * 2);
            expect(game.update.calledWith(game.targetFrameRate)).to.be.true;
            expect(game.update.callCount).to.equal(2);
        });

        it('should drop any frames after config.frameThreshold', () => {
            game.loop(game.frameThreshold * 2);
            expect(game.update.callCount).to.equal(Math.floor(game.frameThreshold / game.targetFrameRate));
        });

        it('should call render exactly once', () => {
            game.loop(game.targetFrameRate * 2);
            expect(game.render.callCount).to.equal(1);
        });

        it('should not call render if an update has not occured', () => {
            game.loop(game.targetFrameRate / 2);
            expect(game.render.callCount).to.equal(0);
        });
    });

    /** @test {Game#command} */
    describe('command', () => {
        beforeEach(() => {
            command = sinon.spy();
            game.extensions.set('command:test-command', command);
        });

        it('should call the defined function with a game reference followed by supplied arguments', () => {
            game.command('test-command', 0, 1, 2, 'test');
            expect(command.calledWith(game, 0, 1, 2, 'test')).to.be.true;
        });
    });
});
