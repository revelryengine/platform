import { describe, it, beforeEach                            } from 'https://deno.land/std@0.143.0/testing/bdd.ts';
import { assert, assertInstanceOf, assertEquals, assertFalse } from 'https://deno.land/std@0.143.0/testing/asserts.ts';

import { SetMap } from '../../../lib/utils/set-map.js';

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
        assertInstanceOf(setMap.get('foo'), Set);
    });

    it('should add item to set', () => {
        assert(setMap.get('foo').has('foobat'));
        assert(setMap.get('foo').has('foobaz'));
    });

    it('should remove item from set', () => {
        assertFalse(setMap.get('foo').has('foobar'));
    });

    it('should remove empty Sets', () => {
        assertEquals(setMap.get('removed'), undefined);
    });
});
