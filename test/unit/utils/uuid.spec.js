import { expect } from '../../support/chai.js';

import { UUID } from '../../../lib/utils/uuid.js';

const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

// This string and Array are equivalent
const UUID_STRING = 'b47b93ce-4c65-4aba-bf15-287a8934656f';
const UUID_ARRAY = [180, 123, 147, 206, 76, 101, 74, 186, 191, 21, 40, 122, 137, 52, 101, 111];

/** @test {UUID.toString} */
describe('UUID', () => {
    let id, idFromString, idFromArray;
    beforeEach(() => {
        id = new UUID();
        idFromString = new UUID(UUID_STRING);
        idFromArray = new UUID(UUID_ARRAY);
    });

    it('should generate random 128 bit UUID', () => {
        expect(id.length).to.equal(16);
    });

    /** @test {UUID.toString} */
    describe('toString', () => {
        it('should output xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx format', () => {
            expect(UUID_REGEX.test(id.toString())).to.be.true;
        });
    });

    /** @test {UUID.toJSON} */
    describe('toJSON', () => {
        it('should output string format when include in JSON.stringify', () => {
            expect(UUID_REGEX.test(JSON.stringify(id))).to.be.true;
        });
    });

    it('should rebuild UUID from string', () => {
        expect([...idFromString]).to.eql(UUID_ARRAY);
    });

    it('should rebuild UUID from array', () => {
        expect(idFromArray.toString()).to.eql(UUID_STRING);
    });
});
