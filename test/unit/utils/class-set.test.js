import { describe, it, beforeEach          } from 'https://deno.land/std@0.143.0/testing/bdd.ts';
import { assert, assertFalse, assertEquals } from 'https://deno.land/std@0.143.0/testing/asserts.ts';

import { ClassSet } from '../../../lib/utils/class-set.js';

describe('ClassSet', () => {
    let itemA, itemB, classSet;

    class ClassA {

    }

    class ClassB {

    }

    beforeEach(() => {
        itemA    = new ClassA();
        itemB    = new ClassB();
        classSet = new ClassSet();
        classSet.add(itemA);
        classSet.add(itemB);
    });

    it('should add items to set', () => {
        assert(classSet.has(itemA));
        assert(classSet.has(itemB));
    });

    it('should be able to find item by class', () => {
        assertEquals(classSet.getByClass(ClassA), itemA);
        assertEquals(classSet.getByClass(ClassB), itemB);
    });

    it('should remove item from set', () => {
        classSet.delete(itemA);
        assertFalse(classSet.has(itemA));
    });

    it('should not be able to find item by class of removed item', () => {
        classSet.delete(itemA);
        assertEquals(classSet.getByClass(ClassA), undefined);
    });
});
