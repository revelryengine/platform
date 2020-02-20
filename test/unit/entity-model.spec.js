import { expect } from '../support/chai.js';

import { System      } from '../../lib/system.js';
import { EntityModel } from '../../lib/entity-model.js';
import { Stage       } from '../../lib/stage.js';
import { Game        } from '../../lib/game.js';
import { UUID        } from '../../lib/utils/uuid.js';

describe('EntityModel', () => {
    let stage, system, game, entity;

    class ModelA extends EntityModel {
        static get components() {
            return { foobar: { type: 'foobar' } };
        }
    }

    class ModelB extends EntityModel {
        static get components() {
            return { foobat: { type: 'foobat', isSet: true } };
        }
    }

    class TestSystem extends System {
        static get models() {
            return {
                modelA: { model: ModelA },
                modelB: { model: ModelB }
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
        ModelB.spawn(stage, { foobat: [{ value: 'testA' },  { value: 'testB' }] });
    });

    describe('spawn', () => {
        it('should spawn an enity by adding all the required components to the stage', () => {
            expect(stage.entities.getById(entity)).not.to.be.undefined;
        });

        it('should set the component specified properites', () => {
            expect(system.modelA.foobar.value).to.equal('test');
        });

        it('should throw if component properity is not specified', () => {
            try {
                ModelA.spawn(stage, {});
                expect(true).to.be.false;
            } catch(e) {
                expect(e.message).to.equal('Missing component');
            }
        });

        it('should add multiple components of a specified type if an array is provided', () => {
            expect(system.modelB.foobat.size).to.equal(2);
        });

        it('should throw if an array is provided but the component descriptior is not a set', () => {
            try {
                ModelA.spawn(stage, { foobar: [] });
                expect(true).to.be.false;
            } catch(e) {
                expect(e.message).to.equal('Component is not a Set');
            }
        });
    });

    describe('system', () => {
        it('should be a reference to the parent system', () => {
            expect(system.modelA.system).to.equal(system);
        });

        it('should be undefined for entity model not in stage', () => {
            expect(new EntityModel({}).system).to.be.undefined;
        });
    });

    describe('stage', () => {
        it('should be a reference to the parent stage', () => {
            expect(system.modelA.stage).to.equal(stage);
        });

        it('should be undefined for entity model not in stage', () => {
            expect(new EntityModel({}).stage).to.be.undefined;
        });
    });

    describe('game', () => {
        it('should be a reference to the parent game', () => {
            expect(system.modelA.game).to.equal(game);
        });

        it('should be undefined for entity model not in stage', () => {
            expect(new EntityModel({}).game).to.be.undefined;
        });
    });

    describe('component sets', () => {
        it('should create a new set for components where isSet is true', () => {
            expect(new ModelB({}).foobat).to.be.instanceOf(Set);
        });
    });

    describe('components', () => {
        it('should have an empty object if not defined in sub class', () => {
            expect((class extends EntityModel {}).components).not.to.be.undefined;
        });
    });
});
