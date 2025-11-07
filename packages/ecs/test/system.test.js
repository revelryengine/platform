import { describe, it, expect, sinon, beforeEach } from 'bdd';

import { System, SystemSet } from '../lib/system.js';
import { Model  } from '../lib/model.js';
import { Game   } from '../lib/game.js';
import { Stage  } from '../lib/stage.js';

describe('System', () => {
    class ModelA extends Model.Typed({
        components: ['a']

    }) { }

    class ModelB extends Model.Typed({
        components: ['b']
    }) { }

    class SystemA extends System.Typed({
        id: 'SystemA',
        models: {
            modelA:  { model: ModelA, },
            modelBs: { model: ModelB, isSet: true },
        }
    }) { }

    /** @type {Game} */
    let game;

    /** @type {Stage} */
    let stage;

    /** @type {SystemA} */
    let system;


    beforeEach(() => {
        game   = new Game();
        stage  = new Stage(game, 'stage');
        system = new SystemA(stage);
    });

    describe('models', () => {
        describe('model sets', () => {
            it('should create a new set for models where isSet is true', () => {
                expect(system.models.modelBs).to.be.instanceOf(Set);
            });
        });
    });

    describe('default models', () => {
        it('should not error when not defining a subclass', () => {
            expect(new System(stage)).to.exist;
        })
    });

    describe('game', () => {
        it('should have reference to game', () => {
            expect(system.game).to.equal(game);
        })
    });

    describe('SystemSet', () => {
        /** @type {SystemSet} */
        let systems;

        /** @type {sinon.SinonSpy} */
        let addSpy;
        /** @type {sinon.SinonSpy} */
        let deleteSpy;

        /** @type {sinon.SinonSpy} */
        let registerSpy;
        /** @type {sinon.SinonSpy} */
        let unregisterSpy;

        beforeEach(() => {
            addSpy    = sinon.spy();
            deleteSpy = sinon.spy();

            registerSpy   = sinon.spy();
            unregisterSpy = sinon.spy();

            systems = new SystemSet({
                register:   registerSpy,
                unregister: unregisterSpy,
            });

            systems.watch('system:add', addSpy);
            systems.watch('system:delete', deleteSpy);
        });

        describe('add', () => {
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
                systems.add(systemC);
            });

            it('should not error if system already exists', () => {
                systems.add(systemC);
            });

            it('should error if another system with the same name is added', () => {
                expect(() => {
                    systems.add(new SystemC(stage));
                }).to.throw(`System with id ${systemC.id} already exists`)
            });

            it('should call register when system is added', () => {
                expect(registerSpy).to.have.been.calledWith(systemC);
            });

            it('should not call register if system already added ', () => {
                systems.add(systemC);
                expect(registerSpy).to.have.been.called;
            });

            it('should call system:add event', () => {
                expect(addSpy).to.have.been.calledWith({ system: systemC });
            });

            it('should not call system:add event if already present', () => {
                systems.add(systemC);
                expect(addSpy).to.have.been.called
            });
        });

        describe('delete', () => {
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
                systems.add(systemC);
            });

            it('should return true if system is present', () => {
                expect(systems.delete(systemC)).to.be.true;
            });

            it('should return false if system is not present', () => {
                expect(systems.delete(new SystemA(stage))).to.be.false;
            });

            it('should call unregister when system is deleted', () => {
                systems.delete(systemC);
                expect(unregisterSpy).to.have.been.calledWith(systemC);
            });

            it('should not call unregister when system is deleted if not present', () => {
                systems.delete(new SystemA(stage));
                expect(unregisterSpy).not.to.have.been.called;
            });

            it('should call system:delete event', () => {
                systems.delete(systemC);
                expect(deleteSpy).to.have.been.calledWith({ system: systemC });
            });

            it('should not call system:delete event if not present', () => {
                systems.delete(new SystemA(stage));
                expect(deleteSpy).not.to.have.been.called;
            });
        });
    });
});
