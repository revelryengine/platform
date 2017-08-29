import chai, { expect } from 'chai';
import sinon from 'sinon';

import * as Revelry from '../../../dist/revelry.js';

describe('Revelry.EventManager', () => {

    it('should queue emitted events without dispatching', () => {
        let spy = sinon.spy();
        let events = new Revelry.EventManager();
        events.on('test', spy);
        events.emit('test');
        events.emit('test');
        sinon.assert.notCalled(spy);
        expect(events.events.size).to.equal(2);
    });

    it('should dispatch queued events', () => {
        let spy = sinon.spy();
        let events = new Revelry.EventManager();
        events.on('test', spy);
        events.emit('test');
        events.emit('test');
        events.dispatch();
        sinon.assert.calledTwice(spy);
    });

    it('should dispatch only the last queued event of type where comparator returns true with emitOnce', () => {
        let spy = sinon.spy();
        let events = new Revelry.EventManager();
        events.on('test', spy);
        events.emit('test');
        events.emitOnce('test', () => true);
        events.dispatch();
        sinon.assert.calledOnce(spy);
    });

    it('should call listeners immediately with emitNow', () => {
        let spy = sinon.spy();
        let events = new Revelry.EventManager();
        events.on('test', spy);
        events.emitNow('test');
        events.emitNow('test');
        sinon.assert.calledTwice(spy);
    });

    it('should not call removed listeners', () => {
        let spy = sinon.spy();
        let events = new Revelry.EventManager();
        events.on('test', spy);
        events.removeListener('test', spy);
        events.emitNow('test');
        sinon.assert.notCalled(spy);
    });

    it('should not call any listeners if all listeners are removed', () => {
        let spy = sinon.spy();
        let events = new Revelry.EventManager();
        events.on('test', spy);
        events.emit('test');
        events.removeAllListeners();
        events.dispatch();
        sinon.assert.notCalled(spy);
    });

    it('should not call any listeners if all events are removed', () => {
        let spy = sinon.spy();
        let events = new Revelry.EventManager();
        events.on('test', spy);
        events.emit('test');
        events.removeAllEvents();
        events.dispatch();
        sinon.assert.notCalled(spy);
    });
   
});