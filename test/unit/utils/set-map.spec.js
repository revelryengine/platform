import { expect } from '../../support/chai.js';

import { SetMap } from '../../../lib/utils/set-map.js';

/** @test {SetMap} */
describe('SetMap', () => {
    let setMap;

    beforeEach(() => {
        setMap = new SetMap();

        setMap.add('foo', 'foobar');
        setMap.add('foo', 'foobat');
        setMap.add('foo', 'foobaz');
        setMap.delete('foo', 'foobar');
        setMap.add('removed', 'foobar');
        setMap.delete('removed', 'foobar');
    });

    it('should create a new Set for key', () => {
        expect(setMap.get('foo')).to.be.a('Set');
    });

    it('should add item to set', () => {
        expect(setMap.get('foo').has('foobat')).to.be.true;
        expect(setMap.get('foo').has('foobaz')).to.be.true;
    });

    it('should remove item from set', () => {
        expect(setMap.get('foo').has('foobar')).to.be.false;
    });

    it('should remove empty Sets', () => {
        expect(setMap.get('removed')).to.be.undefined;
    });
});
