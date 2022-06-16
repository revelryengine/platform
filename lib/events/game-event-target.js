import { GameEvent } from './game-event.js';

/**
 * GameEventTarget is like a typical DOM EventTarget except it has added functionality for queuing events.
 * This is useful for deferring events until the next frame in the game loop.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget
 */
export class GameEventTarget {
    /**
     * @type {Set}
     * @desc Deferred events to be emitted on the next dispatchDeferred call.
     */
    #deferredEvents = new Set();

    /**
     * @type {Map}
     * @desc All bubble phase listeners mapped by type
     */
    #eventBubbleListeners = new Map();

    /**
     * @type {Map}
     * @desc All capture phase listeners mapped by type
     */
    #eventCaptureListeners = new Map();

    constructor(id) {
        this.id = id;
    }

    /**
     * Adds the specified function to the list of event listeners for the specified event type on
     * the {@link GameEventTarget} on which it is called.
     *
     * @todo add stop propagation functionality
     *
     * @param {String} type A string representing the event type to listen for.
     * @param {Function} listener The Function to call when event type is dispatched.
     * @param {Object|Boolean} [options=false] An options object that specifies characteristics about the event listener.
     * If a Boolean is provided and is true it will be treated as if the options.capture Boolean was set to true.
     * @param {Boolean} [options.capture=false] A Boolean indicating that events of this type will be dispatched to the
     * registered listener before being dispatched to any GameEventTarget beneath it in the GameNode tree.
     * @param {Boolean|Promise} [options.once=false] If a Boolean is provided and is true the listener would be
     * automatically removed when invoked. If a promise is provided the listener will be removed as soon as the promise resolves.
     *
     */
    addEventListener(type, listener, options = {}) {
        const capture = (options === true || options.capture);

        const listeners = capture ? this.#eventCaptureListeners : this.#eventBubbleListeners;
        const stack = listeners.get(type) || listeners.set(type, new Set()).get(type);

        stack.add(listener);

        if (options.once) {
            if (options.once instanceof Promise) {
                options.once.then(() => {
                    stack.delete(listener);
                });
            } else {
                stack.add(function remover() {
                    stack.delete(listener);
                    stack.delete(remover);
                });
            }
        }
    }

    /**
     * Removes from the GameEventTarget an event listener previously registered with {@link GameEventTarget.addEventListener}.
     *
     * @param {String} type A string representing the event type for which to remove an event.
     * @param {Function} listener The Function of the event handler to remove from the event target.
     * @param {Object|Boolean} [options=false] An options object that specifies characteristics about the event listener.
     * If a Boolean is provided and is true it will be treated as if the options.capture Boolean was set to true.
     * @param {Boolean} [options.capture=false] A Boolean indicating that events of this type will be dispatched to the
     * registered listener before being dispatched to any GameEventTarget beneath it in the GameNode tree.
     */
    removeEventListener(type, listener, options = {}) {
        const capture = (options === true || options.capture);

        const listeners = capture ? this.#eventCaptureListeners : this.#eventBubbleListeners;
        const stack = listeners.get(type);
        if (stack) {
            stack.delete(listener);
            if (stack.size === 0) {
                this.#eventBubbleListeners.delete(type);
            }
        }
    }

    /**
     * Handles an Event at the specified {@link GameEventTarget}, invoking the affected event listeners in the appropriate order.
     *
     * @param {GameEvent} event The GameEvent to be dispatched.
     */
    handleEvent(event) {
        if(event.propagationStopped) return;

        const stacks = [];
        event.currentTarget = this;
        switch (event.eventPhase) {
            case GameEvent.NONE:
                event.target = this;

                if (event.bubbles) {
                    event.eventPhase = GameEvent.CAPTURING_PHASE;
                    for (let i = event.path.length - 1; i >= 0; i -= 1) {
                        event.path[i].handleEvent(event);
                    }
                }

                event.eventPhase = GameEvent.AT_TARGET;
                this.handleEvent(event);

                if (event.bubbles) {
                    event.eventPhase = GameEvent.BUBBLING_PHASE;
                    for (let i = 0; i < event.path.length; i += 1) {
                        event.path[i].handleEvent(event);
                    }
                }

                break;
            case GameEvent.CAPTURING_PHASE:
                stacks.push(this.#eventCaptureListeners.get(event.type) || null);
                break;
            case GameEvent.AT_TARGET:
                stacks.push(this.#eventCaptureListeners.get(event.type) || null);
                stacks.push(this.#eventBubbleListeners.get(event.type) || null);
                break;
            case GameEvent.BUBBLING_PHASE:
                stacks.push(this.#eventBubbleListeners.get(event.type) || null);
                break;
        }

        for (const stack of stacks) {
            if (stack !== null) {
                for (const listener of stack) {
                    try {
                        listener.call(this, event);
                        if(event.immediatePropagationStopped) return;
                    } catch (e) {
                        console.warn('Event Listener has thrown an error', e);
                    }
                }
            }
        }
    }

    /**
     * Composes GameEvent.path before calling handleEvent.
     *
     * @param {GameEvent} event The GameEvent to be dispatched.
     */
    dispatchEvent(event) {
        if (event.eventPhase === GameEvent.NONE && event.bubbles) {
            let node = this;
            while (node.parent) {
                event.path.push(node.parent);
                node = node.parent;
            }
        }
        return this.handleEvent(event);
    }

    /**
     * Removes all event listeners previously registered with {@link GameEventTarget.addEventListener}.
     */
    removeAllEventListeners() {
        this.#eventCaptureListeners.clear();
        this.#eventBubbleListeners.clear();
    }

    /**
     * Adds an event to the queue to be dispatched a later time. Calling {@link GameEventTarget.dispatchDeferredEvents}
     * will dispatch all deferred events.
     *
     * @param {GameEvent} event The GameEvent to be deferred.
     */
    deferEvent(event) {
        this.#deferredEvents.add(event);
    }

    /**
     * Dispatches all deferred events previously registered with {@link GameEventTarget.deferEvent}.
     */
    dispatchDeferredEvents() {
        for (const event of this.#deferredEvents) {
            this.handleEvent(event);
        }
        this.#deferredEvents.clear();
    }

    /**
     * Removes all deferred events previously registered with {@link GameEventTarget.deferEvent}. The events will not be
     * dispatched.
     */
    clearDeferredEvents() {
        this.#deferredEvents.clear();
    }

    /**
     * Returns a promise that resolves when the next event of the specified type is dispatched.
     *
     * @param {String} type Event type to listen for.
     * @returns {Promise} Promise that resolves on the next event dispatched of the specified type.
     */
    async awaitEvent(type) {
        return new Promise((resolve) => {
            this.addEventListener(type, e => resolve(e), { once: true });
        });
    }
}

export default GameEventTarget;
