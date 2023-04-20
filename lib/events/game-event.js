/**
 * @typedef {Object} GameEventOptions
 * @property {Boolean} [bubbles=true] - A boolean to indicate whether the event bubbles
 */
/**
 * A GameEvent is similar to a tradition DOM Event but has additional properties to detect whether propagation should be stopped.
 */
export class GameEvent {
    /**
     * @param {String} type - The type of event
     * @param {GameEventOptions} [options] - The event options
     */
    constructor(type, options) {
        this.type          = type;
        this.target        = null;
        this.currentTarget = null;
        this.bubbles       = options?.bubbles ?? true;

        /**
         * @type {GameEvent.NONE|GameEvent.CAPTURING_PHASE|GameEvent.AT_TARGET|GameEvent.BUBBLING_PHASE}
         */
        this.eventPhase = GameEvent.NONE;

        /**
         * @type {Array<import('./game-event-target.js').GameEventTarget>}
         */
        this.path = this.path || [];
    }

    /**
     * Stops propagation to listeners bound to GameNodes further up the tree but event listeners bound to the target will still be fired.
     */
    stopPropagation() {
        this.propagationStopped = true;
    }

    /**
     * Stops propagation to event listeners bound to GameNodes further up the tree as well as prevents any further event listeners bound to the target from firing.
     */
    stopImmediatePropagation() {
        this.propagationStopped = true;
        this.immediatePropagationStopped = true;
    }
}

GameEvent.NONE            = /** @type {const} */ (0);
GameEvent.CAPTURING_PHASE = /** @type {const} */ (1);
GameEvent.AT_TARGET       = /** @type {const} */ (2);
GameEvent.BUBBLING_PHASE  = /** @type {const} */ (3);

export default GameEvent;
