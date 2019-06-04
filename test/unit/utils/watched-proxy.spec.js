import { WatchedProxy } from '../../../lib/utils/watched-proxy.js';
import { ObjectPath   } from '../../../lib/utils/object-path.js';

/** @test {WatchedProxy} */
describe('WatchedProxy', () => {
  let spy, symbol, target, proxy;

  beforeEach(() => {
    spy = sinon.spy();
    symbol = Symbol('test');
    target = { foo: 'bar', [symbol]: 'ignored', nested: { foo: 'bar' } };
    proxy = new WatchedProxy(target, spy);
  });

  it('should get property values from target', () => {
    expect(proxy.foo).to.equal('bar');
  });

  it('should set property values on target', () => {
    proxy.foo = 'changed';
    expect(target.foo).to.equal('changed');
  });

  it('should get nested property values from target', () => {
    expect(proxy.nested.foo).to.equal('bar');
  });

  it('should set nested property values on target', () => {
    proxy.nested.foo = 'changed';
    expect(target.nested.foo).to.equal('changed');
  });

  it('should call handler with component, ObjectPath, new value, and original value when property is changed', () => {
    proxy.foo = 'changed';
    expect(spy.calledWith(proxy, sinon.match.instanceOf(ObjectPath), 'changed', 'bar')).to.be.true;
  });

  it('should not call handler if set to the same value', () => {
    proxy.foo = 'bar';
    expect(spy).not.to.have.been.called;
  });

  it('should call handler with component, ObjectPath, undefined, and original value when property is deleted', () => {
    delete proxy.foo;
    expect(spy.calledWith(proxy, sinon.match.instanceOf(ObjectPath), undefined, 'bar')).to.be.true;
  });

  it('should not call handler if changes are made to a symbol property', () => {
    proxy[symbol] = 'changed';
    expect(spy).not.to.have.been.called;
  });

  it('should call handler with component, ObjectPath, new value, and original value when nested property is changed', () => {
    proxy.nested.foo = 'changed';
    expect(spy.calledWith(proxy, sinon.match.instanceOf(ObjectPath), 'changed', 'bar')).to.be.true;
  });

  it('should include nested property keys in ObjectPath passed to change handler', () => {
    proxy.nested.foo = 'changed';
    expect([...spy.lastCall.args[1]]).to.eql(['nested', 'foo']);
  });
});
