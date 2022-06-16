import { describe, it, beforeEach } from 'https://deno.land/std@0.143.0/testing/bdd.ts';
import { spy, assertSpyCalls      } from 'https://deno.land/std@0.143.0/testing/mock.ts';

import { GameEvent       } from '../../../lib/events/game-event.js';
import { GameEventTarget } from '../../../lib/events/game-event-target.js';

describe('GameEvent', () => {
    let handler, target1, target2, event;

    beforeEach(() => {
        handler = spy();
        target1 = new GameEventTarget('target1');
        target2 = new GameEventTarget('target2');
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
    })

});
