import { describe, it, beforeEach } from 'https://deno.land/std@0.208.0/testing/bdd.ts';

import { assertEquals     } from 'https://deno.land/std@0.208.0/assert/assert_equals.ts';
import { assertExists     } from 'https://deno.land/std@0.208.0/assert/assert_exists.ts';
import { assertInstanceOf } from 'https://deno.land/std@0.208.0/assert/assert_instance_of.ts';

import { Stage } from '../deps/ecs.js';
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
