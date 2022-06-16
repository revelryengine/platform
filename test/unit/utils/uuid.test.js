import { describe, it, beforeEach } from 'https://deno.land/std@0.143.0/testing/bdd.ts';
import { assert, assertEquals     } from 'https://deno.land/std@0.143.0/testing/asserts.ts';

import { UUID } from '../../../lib/utils/uuid.js';

const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

// This string and Array are equivalent
const UUID_STRING = 'b47b93ce-4c65-4aba-bf15-287a8934656f';
const UUID_ARRAY  = [180, 123, 147, 206, 76, 101, 74, 186, 191, 21, 40, 122, 137, 52, 101, 111];

describe('UUID', () => {
    let id, idFromString, idFromArray;
    beforeEach(() => {
        id = new UUID();
        idFromString = new UUID(UUID_STRING);
        idFromArray  = new UUID(UUID_ARRAY);
    });

    it('should generate random 128 bit UUID', () => {
        assertEquals(id.length, 16);
    });

    describe('toString', () => {
        it('should output xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx format', () => {
            assert(UUID_REGEX.test(id.toString()));
        });
    });

    describe('toJSON', () => {
        it('should output string format when include in JSON.stringify', () => {
            assert(UUID_REGEX.test(JSON.stringify(id)));
        });
    });

    it('should rebuild UUID from string', () => {
        assertEquals([...idFromString], UUID_ARRAY);
    });

    it('should rebuild UUID from array', () => {
        assertEquals(idFromArray.toString(), UUID_STRING);
    });
});
