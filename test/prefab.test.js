import { describe, it, beforeEach } from 'std/testing/bdd.ts';

import { assertEquals     } from 'std/assert/assert_equals.ts';
import { assertExists     } from 'std/assert/assert_exists.ts';
import { assertInstanceOf } from 'std/assert/assert_instance_of.ts';

import { Stage } from 'revelryengine/ecs/lib/stage.js';
import { PrefabSystem } from '../lib/prefab.js';


/**
 * @typedef {import('../lib/prefab.js').ComponentTypes} ComponentTypes
*/

describe('Prefab', () => {
    /** @type {Stage<ComponentTypes>} */
    let stage;

    /** @type {PrefabSystem} */
    let system;

    beforeEach(() => {
        stage  = new Stage();
        system = new PrefabSystem();

        stage.systems.add(system);
    });
});
