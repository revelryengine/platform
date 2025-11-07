import { describe, it, expect, sinon, beforeEach, afterEach } from 'bdd';

import { Game, Stage, System, Model, UUID, componentSchemas, assetLoaders, unregisterSchema, unregisterLoader } from '../lib/ecs.js';

describe('Stage', () => {

    class ModelA extends Model.Typed({
        components: ['a']
    }) { }

    class ModelB extends Model.Typed({
        components: ['a', 'b']
    }) { }

    class ModelC extends Model.Typed({
        components: ['c', 'd']
    }) { }


    class SystemA extends System.Typed({
        id: 'systemA',
        models: {
            modelA:  { model: ModelA },
            modelB:  { model: ModelB },
            modelCs: { model: ModelC, isSet: true },
        }

    }) { }

    class SystemB extends System.Typed({
        id: 'systemB',
        models: {
            modelA:  { model: ModelA },
            modelB:  { model: ModelB },
        }
    }) { }

    /** @type {sinon.SinonFakeTimers} */
    let time;
    /** @type {Game} */
    let game;

    /** @type {Stage} */
    let stage;
    /** @type {SystemA} */
    let systemA;
    /** @type {SystemB} */
    let systemB;
    /** @type {string} */
    let entityA;
    /** @type {string} */
    let entityB;
    /** @type {sinon.SinonSpy} */
    let handler;

    beforeEach(() => {
        time  = sinon.useFakeTimers();
        game  = new Game();
        stage = new Stage(game, 'stage');

        // stage.initializers['d'] = () => new Foobar();

        entityA = UUID();
        entityB = UUID();

        systemA  = new SystemA(stage);
        systemB  = new SystemB(stage);

        stage.systems.add(systemA);
        stage.systems.add(systemB);

        stage.createComponent({ entity: entityA, type: 'a', value: 'a'  });
        stage.createComponent({ entity: entityA, type: 'b', value: 123  });
        stage.createComponent({ entity: entityA, type: 'c', value: true });
        stage.createComponent({ entity: entityA, type: 'd', value: { a: 'a' } });

        stage.createComponent({ entity: entityB, type: 'a', value: 'a'  });
        stage.createComponent({ entity: entityB, type: 'b', value: 123  });
        stage.createComponent({ entity: entityB, type: 'c', value: true });
        stage.createComponent({ entity: entityB, type: 'd', value: { a: 'a' } });
    });

    afterEach(() => {
        time.restore();
    });

    describe('createComponent', () => {
        it('should add a system property for each matched Model', () => {
            expect(Object.hasOwn(systemA.models, 'modelA')).to.be.true;
            expect(Object.hasOwn(systemA.models, 'modelB')).to.be.true;
            expect(Object.hasOwn(systemA.models, 'modelCs')).to.be.true;

            expect(Object.hasOwn(systemB.models, 'modelA')).to.be.true;
            expect(Object.hasOwn(systemB.models, 'modelB')).to.be.true;
        });

        it('should add a system property as as Set when isSet is true', () => {
            expect(systemA.models.modelCs).to.be.instanceOf(Set);
        });

        it('should add each entity to set when isSet is true', () => {
            expect(systemA.models.modelCs.size).to.equal(2);
            expect([...systemA.models.modelCs][0].entity).to.equal(entityA);
            expect([...systemA.models.modelCs][1].entity).to.equal(entityB);
        });

        it('should share component between models matching the same entity', () => {
            expect(systemA.models.modelA.components['a']).to.equal(systemA.models.modelB.components['a']);
        });

        it('should only create a single model across multiple systems', () => {
            expect(systemA.models.modelA).to.equal(systemB.models.modelA);
        });
    });

    describe('deleteComponent', () => {
        beforeEach(() => {

            stage.deleteComponent({ entity: entityA, type: 'b' });

            stage.deleteComponent({ entity: entityB, type: 'a' });
            stage.deleteComponent({ entity: entityB, type: 'b' });
            stage.deleteComponent({ entity: entityB, type: 'c' });
            stage.deleteComponent({ entity: entityB, type: 'd' });
        });

        it('should delete system property when model no longer matches', () => {
            expect(systemA.models.modelB).not.to.exist;
            expect(systemB.models.modelB).not.to.exist;
        });

        it('should remove entities from system property Set when model is removed', () => {
            expect(systemA.models.modelCs.size).to.equal(1);
        });

        it('should return false if component is not present', () => {
            expect(stage.deleteComponent({ entity: entityA, type: 'e' })).to.be.false;
        });

        it('should return false if entity is not present', () => {
            expect(stage.deleteComponent({ entity: UUID(), type: 'e' })).to.be.false;
        });
    });

    describe('stage events', () => {
        /** @type {string} */
        let entityC;
        /** @type {string} */
        let entityD;

        beforeEach(() => {
            entityC = UUID();
            entityD = UUID();
            handler = sinon.spy();
        });

        describe('system:add', () => {
            class SystemC extends System.Typed({
                id: 'SystemC',
                models: {
                    modelA: { model: ModelA }
                }
            }) { }

            /** @type {SystemC} */
            let systemC;

            beforeEach(() => {
                systemC = new SystemC(stage);
                stage.watch('system:add', handler);
                stage.systems.add(systemC);
            });

            it('should notify system:add when a new system is added', () => {
                expect(handler).to.have.been.calledWith({ system: systemC });
            });

        });

        describe('system:delete', () => {
            beforeEach(() => {
                stage.watch('system:delete', handler);
                stage.systems.delete(systemA);
            });

            it('should notify system:delete when a system is deleted', () => {
                expect(handler).to.have.been.calledWith({ system: systemA });
            });
        });

        describe('system:registered', () => {
            class SystemC extends System.Typed({
                id: 'SystemC',
                models: {
                    modelA: { model: ModelA }
                }
            }) { }

            /** @type {SystemC} */
            let systemC;

            beforeEach(() => {
                systemC = new SystemC(stage);
                stage.watch('system:registered', handler);
                stage.systems.add(systemC);
            });

            it('should notify system:registered when a new system is added', () => {
                expect(handler).to.have.been.calledWith({ system: systemC });
            });

        });

        describe('system:unregistered', () => {
            beforeEach(() => {
                stage.watch('system:unregistered', handler);
                stage.systems.delete(systemA);
            });

            it('should notify system:unregistered when a system is deleted', () => {
                expect(handler).to.have.been.calledWith({ system: systemA });
            });
        });

        it('should notify model:add when all the components for that model are registered', () => {
            systemA.watch('model:add', { handler: ({ model, key}) => handler(model.constructor, key) });

            stage.createComponent({ entity: entityC, type: 'a', value: 'a' });
            stage.createComponent({ entity: entityD, type: 'a', value: 'a' });
            stage.createComponent({ entity: entityD, type: 'b', value: 123 });

            expect(handler.getCall(0).args[0]).to.equal(ModelA);
            expect(handler.getCall(1).args[0]).to.equal(ModelA);
            expect(handler.getCall(2).args[0]).to.equal(ModelB);
        });

        it('should call onModelAdd when all the components for that model are registered', () => {
            systemA.onModelAdd = (/** @type {ModelA} */model, /** @type {string} */key) => handler(model.constructor, key);

            stage.createComponent({ entity: entityC, type: 'a', value: 'a' });
            stage.createComponent({ entity: entityD, type: 'a', value: 'a' });
            stage.createComponent({ entity: entityD, type: 'b', value: 123 });

            expect(handler.getCall(0).args[0]).to.equal(ModelA);
            expect(handler.getCall(1).args[0]).to.equal(ModelA);
            expect(handler.getCall(2).args[0]).to.equal(ModelB);
        });

        it('should notify model:delete when all the components for that model are unregistered', () => {
            systemA.watch('model:delete', { handler: ({ model, key}) => handler(model.constructor, key) });

            stage.components.delete({ entity: entityA, type: 'a' });

            expect(handler.getCall(0).args[0]).to.equal(ModelA);
            expect(handler.getCall(1).args[0]).to.equal(ModelB);
        });

        it('should call onModelDelete when all the components for that model are deleted if defined', () => {
            systemA.onModelDelete = (/** @type {ModelA} */model, /** @type {string} */key) => handler(model.constructor, key);

            stage.components.delete({ entity: entityA, type: 'a' });


            expect(handler.getCall(0).args[0]).to.equal(ModelA);
            expect(handler.getCall(1).args[0]).to.equal(ModelB);
        });
    });

    describe('createSystem', () => {
        class SystemC extends System.Typed({
            id: 'SystemC',
            models: {
                modelA: { model: ModelA }
            }
        }) { }

        /** @type {SystemC} */
        let systemC;

        beforeEach(() => {
            systemC = stage.createSystem(SystemC);
        });

        it('should add existing components to new system', () => {
            expect(systemC.models.modelA).to.exist;
        });
    });

    describe('deleteSystem', () => {
        beforeEach(() => {
            stage.deleteSystem(SystemA);
        });

        it('should no longer add models to system', () => {
            const size = systemA.models.modelCs.size;
            stage.createComponent({ entity: UUID(), type: 'c', value: true });
            expect(systemA.models.modelCs.size).to.equal(size);
        });

        it('should return false if System is not present', () => {
            expect(stage.deleteSystem(SystemA)).to.be.false;
        });
    });

    describe('createEntity', () => {
        beforeEach(() => {
            stage = new Stage(game, 'stage');
        })
        it('should create all the components specified sharing the same entity id', () => {
            stage.createEntity({ a: 'a', b: 123, c: true, d: { a: 'a' } });

            expect(stage.components.count()).to.equal(4);
            expect([...stage.components][0].entity).to.deep.equal([...stage.components][1].entity);
            expect([...stage.components][0].entity).to.deep.equal([...stage.components][2].entity);
            expect([...stage.components][0].entity).to.deep.equal([...stage.components][3].entity);
        });

        it('should generate and return a new entity id if not specified', () => {
            expect(UUID.isUUID(stage.createEntity({ a: 'a', b: 123, c: true, d: { a: 'a' } }))).to.be.true;
        });
    });

    describe('deleteEntity', () => {
        /**
         * @type {string}
         */
        let entity;

        beforeEach(() => {
            stage = new Stage(game, 'stage');
            entity = stage.createEntity({ a: 'a', b: 123, c: true, d: { a: 'a' } });
        })
        it('should delete all the components for the specified entity', () => {
            expect(stage.components.count()).to.equal(4);
            expect([...stage.components][0].entity).to.deep.equal([...stage.components][1].entity);
            expect([...stage.components][0].entity).to.deep.equal([...stage.components][2].entity);
            expect([...stage.components][0].entity).to.deep.equal([...stage.components][3].entity);

            stage.deleteEntity(entity);

            expect(stage.components.count()).to.equal(0);
        });

        it('should return the number of components deleted ', () => {
            expect(stage.deleteEntity(entity)).to.equal(4);
        });
    });

    describe('getEntityModel', () => {
        it('should return an existing model for a given entity', () => {
            expect(stage.getEntityModel(entityA, ModelA)).to.be.instanceOf(ModelA);
        });
    });


    describe('update', () => {
        /** @type {SystemA} */
        let systemA;
        /** @type {SystemB} */
        let systemB;

        /** @type {sinon.SinonSpy} */
        let updateA;
        /** @type {sinon.SinonSpy} */
        let updateB;

        beforeEach(() => {
            stage   = new Stage(game, 'stage');
            systemA = new SystemA(stage);
            systemB = new SystemB(stage);

            stage.systems.add(systemA);
            stage.systems.add(systemB);

            updateA = sinon.spy(systemA, 'update');
            updateB = sinon.spy(systemB, 'update');
        });

        it('should call update on all stages', () => {
            stage.update(1);
            sinon.assert.callCount(updateA, 1);
            sinon.assert.callCount(updateB, 1);
        });
    });

    describe('render', () => {
        /** @type {SystemA} */
        let systemA;
        /** @type {SystemB} */
        let systemB;

        /** @type {sinon.SinonSpy} */
        let renderA;
        /** @type {sinon.SinonSpy} */
        let renderB;

        beforeEach(() => {
            stage   = new Stage(game, 'stage');
            systemA = new SystemA(stage);
            systemB = new SystemB(stage);

            stage.systems.add(systemA);
            stage.systems.add(systemB);

            renderA = sinon.spy(systemA, 'render');
            renderB = sinon.spy(systemB, 'render');
        });

        it('should call render on all stages', () => {
            stage.render();
            sinon.assert.callCount(renderA, 1);
            sinon.assert.callCount(renderB, 1);
        });
    });

    describe('loadFile', () => {
        /**
         * @type {Stage}
         */
        let stageA;

        /**
         * @type {Stage}
         */
        let stageB;

        beforeEach(async () => {
            stageA = game.createStage('a');
            stageB = game.createStage('b');

            await stageA.loadFile(import.meta.resolve('./fixtures/a.revstg'));
            await stageB.loadFile(import.meta.resolve('./fixtures/b.revstg'));
        });

        afterEach(() => {
            unregisterSchema('a');
            unregisterSchema('b');
            unregisterSchema('c');
            unregisterSchema('d');
            unregisterSchema('f');
            unregisterLoader('f');
        });

        it('should add systems to each stage', () => {
            expect(stageA.getContext('system-a')).to.exist;
            expect(stageA.getContext('system-b')).to.exist;

            expect(stageB.getContext('system-c')).to.exist;
        });

        it('should registerSchemas from bundle', () => {
            expect(componentSchemas['a']).to.exist;
            expect(componentSchemas['b']).to.exist;
            expect(componentSchemas['c']).to.exist;
            expect(componentSchemas['d']).to.exist;
            expect(componentSchemas['f']).to.exist;
        });

        it('should registerLoaders from bundle', () => {
            expect(assetLoaders['f']).to.exist;
        });

        it('should call load if present in the bundle', () => {
            expect(stageB.getContext('system-c').loadCalled).to.be.true;
        });

        it('should support recursive loading', async () => {
            expect(stageB.getContext('system-b')).to.exist;
        });

        it('should throw DOMException on abort', async () => {
            const abortCtrl = new AbortController();

            let error;
            stageA.loadFile(import.meta.resolve('./fixtures/a.revstg'), abortCtrl.signal).catch(e => error = e);
            abortCtrl.abort();
            await time.nextAsync();
            expect(error).to.be.instanceOf(DOMException);
        });
    });
});
