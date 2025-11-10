import { describe, it, expect, beforeEach } from 'bdd';

import { Game   } from '../game.js';
import { Stage  } from '../stage.js';
import { System } from '../system.js';
import { Model  } from '../model.js';
import { UUID   } from 'revelryengine/utils/uuid.js';

/**
 * @import { Component } from '../ecs.js';
 */

describe('Model', () => {
    class ModelA extends Model.Typed(/** @type {const} */({
        components: ['a', 'b', 'c']
    })) { }

    class SystemA extends System.Typed(/** @type {const} */({
        id: 'systemA',
        models: {
            modelA: { model: ModelA },
        },
    })) { }

    /** @type {Component} */
    let componentA;
    /** @type {Component} */
    let componentB;
    /** @type {Component} */
    let componentC;

    /** @type {string} */
    let entity;

    /** @type {Game} */
    let game;
    /** @type {Stage} */
    let stage;
    /** @type {SystemA} */
    let system;
    /** @type {ModelA} */
    let modelA;

    beforeEach(() => {
        game   = new Game();
        stage  = new Stage(game, 'stage');
        system = new SystemA(stage);

        game.stages.add(stage);

        stage.systems.add(system);

        entity = UUID();

        componentA = stage.createComponent({ entity, type: 'a', value: 'a' });
        componentB = stage.createComponent({ entity, type: 'b', value: 123 });
        componentC = stage.createComponent({ entity, type: 'c', value: true });

        modelA = system.models.modelA;
    });

    describe('components', () => {
        it('should have component property references to the components', () => {
            expect(modelA.components.a).to.equal(componentA);
            expect(modelA.components.b).to.equal(componentB);
            expect(modelA.components.c).to.equal(componentC);
        });
    });

    describe('stage', () => {
        it('should be a reference to the stage', () => {
            expect(modelA.stage).to.equal(stage);
        });
    });

    describe('game', () => {
        it('should be a reference to the stage game', () => {
            expect(modelA.game).to.equal(game);
        });
    });

    describe('default components', () => {
        it('should not error when using the base Model class', () => {
            stage.createSystem(System.Typed({ id: 'system', models: { modelA: { model: Model } } }));
            stage.createComponent({ entity: UUID(), type: 'a', value: 'a' });
        });
    });
});
