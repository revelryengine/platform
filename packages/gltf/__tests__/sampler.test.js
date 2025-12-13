import { describe, it, expect } from 'bdd';

import { Sampler } from '../sampler.js';
import { GL      } from '../constants.js';


describe('Sampler', () => {
    it('sets default values', () => {
        const sampler = new Sampler({});

        expect(sampler.wrapS).to.equal(GL.REPEAT);
        expect(sampler.wrapT).to.equal(GL.REPEAT);
    });
});
