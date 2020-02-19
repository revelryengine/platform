import { expect, sinon } from '../../support/chai.js';

import { GameNode } from '../../../lib/gom/game-node.js';

/** @test {GameNode} */
describe('GameNode', () => {
    let node, childA, childB, parentA, parentB, event;

    beforeEach(async () => {
        node = new GameNode('node');
        node.initialized = true;

        parentA = new GameNode('parentA');
        parentB = new GameNode('parentB');
        childA = new GameNode('childA');
        childB = new GameNode('childB');

        node.parent = parentA;
        parentA.parent = parentB;

        node.children.add(childA);
        node.children.add(childB);

        event = { eventPhase: 0, bubbles: true, path: [] };

        await new Promise(resolve => setTimeout(resolve));
    });

    /** @test {GameNode#active} */
    describe('active', () => {
        it('should return true if GameNode has been initialized', () => {
            expect(node.active).to.be.true;
        });

        it('should return false if GameNode has been disposed', () => {
            node.disposed = true;
            expect(node.active).to.be.false;
        });

        it('should return false if GameNode has been disabled', () => {
            node.disabled = true;
            expect(node.active).to.be.false;
        });
    });

    /** @test {GameNode#update} */
    describe('update', () => {
        beforeEach(() => {
            node.dispatchDeferredEvents = sinon.spy(node.dispatchDeferredEvents.bind(node));
            childA.update = sinon.spy(childA.update.bind(childA));
            childB.update = sinon.spy(childB.update.bind(childB));
        });

        it('should call dispatchDeferredEvents ', () => {
            node.update();
            expect(node.dispatchDeferredEvents).to.have.been.called;
        });

        it('should call update on all children', () => {
            node.update();
            expect(childA.update).to.have.been.called;
            expect(childB.update).to.have.been.called;
        });

        it('should not call update on inactive children', () => {
            childA.disabled = true;
            node.update();
            expect(childA.update).not.to.have.been.called;
        });
    });

    /** @test {GameNode#render} */
    describe('render', () => {
        beforeEach(() => {
            childA.render = sinon.spy(childA.render.bind(childA));
            childB.render = sinon.spy(childB.render.bind(childB));
        });

        it('should call render on all children', () => {
            node.render();
            expect(childA.render).to.have.been.called;
            expect(childB.render).to.have.been.called;
        });

        it('should not call render on inactive children', () => {
            childA.disabled = true;
            node.render();
            expect(childA.render).not.to.have.been.called;
        });
    });

    /** @test {GameNode#dispose} */
    describe('dispose', () => {
        beforeEach(() => {
            node.clearDeferredEvents = sinon.spy(node.dispatchDeferredEvents.bind(node));
            childA.dispose = sinon.spy(childA.dispose.bind(childA));
            childB.dispose = sinon.spy(childB.dispose.bind(childB));
        });

        it('should call clearDeferredEvents ', async () => {
            await node.dispose();
            expect(node.clearDeferredEvents).to.have.been.called;
        });

        it('should call dispose on all children', async () => {
            await node.dispose();
            expect(childA.dispose).to.have.been.called;
            expect(childB.dispose).to.have.been.called;
        });
    });

    /** @test {GameNode#dispatchEvent} */
    describe('dispatchEvent', () => {
        beforeEach(() => {
            sinon.spy(Object.getPrototypeOf(GameNode).prototype, 'dispatchEvent');
        });

        afterEach(() => {
            Object.getPrototypeOf(GameNode).prototype.dispatchEvent.restore();
        });

        it('Add parents to GameEvent.path and call super dispatchEvent', () => {
            node.dispatchEvent(event);
            expect(event.path[0]).to.equal(parentA);
            expect(event.path[1]).to.equal(parentB);
            expect(Object.getPrototypeOf(GameNode).prototype.dispatchEvent).to.have.been.called;
        });
    });
});
