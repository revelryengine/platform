import { GameNode   } from './gom/game-node.js';
import { extensions } from './extensions.js';

// import 'https://esm.sh/raf/polyfill';

/**
 * Main Game class for the Revelry Game Engine.
 *
 * A game instance is responsible for maintaining a collection
 * of all the stages and facilitating the main game loop.
 *
 */
export class Game extends GameNode {
    #raf = null;

    /**
     * Creates an instance of Game.
     * @param {Object} [config={}]
     * @param {Number} [config.targetFrameRate=1000/60] High resolution rate in milliseconds to perform updates.
     * @param {Number} [config.frameThreshold=3000/60] High resolution milliseconds before dropping frames.
     */
    constructor({ targetFrameRate = 1000 / 60, frameThreshold = 3000 / 60 } = {}) {
        super();

        /**
         * High resolution rate in milliseconds to perform updates.
         * @type {Number}
         */
        this.targetFrameRate = targetFrameRate;

        /**
         * High resolution milliseconds before dropping frames.
         * @type {Number}
         */
        this.frameThreshold = frameThreshold;

        /**
         * Timestamp of the last frame.
         * @type {Number}
         */
        this.lastTime = 0;

        /**
         * How much time has passed since last frame.
         * @type {Number}
         */
        this.frameDelta = 0;

        /**
         * How much time is left over from previous update.
         * @type {Number}
         */
        this.frameTime = 0;

        /**
         * Timestamp of when the game was last paused.
         * @type {Number}
         */
        this.pauseTime = 0;
    }

    /**
     * A {@link GameNodeChildSet} containing all of the game's {@link Stage}s.
     *
     * @type {GameNodeChildSet<Stage>}
     * @readonly
     */
    get stages() {
        return this.children;
    }

    /**
     * Main game loop.
     *
     * The game loop is a fixed timestep game loop. Each frame will calculate
     * the time since the last frame and determine how many steps to update
     * based on targetFrameRate. If at least one update step has been performed
     * than a single render step will be performed.
     *
     * In the event of a major hiccup and many update calls would be required to
     * catch up then the frameThreshold would be reached and any frames beyond the
     * threshold would be dropped. This is to prevent a cascade effect that prevents
     * the loop from catching up.
     *
     * The game loop will continously use requestAnimationFrame to call itself
     * unless game.pause() is called.
     *
     * @param {Number} hrTime high resolution timestamp.
     */
    async loop(hrTime) {
        this.frameDelta = hrTime - this.lastTime;
        this.frameTime += this.frameDelta;

        if (this.frameTime > this.frameThreshold) {
            this.frameTime = this.frameThreshold + (5 * 10e-15);
        }

        let updated = false;

        while (this.frameTime >= this.targetFrameRate) {
            updated = true;

            // This is async to allow for queueMicrotask to work effectively on component change watchers
            await this.update(this.targetFrameRate);
            this.frameTime -= this.targetFrameRate;
        }

        if (updated) this.render();

        this.lastTime = hrTime;

        this.#raf = requestAnimationFrame(hrt => this.loop(hrt));
    }


    /**
     * Starts the main game loop.
     *
     * If the game was previously paused then the game loop frameTime
     * calculation will be adjusted so that the deltaTime not count
     * the time that the game was paused.
     *
     */
    start() {
        this.lastTime = performance.now() - this.pauseTime;
        this.#raf = requestAnimationFrame(hrt => this.loop(hrt));
    }

    /**
     * Pauses the game loop.
     */
    pause() {
        this.pauseTime = performance.now();
        cancelAnimationFrame(this.#raf);
    }

    /**
     * Calls any method defined as a command extension.
     *
     * @example
     * // foobar-command.js
     * import extensions from '@revelryengine/core/lib/extensions.js'
     *
     * extensions.set('command:foobar', () => {
     *   console.log('foobar');
     * });
     *
     * // my-game.js
     * game.command('foobar'); //outputs foobar to console
     *
     * @param {String} name
     * @param {*} args
     * @returns {*}
     */
    async command(name, ...args) {
        const ext = this.extensions.get(`command:${name}`);
        return ext && ext(this, ...args);
    }

    /**
     * Shared property across all instances of a game.
     *
     * Allows other modules to extend functionality of the game instances automatically
     * without requiring developer to extend from a specific game sub class. An import of
     * the extension definition should be sufficient.
     *
     * See {@link Game#command} for an example.
     *
     * @type {extensions}
     */
    get extensions() {
        return extensions;
    }

    /**
     * Returns true for all Game instances
     */
    get isGame() { return true }


    /**
     * @param {String} contextName - The name of the context to fetch
     */
    getContext(contextName)  {
        if(contextName.includes(':')){
            const [stage, system] = contextName.split(':');
            return this.stages.getById(stage)?.getContext(system);
        }
        return this.stages.getById(contextName);
    }
}

export default Game;
