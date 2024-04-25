import { describe, it, beforeEach, afterEach } from 'https://deno.land/std@0.208.0/testing/bdd.ts';
import { FakeTime                            } from 'https://deno.land/std@0.208.0/testing/time.ts';

import { assertEquals } from 'https://deno.land/std@0.208.0/assert/assert_equals.ts';

import { Game   } from '../lib/game.js';
import { Stage  } from '../lib/stage.js';
import { System } from '../lib/system.js';
import { Model  } from '../lib/model.js';
import { UUID   } from '../deps/utils.js';

/**
 * @import { Component } from '../lib/ecs.js';
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

    /** @type {FakeTime} */
    let time;

    /** @type {Component<'a'>} */
    let componentA;
    /** @type {Component<'b'>} */
    let componentB;
    /** @type {Component<'c'>} */
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
        time   = new FakeTime();
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

    afterEach(() => {
        time.restore();
    });

    describe('components', () => {
        it('should have component property references to the components', () => {
            assertEquals(modelA.components.a, componentA);
            assertEquals(modelA.components.b, componentB);
            assertEquals(modelA.components.c, componentC);
        });
    });

    describe('stage', () => {
        it('should be a reference to the stage', () => {
            assertEquals(modelA.stage, stage);
        });
    });

    describe('game', () => {
        it('should be a reference to the stage game', () => {
            assertEquals(modelA.game, game);
        });
    });

    describe('default components', () => {
        it('should not error when using the base Model class', () => {
            stage.createSystem(System.Typed({ id: 'system', models: { modelA: { model: Model } } }));
            stage.createComponent({ entity: UUID(), type: 'a', value: 'a' });
        });
    });
});
