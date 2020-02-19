import { expect } from '../support/chai.js';

import * as Core from '../../lib/core.js';

describe('Core', () => {
    it('should load module', () => {
        expect(Core).not.to.be.undefined;
    });

    it('should export Game', () => {
        expect(Core.Game).not.to.be.undefined;
    });

    it('should export Stage', () => {
        expect(Core.Stage).not.to.be.undefined;
    });

    it('should export System', () => {
        expect(Core.System).not.to.be.undefined;
    });

    it('should export EntityModel', () => {
        expect(Core.EntityModel).not.to.be.undefined;
    });
});
