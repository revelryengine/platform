import { describe, it, beforeEach                            } from 'https://deno.land/std@0.143.0/testing/bdd.ts';
import { assert, assertFalse, assertEquals, assertInstanceOf } from 'https://deno.land/std@0.143.0/testing/asserts.ts';
import { spy, assertSpyCall, assertSpyCalls                  } from 'https://deno.land/std@0.143.0/testing/mock.ts';

import { IdSet } from '../../../lib/utils/id-set.js';
import { UUID  } from '../../../lib/utils/uuid.js';

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

    it('should generate a uuid for a item if it is not provided', () => {
        const item = {};
        idSet.add(item);
        assert(UUID.isUUID(item.id));
    });

    describe('setRegistrationHandlers', () => {
        let register, unregister, itemA, itemB;
        beforeEach(() => {
            register   = spy();
            unregister = spy();
            idSet.setRegistrationHandlers({ register, unregister });

            itemA = {};
            itemB = {};

            idSet.add(itemA);
            idSet.add(itemB, false);
        });

        it('should call register handler when item is added', () => {
            assertSpyCall(register, 0, { args: [itemA]});
        });
    
        it('should not call register handler when item is added if register = false', () => {
            assertSpyCalls(register, 1);
        });
    
        it('should call unregister handler when item is deleted', () => {
            idSet.delete(itemA);
            assertSpyCall(unregister, 0, { args: [itemA]});
        });
    
        it('should not call register handler when item is deleted if unregister = false', () => {
            idSet.delete(itemB, false);
            assertSpyCalls(unregister, 0);
        });
    });
});
