/**
 * A GameEvent is similar to a tradition DOM Event but has additional properties to detect whether propagation should be stopped.
 */
export class GameEvent {
    constructor(type, { bubbles = true } = {}) {
        this.type = type;
        this.target = null;
        this.currentTarget = null;
        this.eventPhase = GameEvent.NONE;
        this.path = this.path || [];
        this.bubbles = bubbles;
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

GameEvent.NONE            = 0;
GameEvent.CAPTURING_PHASE = 1;
GameEvent.AT_TARGET       = 2;
GameEvent.BUBBLING_PHASE  = 3;

export default GameEvent;
