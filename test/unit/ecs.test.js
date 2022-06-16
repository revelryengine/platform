import { describe, it } from 'https://deno.land/std@0.143.0/testing/bdd.ts';
import { assertExists } from 'https://deno.land/std@0.143.0/testing/asserts.ts';

import * as ECS from '../../lib/ecs.js';

describe('ECS', () => {
    it('should load module', () => {
        assertExists(ECS);
    });

    it('should export Game', () => {
        assertExists(ECS.Game);
    });

    it('should export Stage', () => {
        assertExists(ECS.Stage);
    });

    it('should export System', () => {
        assertExists(ECS.System);
    });

    it('should export Model', () => {
        assertExists(ECS.Model);
    });
});
