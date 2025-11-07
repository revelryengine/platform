import { describe, it, expect } from 'bdd';

import * as ECS from '../lib/ecs.js';

describe('ECS', () => {
    it('should load module', () => {
        expect(ECS).to.exist;
    });

    it('should export Game', () => {
        expect(ECS.Game).to.exist;
    });

    it('should export Stage', () => {
        expect(ECS.Stage).to.exist;
    });

    it('should export System', () => {
        expect(ECS.System).to.exist;
    });

    it('should export Model', () => {
        expect(ECS.Model).to.exist;
    });
});
