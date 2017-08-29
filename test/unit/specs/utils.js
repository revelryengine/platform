import chai, { expect } from 'chai';
import sinon from 'sinon';

import * as Revelry from '../../../dist/revelry.js';

describe('Revelry.utils', () => {

    // before(async () => {          
    //     await reloadModule();
    // });

    it('should export timing', () => {
        expect(Revelry.utils.timing).not.to.be.undefined;
    });

    describe('default proxy', () => {
        it('should return target value if target property is defined', () => {
            let proxy = Revelry.utils.createDefaultProxy({ x: 't' });
            expect(proxy.x).to.equal('t');
        });

        it('should return default value if target property is not defined', () => {
            let proxy = Revelry.utils.createDefaultProxy({}, { x: 'd' });
            expect(proxy.x).to.equal('d');
        });

        it('should return target value if nested target property is defined', () => {
            let proxy = Revelry.utils.createDefaultProxy({ x: { y: 't' } }, {});
            expect(proxy.x.y).to.equal('t');
        });

        it('should return default value if nested target property is not defined', () => {
            let proxy = Revelry.utils.createDefaultProxy({}, { x: { y: 'd' } });
            expect(proxy.x.y).to.equal('d');
        });

        it('should return default value if proxy property is deleted', () => {
            let proxy = Revelry.utils.createDefaultProxy({ x: 't' }, { x: 'd' });
            delete proxy.x;
            expect(proxy.x).to.equal('d');
        });

        it('should return target value if proxy property is set', () => {
            let proxy = Revelry.utils.createDefaultProxy({}, { x: 'd' });
            proxy.x = 't';
            expect(proxy.x).to.equal('t');
        });

        it('should return nested default value if proxy property is set as an object', () => {
            let proxy = Revelry.utils.createDefaultProxy({}, { x: { y: 'd' } });
            proxy.x = {};
            expect(proxy.x.y).to.equal('d');
        });

        it('should not return nested default value if proxy property is set as a non object', () => {
            let proxy = Revelry.utils.createDefaultProxy({}, { x: { y: 'd' } });
            proxy.x = 't';
            expect(proxy.x.y).to.be.undefined;
        });
    });

    describe('watched proxy', () => {
        it('should call handler with component, property name, new value, and original value when property is changed', () => {
            let handler = sinon.spy();
            let component = { x: 'x' };
            let proxy = Revelry.utils.createWatchedProxy(component, handler);
            proxy.x = 'y';
            sinon.assert.calledWith(handler, component, 'x', 'y', 'x');
        });

        it('should not call handler if set to the same value', () => {
            let handler = sinon.spy();
            let proxy = Revelry.utils.createWatchedProxy({ x: 'x' }, handler);
            proxy.x = 'x';
            sinon.assert.notCalled(handler);
        });

        it('should call handler with component, property name, undefined, and original value when property is deleted', () => {
            let handler = sinon.spy();
            let component = { x: 'x' };
            let proxy = Revelry.utils.createWatchedProxy(component, handler);
            delete proxy.x;
            sinon.assert.calledWith(handler, component, 'x', undefined, 'x');
        });      

        it('should not call handler if shanges are made to a symbol property', () => {
            let handler = sinon.spy();
            let s = Symbol();
            let proxy = Revelry.utils.createWatchedProxy({ [s]: 'x' }, handler);
            proxy[s] = 'y';
            delete proxy[s];s
            sinon.assert.notCalled(handler);
        });

        it('should call handler with component, property name, new value, and original value when nested property is changed', () => {
            let handler = sinon.spy();
            let component = { x: { y: 'y' } };
            let proxy = Revelry.utils.createWatchedProxy(component, handler);
            proxy.x.y = 'z';
            sinon.assert.calledWith(handler, component, 'x.y', 'z', 'y');
        });

        it('should get/set property values on target', () => {
            let target = { x: { y: 'y' } };
            let proxy = Revelry.utils.createWatchedProxy(target, () => {});
            
            proxy.x.y = 'z';
            expect(proxy.x.y).to.equal(target.x.y);
            proxy.x = 'x';
            expect(proxy.x).to.equal(target.x);
        });
    });

    describe('requestTick', () => {
        let handler, handlerId;
        before(() => {
            handler = sinon.spy();
            handlerId = Revelry.utils.requestTick(handler);
        });
        
        it('should call handler with high resolution timestamp as agrument',() => {
            sinon.assert.calledOnce(handler);
            sinon.assert.calledWith(handler, sinon.match((value) => {
                //is a number and has floating point value
                return typeof value === 'number' && Math.floor(value) !== value;
            }));
        });
    });

    describe('cancelTick', () => {
        let handler, handlerId;
        before(() => {
            handler = sinon.spy();
            handlerId = Revelry.utils.requestTick(handler);
            Revelry.utils.cancelTick(handlerId);
        });
        
        it('should not call handler',() => {
            sinon.assert.notCalled(handler);
        });
    });

    describe('decorators', () => {
        // let _window = global.window;

        xit('should set nodeOnly method as noop in browser context', async () => {
            global.window = {};
            await reloadModule();

            let t = getClassWithDecorator(Revelry.utils.nodeOnly);
            expect(t.foo).to.equal(Function.prototype);
        });

        xit('should set browserOnly method as noop in node context', async () => {
            delete global.window;
            await reloadModule();

            let t = getClassWithDecorator(Revelry.utils.browserOnly);
            expect(t.foo).to.equal(Function.prototype);
        });

        it('should time method using the User Timing API', () => {
            let t = getClassWithDecorator(Revelry.utils.timed);
            t.foo();
            expect(Revelry.utils.timing.getEntriesByName('Revelry:Test.foo')[0]).not.to.be.undefined;
        });

        // afterEach(() => {
        //     global.window = _window;
        // });
    })

    // after(() => {
    //     System.delete(System.normalizeSync('dist/revelry.js'));
    // });
});

// async function reloadModule(){
//     System.delete(System.normalizeSync('dist/revelry.js'));
//     Revelry = await System.import('dist/revelry.js');
// }

function getClassWithDecorator(decorator){
    return new (class Test {
        @decorator
        foo() {
            return 'foobar';
        }
    })();
}