import { describe, it, beforeEach } from 'std/testing/bdd.ts';

import { assert       } from 'std/assert/assert.ts';
import { assertEquals } from 'std/assert/assert_equals.ts';
import { assertFalse  } from 'std/assert/assert_false.ts';

import { ClassSet } from '../../lib/utils/class-set.js';

describe('ClassSet', () => {
    
    class ClassA {

    }

    class ClassB {

    }
    /** @type {ClassA} */
    let itemA;
    /** @type {ClassB} */
    let itemB;
    /** @type {ClassSet<ClassA|ClassB>} */
    let classSet;

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
