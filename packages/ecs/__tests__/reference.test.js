import { describe, it, expect, sinon, beforeEach, afterEach } from 'bdd';

import { Game, Stage, Component, UUID } from '../ecs.js';

/**
 * @import { ComponentReference } from '../reference.js';
 */
describe('references', () => {
    /** @type {sinon.SinonFakeTimers} */
    let time;

    /** @type {sinon.SinonSpy} */
    let handler;

    /** @type {Game} */
    let game;

    /** @type {Stage} */
    let stage;

    /** @type {string} */
    let entityA;

    /** @type {string} */
    let entityB;

    /** @type {string} */
    let entityC;

    /** @type {ComponentReference<'a'>} */
    let refA;
    /** @type {ComponentReference<'b'>} */
    let refB;
    /** @type {ComponentReference<'c'>} */
    let refC;
    /** @type {ComponentReference<'d'>} */
    let refD;
    /** @type {ComponentReference<'a'>} */
    let refE;
    /** @type {ComponentReference<'b'>} */
    let refF;
    /** @type {ComponentReference<'c'>} */
    let refG;
    /** @type {ComponentReference<'d'>} */
    let refH;
    /** @type {ComponentReference<'e'>} */
    let refI;

    beforeEach(() => {
        time    = sinon.useFakeTimers();

        handler = sinon.spy();

        game  = new Game();
        stage = new Stage(game, 'stage');

        entityA = UUID();
        entityB = UUID();
        entityC = UUID();

        stage.components.add(new Component(stage, { entity: entityA, type: 'a', value: 'a' }));
        stage.components.add(new Component(stage, { entity: entityA, type: 'b', value: 123 }));
        stage.components.add(new Component(stage, { entity: entityA, type: 'c', value: true }));
        stage.components.add(new Component(stage, { entity: entityA, type: 'd', value: { a: 'a' } }));

        stage.components.add(new Component(stage, { entity: entityB, type: 'a', value: 'a' }));
        stage.components.add(new Component(stage, { entity: entityB, type: 'b', value: 123 }));
        stage.components.add(new Component(stage, { entity: entityB, type: 'c', value: true }));
        stage.components.add(new Component(stage, { entity: entityB, type: 'd', value: { a: 'a' } }));

        stage.components.add(new Component(stage, { entity: entityC, type: 'a', value: 'a' }))

        refA = stage.references.components.create({ entity: entityC, type: 'a' }, { entity: entityA, type: 'a' });
        refB = stage.references.components.create({ entity: entityC, type: 'a' }, { entity: entityA, type: 'b' });
        refC = stage.references.components.create({ entity: entityC, type: 'a' }, { entity: entityA, type: 'c' });
        refD = stage.references.components.create({ entity: entityC, type: 'a' }, { entity: entityA, type: 'd' });
        refE = stage.references.components.create({ entity: entityC, type: 'a' }, { entity: entityB, type: 'a' });
        refF = stage.references.components.create({ entity: entityC, type: 'a' }, { entity: entityB, type: 'b' });
        refG = stage.references.components.create({ entity: entityC, type: 'a' }, { entity: entityB, type: 'c' });
        refH = stage.references.components.create({ entity: entityC, type: 'a' }, { entity: entityB, type: 'd' });

        refI = stage.references.components.create({ entity: entityC, type: 'a' }, { entity: entityA, type: 'e' });
    });

    afterEach(() => {
        time.restore();

        refA.release();
        refB.release();
        refC.release();
        refD.release();
        refE.release();
        refF.release();
        refG.release();
        refH.release();
        refI.release();
    });

    it('should resolve to an existing component immediately', () => {
        expect(refA.component?.entity).to.equal(entityA);
        expect(refA.component?.type).to.equal('a');
    });

    it('should resolve to a non existing component async', async () => {
        const promise = refI.waitFor('resolve');
        stage.components.add(new Component(stage, { entity: entityA, type: 'e', value: { a: { b: 'b', c: 1 } } }));
        await time.nextAsync();
        const component = await promise;
        expect(component.entity).to.equal(entityA);
        expect(component.type).to.equal('e');
    });

    it('should notify destroy if component removed', async () => {
        refA.watch('destroy', handler);
        stage.components.delete({ entity: entityA, type: 'a' });
        await time.nextAsync();
        expect(handler).to.have.been.calledOnce;
    });

    it('should notify release if released', async () => {
        refA.watch('release', handler);
        refA.release();
        await time.nextAsync();
        expect(handler).to.have.been.calledOnce;
    });

    it('should remove reference from reference set when released', async () => {
        refA.release();
        expect([...stage.references.components.find(refA)].length).to.equal(0);
    });

    it('should have a reference to the referer', () => {
        expect(refA.referer).to.deep.equal({ entity: entityC, type: 'a' });
    });

    it('should have a reference to the entity', () => {
        expect(refA.entity).to.equal(entityA);
    });

    it('should have a reference to the type', () => {
        expect(refA.type).to.equal('a');
    });

    describe('get', () => {
        it('should resolve the component if it exists', async () => {
            expect(await refA.get()).to.equal(stage.components.find({ entity: entityA, type: 'a' }));
        });

        it('should resolve the component if it is added later', async () => {
            const promise = refI.get();

            stage.components.add(new Component(stage, { entity: entityA, type: 'e', value: { a: { b: 'b', c: 1 } } }));

            expect(await promise).to.equal(stage.components.find({ entity: entityA, type: 'e' }));
        });

        it('should reject if reference is released before resolving', async () => {
            const promise = refI.get();
            refI.release();
            await expect(promise).to.be.rejectedWith('aborted');
        });

        it('should reject if reference is destoryed before resolving', async () => {
            const promise = refI.get();
            refI.destroy();
            await expect(promise).to.be.rejectedWith('aborted');
        });

        it('should reject if reference is not in a state of pending', async () => {
            refI.release();
            await expect(refI.get()).to.be.rejectedWith('aborted');
        });
    });

    describe('state', () => {
        it('should return "released" if released', () => {
            refA.release();
            expect(refA.state).to.equal('released');
        });

        it('should return "destroyed" if component was removed', async () => {
            stage.components.delete({ entity: entityA, type: 'a' });
            await time.nextAsync();
            expect(refA.state).to.equal('destroyed');
        });

        it('should return "aborted" if ref was released before resolving', async () => {
            refI.release();
            await time.nextAsync();
            expect(refI.state).to.equal('aborted');
        });

        it('should return "resolved" if component has been resolved', async () => {
            expect(refA.state).to.equal('resolved');
            stage.components.add(new Component(stage, { entity: entityA, type: 'e', value: { a: { b: 'b', c: 1 } } }));
            await time.nextAsync();
            expect(refI.state).to.equal('resolved');
        });

        it('should return "pending" if component has not been resolved', async () => {
            await time.nextAsync();
            expect(refI.state).to.equal('pending');
        });
    });

    it('should release the reference if the referer is removed from the set of components', async () => {
        stage.components.delete({ entity: entityC, type: 'a' });

        await time.nextAsync();

        expect(refA.state).to.equal('released');
        expect(refB.state).to.equal('released');
        expect(refC.state).to.equal('released');
        expect(refD.state).to.equal('released');
        expect(refE.state).to.equal('released');
        expect(refF.state).to.equal('released');
        expect(refG.state).to.equal('released');
        expect(refH.state).to.equal('released');
        expect(refI.state).to.equal('aborted');

    })

    describe('find', () => {
        it('should iterate over all references of specified entity and type', () => {
            const refZ = stage.references.components.create({ entity: entityC, type: 'a' }, { entity: entityB, type: 'b' });

            expect([...stage.references.components.find({ entity: entityA, type: 'a' })]).to.deep.equal([refA]);
            expect([...stage.references.components.find({ entity: entityA, type: 'b' })]).to.deep.equal([refB]);
            expect([...stage.references.components.find({ entity: entityB, type: 'b' })]).to.deep.equal([refB, refZ]);
        });
        it('should iterate over all references of specified entity', () => {
            expect([...stage.references.components.find({ entity: entityA })]).to.deep.equal([refA, refB, refC, refD, refI]);
            expect([...stage.references.components.find({ entity: entityB })]).to.deep.equal([refE, refF, refG, refH]);
        });

        it('should not error when iterating over a non existent entity', () => {
            expect([...stage.references.components.find({ entity: 'z' })]).to.deep.equal([]);
        });

        it('should not error when iterating over a non existent type', () => {
            expect([...stage.references.components.find({ entity: 'a', type: 'e' })]).to.deep.equal([]);
        });

        describe('predicate', () => {
            it('should only return the references where the predicate is true', () => {
                const refZ = stage.references.components.create({ entity: UUID(), type: 'a' }, { entity: entityB, type: 'b' });

                expect([...stage.references.components.find({ entity: entityB, type: 'b', predicate: (c) => c.referer.entity !== entityC })]).to.deep.equal([refZ]);
                expect([...stage.references.components.find({ entity: entityA, predicate: (c) => c.type === 'a' })]).to.deep.equal([refA]);
                expect([...stage.references.components.find({ predicate: (c) => c.type === 'a' })]).to.deep.equal([refA, refE]);
            });
        });
    });

    describe('count', () => {
        it('should return the number of references created for that specific entity', () => {
            expect(stage.references.components.count({ entity: entityA })).to.equal(5);
            expect(stage.references.components.count({ entity: entityB })).to.equal(4);
            expect(stage.references.components.count({ entity: entityC })).to.equal(0);
        });

        it('should increment the number of references when creating a new reference', () => {
            expect(stage.references.components.count({ entity: entityA })).to.equal(5);
            stage.references.components.create({ entity: entityC, type: 'a' }, { entity: entityA, type: 'b' });
            expect(stage.references.components.count({ entity: entityA })).to.equal(6);
        });


        it('should decrement the number of references when releasing', async () => {
            expect(stage.references.components.count({ entity: entityA })).to.equal(5);
            refA.release();
            expect(stage.references.components.count({ entity: entityA })).to.equal(4);
        });

        it('should return the number of references created for that specific entity and component type', () => {
            stage.references.components.create({ entity: UUID(), type: 'a' }, { entity: entityB, type: 'b' });

            expect(stage.references.components.count({ entity: entityA, type: 'a' })).to.equal(1);
            expect(stage.references.components.count({ entity: entityB, type: 'a' })).to.equal(1);
            expect(stage.references.components.count({ entity: entityB, type: 'b' })).to.equal(2);

        });

        describe('predicate', () => {
            it('should only count the references where the predicate is true', () => {
                stage.references.components.create({ entity: UUID(), type: 'a' }, { entity: entityB, type: 'b' });

                expect(stage.references.components.count({ entity: entityB, type: 'b', predicate: (c) => c.referer.entity !== entityC })).to.equal(1);
                expect(stage.references.components.count({ entity: entityA, predicate: (c) => c.type === 'a' })).to.equal(1);
                expect(stage.references.components.count({ predicate: (c) => c.type === 'a' })).to.equal(2);
            });
        });
    });

    describe('has', () => {
        it('should return true if there are any references for the specified entity and type', () => {
            expect(stage.references.components.has({ entity: entityA, type: 'a' })).to.be.true;
        });

        it('should return false if there are not any references for the specified entity and type', () => {
            expect(stage.references.components.has({ entity: entityB, type: 'e' })).to.be.false;
        });

        it('should return true if there are any references for the specified entity', () => {
            expect(stage.components.has({ entity: entityA })).to.be.true;
        });

        it('should return false if there are not any references for the specified entity', () => {
            expect(stage.components.has({ entity: UUID() })).to.be.false;
        });

        describe('predicate', () => {
            it('should only return true if the predicate is true', () => {
                expect(stage.references.components.has({ entity: entityA, type: 'a', predicate: (c) => c.referer.entity === entityC })).to.be.true;
                expect(stage.references.components.has({ entity: entityA, type: 'a', predicate: (c) => c.referer.entity !== entityC })).to.be.false;

                expect(stage.references.components.has({ entity: entityB, predicate: (c) => c.type === 'a' })).to.be.true;
                expect(stage.references.components.has({ entity: entityB, predicate: (c) => c.type === 'e' })).to.be.false;

                expect(stage.references.components.has({ predicate: (c) => c.entity === entityA && c.type === 'e' })).to.be.true;
                expect(stage.references.components.has({ predicate: (c) => c.entity === entityB && c.type === 'e' })).to.be.false;
            });
        });
    });

    describe('events', () => {
        /** @type {{ entity: string, type: string }} */
        let referer;
        beforeEach(() => {
            handler = sinon.spy();
            referer = { entity: UUID(), type: 'a' };
        });

        it('should notify reference:add when a new reference is added', () => {
            stage.references.components.watch('reference:add', handler);
            const ref = stage.references.components.create(referer, { entity: entityC, type: 'c' });
            expect(handler).to.have.been.calledWith({ reference: ref, count: 10 });
        });

        it('should notify reference:add:${entity} when a new reference is added', () => {
            stage.references.components.watch(`reference:add:${entityC}`, handler);
            const ref = stage.references.components.create(referer, { entity: entityC, type: 'c' });
             expect(handler).to.have.been.calledWith({ reference: ref, count: 1 });
        });

        it('should notify reference:add:${entity}:${type} when a new reference is added', () => {
            stage.references.components.watch(`reference:add:${entityC}:c`, handler);
            const ref = stage.references.components.create(referer, { entity: entityC, type: 'c' });
             expect(handler).to.have.been.calledWith({ reference: ref, count: 1 });
        });


        it('should notify reference:release when reference is released', () => {
            stage.references.components.watch('reference:release', handler);
            refA.release();
            expect(handler).to.have.been.calledWith({ reference: refA, count: 8 });
        });

        it('should notify reference:release:${entity} when reference is released', () => {
            stage.references.components.watch(`reference:release:${entityA}`, handler);
            refA.release();
            expect(handler).to.have.been.calledWith({ reference: refA, count: 4 });
        });

        it('should notify reference:release:${entity}:${type} when reference is released', () => {
            stage.references.components.watch(`reference:release:${entityA}:a`, handler);
            refA.release();
             expect(handler).to.have.been.calledWith({  reference: refA, count: 0 });
        });
    });

    describe('[Symbol.iterator]', () => {
        it('should iterate over entire set of components', () => {
            expect([...stage.references.components]).to.deep.equal([refA, refB, refC, refD, refE, refF, refG, refH, refI]);
        });
    });
});
