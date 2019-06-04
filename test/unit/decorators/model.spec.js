import { model          } from '../../../lib/decorators/model.js';
import { EntityRegistry } from '../../../lib/entity-registry.js';

describe('model', () => {
  let system;

  beforeEach(() => {
    sinon.spy(EntityRegistry, 'registerModelProperty');

    system = new (class TestSystem {
      @model(class TestModel { }) fooprop;
    })();
  });

  afterEach(() => {
    EntityRegistry.registerModelProperty.restore();
  });

  it('should register the model property with the EntityRegistry', () => {
    expect(EntityRegistry.registerModelProperty).to.have.been.calledWith(sinon.match({ name: system.constructor.name }), 'fooprop', sinon.match({ name: 'TestModel' }));
  });
});
