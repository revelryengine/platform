import { describe, it, beforeEach } from 'https://deno.land/std@0.208.0/testing/bdd.ts';

import { assert       } from 'https://deno.land/std@0.208.0/assert/assert.ts';
import { assertEquals } from 'https://deno.land/std@0.208.0/assert/assert_equals.ts';
import { assertFalse  } from 'https://deno.land/std@0.208.0/assert/assert_false.ts';
import { assertThrows } from 'https://deno.land/std@0.208.0/assert/assert_throws.ts';

import { IdSet } from '../../lib/utils/id-set.js';
import { UUID  } from '../../lib/utils/uuid.js';

/** @typedef {import('https://deno.land/std@0.208.0/testing/mock.ts').Spy} Spy */

describe('IdSet', () => {
    /** @type {{id: string }} */
    let itemA;
    /** @type {{id: string }} */
    let itemB;
    /** @type {IdSet} */
    let idSet;

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

    it('should return false if item not in set', () => {
        assertFalse(idSet.delete({ id: 'x' }));
    });

    it('should not be able to find item by id of removed item', () => {
        idSet.delete(itemA);
        assertEquals(idSet.getById('itemA'), undefined);
    });

    it('should throw if getById is called with assert = true and the item does not exist', () => {
        idSet.delete(itemA);
        assertThrows(() => idSet.getById('itemA', true));
    });

    it('should generate a uuid for a item if it is not provided', () => {
        const item = {};
        idSet.add(item);
        const lastItem = [...idSet].pop();
        assertEquals(item, lastItem)
        assert(lastItem && UUID.isUUID(lastItem.id));
    });
});
