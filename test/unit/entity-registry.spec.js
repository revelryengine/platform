import { expect } from '../support/chai.js';

import '../support/crypto.js';

import { Stage       } from '../../lib/stage.js';
import { System      } from '../../lib/system.js';
import { EntityModel } from '../../lib/entity-model.js';
import { UUID        } from '../../lib/utils/uuid.js';

/** @test {EntityRegistry} */
describe('EntityRegistry', () => {
    let stage, systemA, entityA, entityB;
    let componentA, componentB, componentC, componentD, componentE;

    class ModelA extends EntityModel {
        static get components() {
            return { foobar: { type: 'foobar' } };
        }
    }

    class ModelB extends EntityModel {
        static get components() {
            return { foobats: { type: 'foobat', isSet: true } };
        }
    }

    class SystemA extends System {
        static get models() {
            return {
                modelA: { model: ModelA },
                modelBs: { model: ModelB, isSet: true }
            }
        }
    }

    beforeEach(() => {
        entityA = new UUID();
        entityB = new UUID();

        componentA = { id: new UUID(), entity: entityA, type: 'foobar', value: 'foobar' };
        componentB = { id: new UUID(), entity: entityA, type: 'foobat', value: 'foobat' };

        componentC = { id: new UUID(), entity: entityB, type: 'foobar', value: 'foobar' };
        componentD = { id: new UUID(), entity: entityB, type: 'foobat', value: 'foobat' };
        componentE = { id: new UUID(), entity: entityB, type: 'foobat', value: 'foobat' };

        stage = new Stage('stageA');

        systemA = new SystemA('systemA');

        stage.systems.add(systemA);

        stage.components.add(componentA);
        stage.components.add(componentB);
        stage.components.add(componentC);
        stage.components.add(componentD);
        stage.components.add(componentE);
    });

    it('should have a reference for each entity in system.entities', () => {
        expect(stage.entities.getById(entityA)).not.to.be.undefined;
        expect(stage.entities.getById(entityB)).not.to.be.undefined;
    });

    it('should have a reference for each component in each entity', () => {
        expect(stage.entities.getById(entityA).components.getById(componentA.id)).not.to.be.undefined;
        expect(stage.entities.getById(entityA).components.getById(componentB.id)).not.to.be.undefined;
        expect(stage.entities.getById(entityB).components.getById(componentC.id)).not.to.be.undefined;
        expect(stage.entities.getById(entityB).components.getById(componentD.id)).not.to.be.undefined;
        expect(stage.entities.getById(entityB).components.getById(componentE.id)).not.to.be.undefined;
    });

    it('should have a reference for each model in each entity', () => {
        expect(stage.entities.getById(entityA).models.getById(`${systemA.id}:modelA:${entityA}`)).not.to.be.undefined;
        expect(stage.entities.getById(entityA).models.getById(`${systemA.id}:modelBs:${entityA}`)).not.to.be.undefined;
        expect(stage.entities.getById(entityB).models.getById(`${systemA.id}:modelA:${entityB}`)).not.to.be.undefined;
        expect(stage.entities.getById(entityB).models.getById(`${systemA.id}:modelBs:${entityB}`)).not.to.be.undefined;
    });

    it('should have a reference for the first matched entity on the system property', () => {
        expect(systemA.modelA).not.to.be.undefined;
        expect(systemA.modelA.id).to.equal(`${systemA.id}:modelA:${entityA}`);
    });

    it('should have a reference to each matched entity in system property Set', () => {
        expect(systemA.modelBs.size).to.equal(2);
        expect([...systemA.modelBs][0].id).to.equal(`${systemA.id}:modelBs:${entityA}`);
        expect([...systemA.modelBs][1].id).to.equal(`${systemA.id}:modelBs:${entityB}`);
    });

    it('should have a reference for the matched component on the model property', () => {
        expect(systemA.modelA.foobar).not.to.be.undefined;
        expect(systemA.modelA.foobar.id.toString()).to.equal(componentA.id.toString());
    });

    it('should have a reference for each matched component on the model property Set', () => {
        expect([...systemA.modelBs][0].foobats.size).to.equal(1);
        expect([...systemA.modelBs][1].foobats.size).to.equal(2);
        expect([...[...systemA.modelBs][0].foobats][0].id.toString()).to.equal(componentB.id.toString());
        expect([...[...systemA.modelBs][1].foobats][0].id.toString()).to.equal(componentD.id.toString());
        expect([...[...systemA.modelBs][1].foobats][1].id.toString()).to.equal(componentE.id.toString());
    });

    it('should use the same proxy if the same component is registered more than once', () => {
        const original = systemA.modelA.foobar;
        stage.components.add(componentA);
        expect(systemA.modelA.foobar).to.equal(original);
    });

    it('should use the extend the proxy if the same component is registered more than once', () => {
        stage.components.add({ ...componentA, test: 'test' });
        expect(systemA.modelA.foobar.test).to.equal('test');
    });

    describe('Component deletion', () => {
        let modelA, modelB;

        beforeEach(() => {
            ({ modelA } = systemA);
            ([modelB] = [...systemA.modelBs]);

            stage.components.delete(componentA);
            stage.components.delete(componentB);
            stage.components.delete(componentC);
            stage.components.delete(componentD);
            stage.components.delete(componentE);
        });

        it('should not have a reference for a matched entity on the system property', () => {
            expect(systemA.modelA).to.be.undefined;
        });

        it('should not have a reference to any matched entities in system property Set', () => {
            expect(systemA.modelBs.size).to.equal(0);
        });

        it('should not have a reference for a matched component on the model property', () => {
            expect(modelA.foobar).to.be.undefined;
        });

        it('should not have a reference for any matched components on the model property Set', () => {
            expect(modelB.foobats.size).to.equal(0);
        });

        it('should not throw if component is not present', () => {
            try {
                stage.components.delete({ id: 'test' });
                expect(true).to.be.true;
            } catch(e) {
                console.log(e);
                expect(false).to.be.true;
            }
        })
    });

    describe('System deletion', () => {
        beforeEach(() => {
            stage.components.delete(componentA);
            stage.systems.delete(systemA);
            stage.components.add(componentA)
        });

        it('should remove the system from the entityRegistry', () => {
            expect(systemA.modelA).to.be.undefined;
        });
    });

    describe('events', () => {
        let event;

        beforeEach(() => {
            event = undefined;
        });

        it('should fire ComponentAddEvent when a component is added', () => {
            stage.addEventListener('componentadd', (e) => event = e);
            stage.components.add({ id: new UUID(), entity: entityA, type: 'foobar' })
            expect(event).not.to.be.undefined;
        });

        it('should fire ComponentChangeEvent when a component property changes', () => {
            stage.addEventListener('componentchange', (e) => event = e);
            systemA.modelA.foobar.value = 'test';
            expect(event).not.to.be.undefined;
            expect(event.propertyPath[0]).to.equal('value');
            expect(event.newValue).to.equal('test');
            expect(event.oldValue).to.equal('foobar');
        });

        it('should fire ComponentDeleteEvent when a component is deleted', () => {
            stage.addEventListener('componentdelete', (e) => event = e);
            stage.components.delete(componentA)
            expect(event).not.to.be.undefined;
        });


        it('should fire ModelAddEvent when all the components for that model are added', () => {
            stage.addEventListener('modeladd', (e) => event = e);
            stage.components.add({ id: new UUID(), entity: new UUID(), type: 'foobar' })
            expect(event).not.to.be.undefined;
            expect(event.model).not.to.be.undefined;
        });

        it('should fire ModelDeleteEvent when all the components for that model are deleted', () => {
            const component = { id: new UUID(), entity: new UUID(), type: 'foobar' };
            stage.addEventListener('modeldelete', (e) => event = e);
            stage.components.add(component);
            stage.components.delete(component);
            expect(event).not.to.be.undefined;
            expect(event.model).not.to.be.undefined;
        });

        it('should fire SystemAddEvent when a system is added', () => {
            const system = new System('new-system');
            stage.addEventListener('systemadd', (e) => event = e);
            stage.systems.add(system);
            expect(event).not.to.be.undefined;
            expect(event.system).to.equal(system);
        });

        it('should fire SystemDeleteEvent when a system is deleted', () => {
            const system = new System('new-system');
            stage.addEventListener('systemdelete', (e) => event = e);
            stage.systems.add(system);
            stage.systems.delete(system);
            expect(event).not.to.be.undefined;
            expect(event.system).to.equal(system);
        });
    });

    describe('registerSystem', () => {
        let systemB;

        class SystemB extends System {
            static get models() {
                return {
                    modelA: { model: ModelA }
                }
            }
        }
        beforeEach(() => {
            systemB = new SystemB();
            stage.systems.add(systemB);
        });

        it('should add existing components to new system', () => {
            expect(systemB.modelA).not.to.be.undefined;
        });
    });
});
