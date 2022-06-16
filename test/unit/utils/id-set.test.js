import { describe, it, beforeEach          } from 'https://deno.land/std@0.143.0/testing/bdd.ts';
import { assert, assertFalse, assertEquals } from 'https://deno.land/std@0.143.0/testing/asserts.ts';

import { IdSet } from '../../../lib/utils/id-set.js';

describe('IdSet', () => {
    let itemA, itemB, idSet;

    beforeEach(() => {
        itemA = { id: 'itemA' };
        itemB = { id: 'itemB' };
        idSet = new IdSet();
        idSet.add(itemA);
        idSet.add(itemB);
    });

    it('should add items to set', () => {
        assert(idSet.has(itemA));
        assert(idSet.has(itemB));
    });

    it('should be able to find item by id', () => {
        assertEquals(idSet.getById('itemA'), itemA);
        assertEquals(idSet.getById('itemB'), itemB);
    });

    it('should remove item from set', () => {
        idSet.delete(itemA);
        assertFalse(idSet.has(itemA));
    });

    it('should not be able to find item by id of removed item', () => {
        idSet.delete(itemA);
        assertEquals(idSet.getById('itemA'), undefined);
    });
});
