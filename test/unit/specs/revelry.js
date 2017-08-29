import chai, { expect } from 'chai';

import * as Revelry from '../../../dist/revelry.js';

describe('Revelry', () => {
    
    it('should load module', () => {
        expect(Revelry).not.to.be.undefined;
    }); 

    it('should export Game', () => {
        expect(Revelry.Game).not.to.be.undefined;
    });

    it('should export Stage', () => {
        expect(Revelry.Stage).not.to.be.undefined;
    });

    it('should export System', () => {
        expect(Revelry.System).not.to.be.undefined;
    });

    it('should export EntityModel', () => {
        expect(Revelry.EntityModel).not.to.be.undefined;
    });

    it('should export EntityManager', () => {
        expect(Revelry.EntityManager).not.to.be.undefined;
    });

    it('should export EventManager', () => {
        expect(Revelry.EventManager).not.to.be.undefined;
    });


    it('should export components', () => {
        expect(Revelry.components).not.to.be.undefined;
    });

    it('should export utils', () => {
        expect(Revelry.utils).not.to.be.undefined;
    });
});