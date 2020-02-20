// import { Entity } from '../../lib/entity.js';

describe('Entity', () => {

});
import { expect } from '../support/chai.js';

import { System      } from '../../lib/system.js';
import { Entity      } from '../../lib/entity.js';
import { EntityModel } from '../../lib/entity-model.js';
import { Stage       } from '../../lib/stage.js';
import { Game        } from '../../lib/game.js';
import { UUID        } from '../../lib/utils/uuid.js';

describe('Entity', () => {
    let stage, system, game, entity;

    class ModelA extends EntityModel {
        static get components() {
            return { foobar: { type: 'foobar' } };
        }
    }

    class TestSystem extends System {
        static get models() {
            return {
                modelA: { model: ModelA }
            }
        }
    }

    beforeEach(() => {
        entity = new UUID();

        game   = new Game();
        stage  = new Stage('test-stage');
        system = new TestSystem('test-system');

        stage.systems.add(system);
        game.stages.add(stage);

        ModelA.spawn(stage, { entity, foobar: { value: 'test' } });
    });

    describe('stage', () => {
        it('should be a reference to the parent stage', () => {
            expect(stage.entities.getById(entity).stage).to.equal(stage);
        });

        it('should be undefined for entity not in stage', () => {
            expect(new Entity().stage).to.be.undefined;
        });
    });

    describe('game', () => {
        it('should be a reference to the parent game', () => {
            expect(stage.entities.getById(entity).game).to.equal(game);
        });

        it('should be undefined for entity not in stage', () => {
            expect(new Entity().game).to.be.undefined;
        });
    });
});
