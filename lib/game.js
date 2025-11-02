import { Stage      } from './stage.js';
import { Watchable  } from './watchable.js';

/**
 * @import { SystemContexts, SystemContextKey, GameFile } from './ecs.d.ts';
 */

/**
 * @extends {Set<import('./stage.js').Stage>}
 */
class GameStageSet extends Set {
    #game;

    /**
     * @type {Map<string, import('./stage.js').Stage>}
     */
    #byId = new Map();

    /**
     * @param {Game} game
     */
    constructor(game) {
        super();
        this.#game = game;
    }

    /**
     * @param {import('./stage.js').Stage} stage
     * @override
     */
    add(stage) {
        if(this.has(stage)) return this;

        if(this.#byId.has(stage.id)) throw new Error(`Stage with id ${stage.id} already exists`);

        super.add(stage);

        this.#byId.set(stage.id, stage);
        this.#game.notify('stage:add', stage);

        return this;
    }

    /**
     * @param {import('./stage.js').Stage} stage
     * @override
     */
    delete(stage) {
        if(!this.has(stage)) return false;

        super.delete(stage);

        this.#byId.delete(stage.id);
        this.#game.notify('stage:delete', stage);

        return true;
    }

    /**
     * @param {string} id
     */
    getById(id) {
        return this.#byId.get(id);
    }
}

/**
 * Main Game class for the Revelry Game Engine.
 *
 * A game instance is responsible for maintaining a collection
 * of all the stages and facilitating the main game loop.
 *
 */
export class Game extends Watchable {
    #raf = 0;

    /**
     * Timestamp of the last frame.
     */
    #lastTime = 0;

    /**
     * How much time has passed since last frame.
     */
    #frameDelta = 0;

    /**
     * How much time is left over from previous update.
     */
    #frameTime = 0;

    /**
     * Timestamp of when the game was last paused.
     */
    #pauseTime = 0;

    /**
     * @readonly
     */
    stages = new GameStageSet(this);

    /**
     * Creates an instance of Game.
     * @param {{
     *  targetFrameRate?: number,
     *  frameThreshold?:  number,
     * }} [gameConfig]
     */
    constructor({ targetFrameRate = 1000 / 60, frameThreshold = 3000 / 60 } = {}) {
        super();

        /**
         * High resolution rate in milliseconds to perform updates.
         */
        this.targetFrameRate = targetFrameRate;

        /**
         * High resolution milliseconds before dropping frames.
         */
        this.frameThreshold = frameThreshold;
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
     * @param {number} hrTime high resolution timestamp.
     */
    async loop(hrTime) {
        this.#frameDelta = hrTime - this.#lastTime;
        this.#frameTime += this.#frameDelta;

        if (this.#frameTime > this.frameThreshold) {
            this.#frameTime = this.frameThreshold + (5 * 10e-15);
        }

        let updated = false;

        while (this.#frameTime >= this.targetFrameRate) {
            updated = true;

            this.update(this.targetFrameRate);
            this.#frameTime -= this.targetFrameRate;
            await null; // Run queued microtasks. This is to allow for batched component watchers to execute between update calls.
        }

        if (updated) this.render();

        this.#lastTime = hrTime;

        this.#raf = this.requestAnimationFrame(hrt => this.loop(hrt));
    }

    /**
     * @param {number} deltaTime
     */
    update(deltaTime) {
        for(const stage of this.stages) {
            stage.update(deltaTime);
        }
    }

    render() {
        for(const stage of this.stages) {
            stage.render();
        }
    }

    /**
     * @param {string} id
     */
    createStage(id) {
        const stage = new Stage(this, id);
        this.stages.add(stage);
        return stage;
    }

    /**
     * @param {string} id
     */
    deleteStage(id) {
        const stage = this.stages.getById(id);
        if(stage) {
            this.stages.delete(stage);
        }
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
        this.lastTime = performance.now() - this.#pauseTime;
        this.#raf = this.requestAnimationFrame(hrt => this.loop(hrt));
    }

    /**
     * Pauses the game loop.
     */
    pause() {
        this.pauseTime = performance.now();
        this.cancelAnimationFrame(this.#raf);
    }

    /**
     * @template {SystemContextKey} K
     * @overload
     * @param {`${string}:${K}`} contextName
     * @return {SystemContexts[K]}
     *
     * @overload
     * @param {`${string}`} contextName
     * @return {import('./stage.js').Stage}
     *
     * @param {string} contextName - The name of the context to fetch
     */
    getContext(contextName)  {
        if(contextName.includes(':')){
            const [stageId, ...systemId] = contextName.split(':');
            return this.stages.getById(stageId)?.getContext(systemId.join(':'));

        }
        const stage = this.stages.getById(contextName);
        if(!stage) throw new Error(`Stage with id "${contextName}" not found`);
        return stage;
    }

    /**
     * requestAnimationFrame polyfill modified from https://gist.github.com/paulirish/1579671
     */
    requestAnimationFrame = globalThis.requestAnimationFrame?.bind(globalThis) ?? (() => {
        let lastTime  = 0;
        return (callback) => {
            const currTime   = performance.now();
            const timeToCall = Math.max(0, 16 - (currTime - lastTime));
            const id = globalThis.setTimeout(() => callback(currTime + timeToCall), timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        }
    })();

    /** cancelAnimationFrame polyfill */
    cancelAnimationFrame = globalThis.cancelAnimationFrame?.bind(globalThis) ?? globalThis.clearTimeout.bind(globalThis);

    /**
     * Fetchs a game file and adds the stages to the game. It will also clear any existing stages.
     *
     * @param {URL|string} src
     * @param {AbortSignal} [signal]
     */
    async loadFile(src, signal) {
        this.stages.clear();

        const gameFileURL = import.meta.resolve(src.toString());
        const gameFile    = /** @type {GameFile} */(await fetch(gameFileURL, { signal }).then(res => res.json()));

        await Promise.all(Object.entries(gameFile.stages).map(([id, src]) => this.createStage(id).loadFile(import.meta.resolve(new URL(src, gameFileURL).toString()), signal)));

        return this;
    }


}
