import chai, { expect } from 'chai';
import sinon from 'sinon';

import * as Revelry from '../../../dist/revelry.js';

describe('Revelry.System', () => {
    let system;

    before(async () => {   
        class TestEntity extends Revelry.EntityModel {
            @Revelry.EntityModel.Component('bar')
            bar;
        }

        class TestSystem extends Revelry.System {
            @TestEntity.Model()
            foo;
        }

        system = new TestSystem();
    });
});