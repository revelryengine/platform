import { expect, sinon } from '../../support/chai.js';

import { GameNodeChildSet     } from '../../../lib/gom/game-node-child-set.js';
import { GameNode             } from '../../../lib/gom/game-node.js';
import { Game                 } from '../../../lib/game.js';

/** @test {GameNodeChildSet} */
describe('GameNodeChildSet', () => {
    let parent, childSet, childA, childB;
    beforeEach(() => {
        parent = new GameNode('parent');
        childSet = new GameNodeChildSet(parent, [new GameNode('childC')]);
        childA = new GameNode('childA');
        childB = new GameNode('childB');
    });

    describe('constructor', () => {
        it('should add all items specified in iterable argument', () => {
            const childSet = new GameNodeChildSet(parent, [new GameNode('child')])
            expect([...childSet][0].id).to.equal('child');
        });
    });

    /** @test {GameNode#add} */
    describe('add', () => {
        beforeEach(() => {
            childA.connectedCallback = sinon.spy(childA.connectedCallback.bind(childA));
            childSet.add(childA);
        });

        it('should add node to set', () => {
            expect(childSet.has(childA)).to.be.true;
        });

        it('should set parent reference on node', () => {
            expect(childA.parent).to.equal(parent);
        });
    });

    /** @test {GameNode#delete} */
    describe('delete', () => {
        beforeEach(() => {
            childA.disconnectedCallback = sinon.spy(childA.disconnectedCallback.bind(childA));
            childSet.add(childA);
            childSet.delete(childA);
        });
        it('should remove node from set', () => {
            expect(childSet.has(childA)).to.be.false;
        });

        it('should unset parent reference on node', () => {
            expect(childA.parent).to.be.undefined;
        });

        it('should call disconnectedCallback on node when removed from game', () => {
            const game = new Game();
            game.children.add(childA);
            game.children.delete(childA);
            expect(childA.disconnectedCallback).to.have.been.called;
        });

        it('should not calll disconnectedCallback on node if not removed from game', () => {
            childSet.delete(childA);
            expect(childA.disconnectedCallback).not.to.have.been.called;
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

    describe('connectedCallback', () => {
        let game, childA, childB, childC;
        beforeEach(() => {
            game = new Game();
            childA = new GameNode('childA');
            childB = new GameNode('childB');
            childC = new GameNode('childC');
            childA.connectedCallback = sinon.spy(childA.connectedCallback.bind(childA));
            childB.connectedCallback = sinon.spy(childB.connectedCallback.bind(childB));
            childC.connectedCallback = sinon.spy(childC.connectedCallback.bind(childC));
            childA.children.add(childB);
            childB.children.add(childC);
        });

        it('should call connectedCallback on all children nodes when added to game', () => {
            game.children.add(childA);
            expect(childA.connectedCallback).to.have.been.called;
            expect(childB.connectedCallback).to.have.been.called;
            expect(childC.connectedCallback).to.have.been.called;
        });

        it('should not calll connectedCallback on node if not added to game', () => {
            expect(childA.connectedCallback).not.to.have.been.called;
            expect(childB.connectedCallback).not.to.have.been.called;
        });
    });

    describe('disconnectedCallback', () => {
        let game, childA, childB, childC;
        beforeEach(() => {
            game = new Game();
            childA = new GameNode('childA');
            childB = new GameNode('childB');
            childC = new GameNode('childC');
            childA.disconnectedCallback = sinon.spy(childA.disconnectedCallback.bind(childA));
            childB.disconnectedCallback = sinon.spy(childB.disconnectedCallback.bind(childB));
            childC.disconnectedCallback = sinon.spy(childC.disconnectedCallback.bind(childC));
            childA.children.add(childB);
            childB.children.add(childC);
        });

        it('should call disconnectedCallback on all children nodes when added to game', () => {
            game.children.add(childA);
            childA.children.delete(childB);
            expect(childB.disconnectedCallback).to.have.been.called;
            expect(childC.disconnectedCallback).to.have.been.called;
        });

        it('should not calll disconnectedCallback on node if not added to game', () => {
            childA.children.delete(childB);
            expect(childB.disconnectedCallback).not.to.have.been.called;
            expect(childC.disconnectedCallback).not.to.have.been.called;
        });
    });
});
