import { Stage       } from '../../lib/stage.js';
import { System      } from '../../lib/system.js';
import { EntityModel } from '../../lib/entity-model.js';
import { UUID        } from '../../lib/utils/uuid.js';
import { component   } from '../../lib/decorators/component.js';

/** @test {EntityRegistry} */
describe('EntityRegistry', () => {
  let stage, system, entityA, entityB;
  let componentA, componentB, componentC, componentD, componentE;

  class ModelA extends EntityModel {
    @component('foobar') foobar;
  }

  class ModelB extends EntityModel {
    @component('foobat') foobats = new Set();
  }

  beforeEach(async () => {
    entityA = new UUID();
    entityB = new UUID();

    componentA = { id: new UUID(), entity: entityA, type: 'foobar' };
    componentB = { id: new UUID(), entity: entityA, type: 'foobat' };

    componentC = { id: new UUID(), entity: entityB, type: 'foobar' };
    componentD = { id: new UUID(), entity: entityB, type: 'foobat' };
    componentE = { id: new UUID(), entity: entityB, type: 'foobat' };

    stage = new Stage('test-stage');

    system = new (class TestSystem extends System {
      @ModelA.model modelA;
      @ModelB.model modelBs = new Set();
    })('test-system');

    stage.systems.add(system);
    stage.components
      .add(componentA)
      .add(componentB)
      .add(componentC)
      .add(componentD)
      .add(componentE);

    await new Promise(resolve => setTimeout(resolve));
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
    expect(stage.entities.getById(entityA).models.getById(`ModelA:${entityA}`)).not.to.be.undefined;
    expect(stage.entities.getById(entityA).models.getById(`ModelB:${entityA}`)).not.to.be.undefined;
    expect(stage.entities.getById(entityB).models.getById(`ModelA:${entityB}`)).not.to.be.undefined;
    expect(stage.entities.getById(entityB).models.getById(`ModelB:${entityB}`)).not.to.be.undefined;
  });

  it('should have a reference for the first matched entity on the system property', () => {
    expect(system.modelA).not.to.be.undefined;
    expect(system.modelA.id).to.equal(`ModelA:${entityA}`);
  });

  it('should have a reference to each matched entity in system property Set', () => {
    expect(system.modelBs.size).to.equal(2);
    expect([...system.modelBs][0].id).to.equal(`ModelB:${entityA}`);
    expect([...system.modelBs][1].id).to.equal(`ModelB:${entityB}`);
  });

  it('should have a reference for the matched component on the model property', () => {
    expect(system.modelA.foobar).not.to.be.undefined;
    expect(system.modelA.foobar.id.toString()).to.equal(componentA.id.toString());
  });

  it('should have a reference for each matched component on the model property Set', () => {
    expect([...system.modelBs][0].foobats.size).to.equal(1);
    expect([...system.modelBs][1].foobats.size).to.equal(2);
    expect([...[...system.modelBs][0].foobats][0].id.toString()).to.equal(componentB.id.toString());
    expect([...[...system.modelBs][1].foobats][0].id.toString()).to.equal(componentD.id.toString());
    expect([...[...system.modelBs][1].foobats][1].id.toString()).to.equal(componentE.id.toString());
  });

  describe('Component deletion', () => {
    let modelA, modelB;

    beforeEach(async () => {
      ({ modelA } = system);
      ([modelB] = [...system.modelBs]);

      stage.components.delete(componentA);
      stage.components.delete(componentB);
      stage.components.delete(componentC);
      stage.components.delete(componentD);
      stage.components.delete(componentE);

      await Promise.resolve();
    });

    it('should not have a reference for a matched entity on the system property', () => {
      expect(system.modelA).to.be.undefined;
    });

    it('should not have a reference to any matched entities in system property Set', () => {
      expect(system.modelBs.size).to.equal(0);
    });

    it('should not have a reference for a matched component on the model property', () => {
      expect(modelA.foobar).to.be.undefined;
    });

    it('should not have a reference for any matched components on the model property Set', () => {
      expect(modelB.foobats.size).to.equal(0);
    });
  });
});
