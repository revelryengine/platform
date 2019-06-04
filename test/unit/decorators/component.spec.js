import { component      } from '../../../lib/decorators/component.js';
import { EntityRegistry } from '../../../lib/entity-registry.js';

describe('component', () => {
  let model;

  beforeEach(() => {
    sinon.spy(EntityRegistry, 'registerComponentProperty');

    model = new (class TestModel {
      @component('footype') fooprop;
    })();
  });

  afterEach(() => {
    EntityRegistry.registerComponentProperty.restore();
  });

  it('should register the component property with the EntityRegistry', () => {
    expect(EntityRegistry.registerComponentProperty).to.have.been.calledWith(sinon.match({ name: model.constructor.name }), 'fooprop', 'footype');
  });
});
