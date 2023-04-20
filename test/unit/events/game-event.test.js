import { describe, it, beforeEach } from 'std/testing/bdd.ts';
import { spy, assertSpyCalls      } from 'std/testing/mock.ts';

import { GameEvent       } from '../../../lib/events/game-event.js';
import { GameEventTarget } from '../../../lib/events/game-event-target.js';

/** @typedef {import('std/testing/mock.ts').Spy} Spy */

describe('GameEvent', () => {
    let /** @type {Spy} */handler, /** @type {GameEventTarget}*/target1, /** @type {GameEventTarget}*/target2, /** @type {GameEvent}*/event;

    beforeEach(() => {
        handler = spy();
        target1 = new GameEventTarget();
        target2 = new GameEventTarget();
    });

    describe('stopPropagation', () => {
        it('should not propagate event to second target', () => {
            event = new GameEvent('test');

            target1.addEventListener('test', () => { handler(); }, true);
            target2.addEventListener('test', (e) => { handler(); e.stopPropagation() }, true);
            target2.addEventListener('test', () => { handler(); }, true);

            event.path.push(target2);

            target1.dispatchEvent(event);
            assertSpyCalls(handler, 2);
        });
    });
    describe('stopImmediatePropagation', () => {
        it('should not call second listener on same target', () => {
            event = new GameEvent('test');

            target1.addEventListener('test', () => handler(), true);
            target2.addEventListener('test', (e) => { handler(); e.stopImmediatePropagation(); }, true);
            target2.addEventListener('test', () => handler(), true);

            event.path.push(target2);

            target1.dispatchEvent(event);
            assertSpyCalls(handler, 1);
        });
    });
});
