import { describe, it, expect, sinon, beforeEach, afterEach } from 'bdd';

import { Game, Stage, UUID, registerLoader, unregisterLoader } from '../ecs.js';

const JSON_DATA_URI_A ='data:application/json;charset=utf-8;base64,eyAiYSI6ICJhIiB9';
const JSON_DATA_URI_B ='data:application/json;charset=utf-8;base64,eyAiYiI6ICJiIiB9';
const JSON_DATA_URI_C ='data:application/json;charset=utf-8;base64,eyAiYyI6ICJjIiB9';

/**
 * @import {AssetReference} from '../ecs.js'
 */

describe('assets', () => {
    /** @type {sinon.SinonFakeTimers} */
    let clock;

    /** @type {sinon.SinonSpy} */
    let handler;

    /** @type {sinon.SinonSpy} */
    let loaderA;

    /** @type {sinon.SinonSpy} */
    let loaderB;

    /** @type {sinon.SinonSpy} */
    let loaderC;

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

    /** @type {AssetReference} */
    let refA;
    /** @type {AssetReference} */
    let refB;
    /** @type {AssetReference} */
    let refC;

    /** @type {AssetReference} */
    let refD;
    /** @type {AssetReference} */
    let refE;
    /** @type {AssetReference} */
    let refF;

    /** @type {AssetReference} */
    let refG;
    /** @type {AssetReference} */
    let refH;
    /** @type {AssetReference} */
    let refI;

    beforeEach(() => {
        clock = sinon.useFakeTimers();
        handler = sinon.spy();

        loaderA = sinon.spy(({ uri, signal }) => fetch(uri, { signal }).then(res => res.json()));
        loaderB = sinon.spy(({ uri, signal }) => fetch(uri, { signal }).then(res => res.json()));
        loaderC = sinon.spy(({ uri, signal }) => fetch(uri, { signal }).then(res => res.json()));

        registerLoader('a', loaderA);
        registerLoader('b', loaderB);
        registerLoader('c', loaderC);

        game  = new Game();
        stage = new Stage(game, 'stage');

        entityA = UUID();
        entityB = UUID();
        entityC = UUID();

        stage.createComponent({ entity: entityA, type: 'a' });
        stage.createComponent({ entity: entityB, type: 'b' });
        stage.createComponent({ entity: entityC, type: 'c' });

        refA = stage.references.assets.create({ entity: entityA, type: 'a' }, { uri: JSON_DATA_URI_A, type: 'a' });
        refB = stage.references.assets.create({ entity: entityA, type: 'b' }, { uri: JSON_DATA_URI_B, type: 'b' });
        refC = stage.references.assets.create({ entity: entityA, type: 'c' }, { uri: JSON_DATA_URI_C, type: 'c' });

        refD = stage.references.assets.create({ entity: entityB, type: 'a' }, { uri: JSON_DATA_URI_A, type: 'a' });
        refE = stage.references.assets.create({ entity: entityB, type: 'b' }, { uri: JSON_DATA_URI_B, type: 'b' });
        refF = stage.references.assets.create({ entity: entityB, type: 'c' }, { uri: JSON_DATA_URI_C, type: 'c' });

        refG = stage.references.assets.create({ entity: entityC, type: 'a' }, { uri: JSON_DATA_URI_A, type: 'a' });
        refH = stage.references.assets.create({ entity: entityC, type: 'b' }, { uri: JSON_DATA_URI_B, type: 'b' });
        refI = stage.references.assets.create({ entity: entityC, type: 'c' }, { uri: JSON_DATA_URI_C, type: 'c' });

    });

    afterEach(() => {
        clock.restore();

        unregisterLoader('a');
        unregisterLoader('b');
        unregisterLoader('c');

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

    it('should call the loader exactly once for each active reference', () => {
        expect(loaderA).to.have.been.calledOnce;
        expect(loaderB).to.have.been.calledOnce;
        expect(loaderC).to.have.been.calledOnce;
    });

    it('should resolve each reference to the same data reference', async () => {
        await Promise.all([
            refA.waitFor('resolve'),
            refB.waitFor('resolve'),
            refC.waitFor('resolve'),
            refD.waitFor('resolve'),
            refE.waitFor('resolve'),
            refF.waitFor('resolve'),
            refG.waitFor('resolve'),
            refH.waitFor('resolve'),
            refI.waitFor('resolve'),
        ]);

        expect(refA.data).to.equal(refD.data);
        expect(refB.data).to.equal(refE.data);
        expect(refC.data).to.equal(refF.data);

        expect(refA.data).to.equal(refG.data);
        expect(refB.data).to.equal(refH.data);
        expect(refC.data).to.equal(refI.data);
    });

    it('should throw if asset loader is not registered', () => {
        expect(() => stage.references.assets.create({ entity: entityA, type: 'a' }, { uri: JSON_DATA_URI_A, type: 'z' })).to.throw('No asset loader registered for type z');
    });

    it('should not error when registering the same loader twice', () => {
        registerLoader('a', loaderA);
    });

    it('should notify release if referer removed', () => {
        refA.watch('release', handler);
        stage.components.delete({ entity: entityA, type: 'a' });
        expect(handler).to.have.been.calledOnce;
    });

    it('should notify release if released', () => {
        refA.watch('release', handler);
        refA.release();
        expect(handler).to.have.been.calledOnce;
    });

    it('should remove reference from reference set when released', () => {
        refA.release();
        refD.release();
        refG.release();
        expect([...stage.references.assets.find({ uri: JSON_DATA_URI_A, type: 'a' })].length).to.equal(0);
    });

    it('should have a reference to the referer', () => {
        expect(refA.referer).to.deep.equal({ entity: entityA, type: 'a' });
    });

    it('should have a reference to the uri', () => {
        expect(refA.uri).to.equal(JSON_DATA_URI_A);
    });

    it('should have a reference to the type', () => {
        expect(refA.type).to.equal('a');
    });

    describe('get', () => {
        it('should resolve the data if it exists', async () => {
            await refA.waitFor('resolve');
            expect(await refA.get()).to.deep.equal({ a: 'a' });
        });

        it('should resolve the data if is finished fetching later', async () => {
            expect(await refA.get()).to.deep.equal({ a: 'a' });
        });

        it('should reject if reference is released before resolving', async () => {
            const promise = refI.get();
            refI.release();
            await expect(promise).to.be.rejectedWith('aborted');
        });

        it('should reject if reference is not in a state of pending', async () => {
            refI.release();
            await expect(refI.get()).to.be.rejectedWith('AssetReference is in an unepxected state');
        });
    });

    describe('state', () => {
        it('should return "released" if released', async () => {
            await refA.waitFor('resolve');
            refA.release();
            expect(refA.state).to.equal('released');
        });

        it('should return "aborted" if ref was released before resolving', async () => {
            refI.release();
            expect(refI.state).to.equal('aborted');
        });

        it('should return "resolved" if data has been resolved', async () => {
            await refA.waitFor('resolve');
            expect(refA.state).to.equal('resolved');
        });

        it('should return "pending" if component has not been resolved', async () => {
            expect(refA.state).to.equal('pending');
        });
    });


    describe('find', () => {
        it('should iterate over all references of specified uri and type', () => {
            expect([...stage.references.assets.find({ uri: JSON_DATA_URI_A, type: 'a' })]).to.deep.equal([refA, refD, refG]);
            expect([...stage.references.assets.find({ uri: JSON_DATA_URI_B, type: 'b' })]).to.deep.equal([refB, refE, refH]);
            expect([...stage.references.assets.find({ uri: JSON_DATA_URI_C, type: 'c' })]).to.deep.equal([refC, refF, refI]);
        });

        it('should iterate over all references of specified type', () => {
            expect([...stage.references.assets.find({ type: 'a' })]).to.deep.equal([refA, refD, refG]);
            expect([...stage.references.assets.find({ type: 'b' })]).to.deep.equal([refB, refE, refH]);
            expect([...stage.references.assets.find({ type: 'c' })]).to.deep.equal([refC, refF, refI]);
        });

        it('should not error when iterating over a non existent type', () => {
            expect([...stage.references.assets.find({ type: 'z' })]).to.deep.equal([]);
        });

        it('should iterate over all references of specified uri', () => {
            expect([...stage.references.assets.find({ uri: JSON_DATA_URI_A })]).to.deep.equal([refA, refD, refG]);
            expect([...stage.references.assets.find({ uri: JSON_DATA_URI_B })]).to.deep.equal([refB, refE, refH]);
            expect([...stage.references.assets.find({ uri: JSON_DATA_URI_C })]).to.deep.equal([refC, refF, refI]);
        });

        it('should not error when iterating over a non existent uri', () => {
            expect([...stage.references.assets.find({ uri: 'some_uri' })]).to.deep.equal([]);
        });

        it('should not error when iterating over a non existent uri and type', () => {
            expect([...stage.references.assets.find({ uri: 'a', type: 'e' })]).to.deep.equal([]);
        });

        describe('predicate', () => {
            it('should only return the references where the predicate is true', () => {
                expect([...stage.references.assets.find({ uri: JSON_DATA_URI_A, type: 'a', predicate: (a) => a.referer.entity !== entityA })]).to.deep.equal([refD, refG]);
                expect([...stage.references.assets.find({ uri: JSON_DATA_URI_A, type: 'a', predicate: (a) => a.referer.entity !== entityA })]).to.deep.equal([refA, refG]);
                expect([...stage.references.assets.find({ predicate: (c) => c.type === 'a' })]).to.deep.equal([refA, refD, refG]);
            });
        });
    });

    describe('count', () => {
        it('should return the number of references created for that specific type', () => {
            expect(stage.references.assets.count({ type: 'a' })).to.equal(3);
            expect(stage.references.assets.count({ type: 'b' })).to.equal(3);
            expect(stage.references.assets.count({ type: 'c' })).to.equal(3);
        });

        it('should increment the number of references when creating a new reference', () => {
            expect(stage.references.assets.count({ type: 'a' })).to.equal(3);
            stage.references.assets.create({ entity: entityC, type: 'd' }, { uri: JSON_DATA_URI_A, type: 'a' });
            expect(stage.references.assets.count({ type: 'a' })).to.equal(4);
        });

        it('should decrement the number of references when releasing', async () => {
            expect(stage.references.assets.count({ type: 'a' })).to.equal(3);
            refA.release();
            expect(stage.references.assets.count({ type: 'a' })).to.equal(2);
        });

        it('should return the number of references created for that specific uri', () => {
            expect(stage.references.assets.count({ uri: JSON_DATA_URI_A })).to.equal(3);
            expect(stage.references.assets.count({ uri: JSON_DATA_URI_B })).to.equal(3);
            expect(stage.references.assets.count({ uri: JSON_DATA_URI_C })).to.equal(3);
        });

        it('should return the number of references created for that specific uri and type', () => {
            expect(stage.references.assets.count({ uri: JSON_DATA_URI_A, type: 'a' })).to.equal(3);
            expect(stage.references.assets.count({ uri: JSON_DATA_URI_B, type: 'b' })).to.equal(3);
            expect(stage.references.assets.count({ uri: JSON_DATA_URI_C, type: 'c' })).to.equal(3);

        });

        describe('predicate', () => {
            it('should only count the references where the predicate is true', () => {
                expect(stage.references.assets.count({ uri: JSON_DATA_URI_A, type: 'a', predicate: (c) => c.referer.entity !== entityC })).to.equal(2);
                expect(stage.references.assets.count({ type: 'a', predicate: (c) => c.referer.entity !== entityC })).to.equal(2);
                expect(stage.references.assets.count({ predicate: (c) => c.type === 'a' })).to.equal(3);
            });
        });
    });

    describe('has', () => {
        it('should return true if there are any references for the specified uri and type', () => {
            expect(stage.references.assets.has({ uri: JSON_DATA_URI_A, type: 'a' })).to.be.true;
        });

        it('should return false if there are not any references for the specified uri and type', () => {
            expect(stage.references.assets.has({ uri: JSON_DATA_URI_A, type: 'e' })).to.be.false;
        });

        it('should return true if there are any references for the specified type', () => {
            expect(stage.references.assets.has({ type: 'a' })).to.be.true;
        });

        it('should return false if there are not any references for the specified type', () => {
            expect(stage.references.assets.has({ type: 'e' })).to.be.false;
        });

        it('should return true if there are any references for the specified uri', () => {
            expect(stage.references.assets.has({ uri: JSON_DATA_URI_A })).to.be.true;
        });

        it('should return false if there are not any references for the specified uri', () => {
            expect(stage.references.assets.has({ uri: 'some_uri' })).to.be.false;
        });

        describe('predicate', () => {
            it('should only return true if the predicate is true', () => {
                expect(stage.references.assets.has({ uri: JSON_DATA_URI_A, type: 'a', predicate: (c) => c.referer.entity === entityC })).to.be.true;
                expect(stage.references.assets.has({ uri: JSON_DATA_URI_A, type: 'a', predicate: (c) => c.referer.entity === UUID() })).to.be.false;

                expect(stage.references.assets.has({ type: 'b', predicate: (c) => c.uri === JSON_DATA_URI_B })).to.be.true;
                expect(stage.references.assets.has({ type: 'b', predicate: (c) => c.uri === JSON_DATA_URI_A })).to.be.false;

                expect(stage.references.assets.has({ predicate: (c) => c.uri === JSON_DATA_URI_A && c.type === 'a' })).to.be.true;
                expect(stage.references.assets.has({ predicate: (c) => c.uri === JSON_DATA_URI_B && c.type === 'a' })).to.be.false;
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
            stage.references.assets.watch('reference:add', handler);
            const ref = stage.references.assets.create(referer, { uri: JSON_DATA_URI_C, type: 'c' });
            expect(handler).to.have.been.calledOnceWith({ reference: ref, referer, count: 10 });
        });

        it('should notify reference:add:${type} when a new reference is added', () => {
            stage.references.assets.watch(`reference:add:c`, handler);
            const ref = stage.references.assets.create(referer, { uri: JSON_DATA_URI_C, type: 'c' });
            expect(handler).to.have.been.calledOnceWith({ reference: ref, referer, count: 4 });
        });

        it('should notify reference:add:${type}:${uri} when a new reference is added', () => {
            stage.references.assets.watch(`reference:add:c:${JSON_DATA_URI_C}`, handler);
            const ref = stage.references.assets.create(referer, { uri: JSON_DATA_URI_C, type: 'c' });
            expect(handler).to.have.been.calledOnceWith({ reference: ref, referer, count: 4 });
        });


        it('should notify reference:release when reference is released', () => {
            stage.references.assets.watch('reference:release', handler);
            refA.release();
           expect(handler).to.have.been.calledOnceWith({ reference: refA, count: 8 });
        });

        it('should notify reference:release:${type} when reference is released', () => {
            stage.references.assets.watch(`reference:release:a`, handler);
            refA.release();
            expect(handler).to.have.been.calledOnceWith({ reference: refA, count: 2 });
        });

        it('should notify reference:release:${type}:${uri} when reference is released', () => {
            stage.references.assets.watch(`reference:release:a:${JSON_DATA_URI_A}`, handler);
            refA.release();
            expect(handler).to.have.been.calledOnceWith({ reference: refA, count: 2 });
        });
    });

    describe('[Symbol.iterator]', () => {
        it('should iterate over entire set of assets', () => {
            expect([...stage.references.assets]).to.deep.equal([refA, refB, refC, refD, refE, refF, refG, refH, refI]);
        });
    });
});
