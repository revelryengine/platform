import { expect } from '../support/chai.js';

import { System      } from '../../lib/system.js';
import { Stage       } from '../../lib/stage.js';
import { Game        } from '../../lib/game.js';
import { EntityModel } from '../../lib/entity-model.js';
import { UUID        } from '../../lib/utils/uuid.js';

describe('System', () => {
    let stage, system, game, entity;

    class ModelA extends EntityModel {
        static get components() {
            return { foobar: { type: 'foobar' } };
        }
    }

    class ModelB extends EntityModel {
        static get components() {
            return { foobat: { type: 'foobat' } };
        }
    }

    class TestSystem extends System {
        static get models() {
            return {
                modelA: { model: ModelA },
                modelBs: { model: ModelB, isSet: true }
            }
        }
    }

    beforeEach(async () => {
        entity = new UUID();

        game   = new Game();
        stage  = new Stage('test-stage');
        system = new TestSystem('test-system');

        stage.systems.add(system);
        game.stages.add(stage);

        ModelA.spawn(stage, { entity, foobar: { value: 'test' } });

        await new Promise(resolve => setTimeout(resolve));
    });

    describe('stage', () => {
        it('should be a reference to the parent stage', () => {
            expect(system.stage).to.equal(stage);
        });

        it('should be undefined for stage model not in stage', () => {
            expect(new System().stage).to.be.undefined;
        });
    });

    describe('game', () => {
        it('should be a reference to the parent game', () => {
            expect(system.game).to.equal(game);
        });
        it('should be undefined for stage model not in stage', () => {
            expect(new System().game).to.be.undefined;
        });
    });

    describe('model sets', () => {
        it('should create a new set for models where isSet is true', () => {
            expect(system.modelBs).to.be.instanceOf(Set);
        });
    });
});
