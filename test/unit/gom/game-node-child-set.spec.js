import { expect, sinon } from '../../support/chai.js';

import { GameNodeChildSet     } from '../../../lib/gom/game-node-child-set.js';
import { GameNodeInitEvent    } from '../../../lib/events/game-node-init.js';
import { GameNodeDisposeEvent } from '../../../lib/events/game-node-dispose.js';
import { GameNode             } from '../../../lib/gom/game-node.js';

/** @test {GameNodeChildSet} */
describe('GameNodeChildSet', () => {
    let parent, childSet, childA, childB;
    beforeEach(() => {
        parent = new GameNode('parent');
        childSet = new GameNodeChildSet(parent, [new GameNode('childC')]);
        childA = new GameNode('childA');
        childB = new GameNode('childB');

        childA.dispatchEvent = sinon.spy(childA.dispatchEvent.bind(childA));
    });

    describe('constructor', () => {
        it('should add all items specified in iterabel argument', () => {
            expect([...childSet][0].id).to.equal('childC');
        });
    });

    /** @test {GameNode#add} */
    describe('add', () => {
        beforeEach(async () => {
            childA.init = sinon.spy(childA.init.bind(childA));

            childSet.add(childA);
            await Promise.resolve();
        });

        it('should add node to set', () => {
            expect(childSet.has(childA)).to.be.true;
        });

        it('should set parent reference on node', () => {
            expect(childA.parent).to.equal(parent);
        });

        it('should call init on node', () => {
            expect(childA.init).to.have.been.called;
        });

        it('should emit GameNodeInitEvent', () => {
            expect(childA.dispatchEvent).to.have.been.called;
            expect(childA.dispatchEvent.lastCall.args[0] instanceof GameNodeInitEvent).to.be.true;
        });
    });

    /** @test {GameNode#delete} */
    describe('delete', () => {
        beforeEach(async () => {
            childA.dispose = sinon.spy(childA.dispose.bind(childA));

            childSet.add(childA);
            childSet.delete(childA);
            await new Promise(resolve => setTimeout(resolve));
        });
        it('should remove node from set', () => {
            expect(childSet.has(childA)).to.be.false;
        });

        it('should unset parent reference on node', () => {
            expect(childA.parent).to.be.undefined;
        });

        it('should call dispose on node', () => {
            expect(childA.dispose).to.have.been.called;
        });

        it('should emit GameNodeDisposeEvent', async () => {
            expect(childA.dispatchEvent).to.have.been.called;
            expect(childA.dispatchEvent.lastCall.args[0] instanceof GameNodeDisposeEvent).to.be.true;
        });

        it('should return false if child was not part of parent', () => {
            expect(childSet.delete(new GameNode())).to.equal(false);
        });
    });

    /** @test {GameNode#getById} */
    describe('getById', () => {
        beforeEach(() => {
            childSet.add(childA);
            childSet.add(childB);
        });

        it('should return child by id', () => {
            expect(childSet.getById('childA')).to.equal(childA);
        });
    });
});
