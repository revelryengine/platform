import chai, { expect } from 'chai';
import sinon from 'sinon';

import * as Revelry from '../../../dist/revelry.js';

describe('Revelry.Stage', () => {
    let stage, system1, system2, eventHandler;

    before(async () => {          
        stage = new Revelry.Stage();
        system1 = new Revelry.System(stage);
        system2 = new Revelry.System(stage);
        system1.update = sinon.spy();
        system2.update = sinon.spy();
        system1.render = sinon.spy();
        system2.render = sinon.spy();
        system1.dispose = sinon.spy();
        system2.dispose = sinon.spy();
        eventHandler = sinon.spy();

        stage.systems.add(system1);
        stage.systems.add(system2);
        stage.events.on('test', eventHandler);
    });

    it('should call update on all systems', () => {
        stage.update();
        sinon.assert.calledOnce(system1.update);
        sinon.assert.calledOnce(system2.update);
    });

    it('should call render on all systems', () => {
        stage.render();
        sinon.assert.calledOnce(system1.render);
        sinon.assert.calledOnce(system2.render);
    });

    it('should dispatch events on update', () => {
        stage.events.emit('test');
        sinon.assert.notCalled(eventHandler);
        stage.update();
        sinon.assert.calledOnce(eventHandler);
    });

    it('should dipsose itself and all systems', () => {
        stage.dispose();
        sinon.assert.calledOnce(system1.dispose);
        sinon.assert.calledOnce(system2.dispose);
        expect(stage.disposed).to.equal(true);
    });

    it('should import stage from module', async () => {
        let stage = await Revelry.Stage.import('../test/fixtures/stages/empty.js');
        expect(stage.id).to.equal('empty-stage');
    });

    it('should import stage from module and load exported data', async () => {
        let stage = await Revelry.Stage.import('../test/fixtures/stages/simple.js');
        expect(stage.id).to.equal('simple-stage');
        expect(stage.systems.size).to.equal(1);
        expect(stage.components.size).to.equal(4);
    });

    it('should import exported stage from module', async () => {
        let stage = await Revelry.Stage.import('../test/fixtures/stages/advanced.js');
        expect(stage.id).to.equal('advanced-stage');
    });
});