import { describe, it } from 'std/testing/bdd.ts';
import { assertExists } from 'std/testing/asserts.ts';

import * as ECS from '../lib/ecs.js';

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
