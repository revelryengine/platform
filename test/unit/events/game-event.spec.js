import { expect, sinon } from '../../support/chai.js';

import { GameEvent       } from '../../../lib/events/game-event.js';
import { GameEventTarget } from '../../../lib/events/game-event-target.js';

/** @test {GameEvent} */
describe('GameEvent', () => {
    let spy, target1, target2, event;

    beforeEach(() => {
        spy = sinon.spy();
        target1 = new GameEventTarget('target1');
        target2 = new GameEventTarget('target2');
    });

    describe('stopPropagation', () => {
        it('should not propagate event to second target', () => {
            event = new GameEvent('test');

            target1.addEventListener('test', () => { spy(); }, true);
            target2.addEventListener('test', (e) => { spy(); e.stopPropagation() }, true);
            target2.addEventListener('test', () => { spy(); }, true);

            event.path.push(target2);

            target1.dispatchEvent(event);
            expect(spy).to.have.been.calledTwice;
        });
    });
    describe('stopImmediatePropagation', () => {
        it('should not call second listener on same target', () => {
            event = new GameEvent('test');

            target1.addEventListener('test', () => spy(), true);
            target2.addEventListener('test', (e) => { spy(); e.stopImmediatePropagation(); }, true);
            target2.addEventListener('test', () => spy(), true);

            event.path.push(target2);

            target1.dispatchEvent(event);
            expect(spy).to.have.been.calledOnce;
        });
    })

});
