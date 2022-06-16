import { describe, it, beforeEach } from 'https://deno.land/std@0.143.0/testing/bdd.ts';
import { assertEquals             } from 'https://deno.land/std@0.143.0/testing/asserts.ts';
import { spy, assertSpyCalls      } from 'https://deno.land/std@0.143.0/testing/mock.ts';

import { WatchedProxy } from '../../../lib/utils/watched-proxy.js';

describe('WatchedProxy', () => {
    let handler, symbol, target, proxy;

    beforeEach(() => {
        handler = spy();
        symbol  = Symbol('test');
        target  = { foo: 'bar', [symbol]: 'ignored', nested: { foo: 'bar' } };
        proxy   = new WatchedProxy(target, handler);
    });

    it('should get property values from target', () => {
        assertEquals(proxy.foo, 'bar');
    });

    it('should set property values on target', () => {
        proxy.foo = 'changed';
        assertEquals(target.foo, 'changed');
    });

    it('should get nested property values from target', () => {
        assertEquals(proxy.nested.foo, 'bar');
    });

    it('should set nested property values on target', () => {
        proxy.nested.foo = 'changed';
        assertEquals(target.nested.foo, 'changed');
    });

    it('should call handler with component, ObjectPath, new value, and original value when property is changed', () => {
        proxy.foo = 'changed';
        assertEquals(handler.calls[0].args[0], proxy);
        assertEquals([...handler.calls[0].args[1]], ['foo']);
        assertEquals(handler.calls[0].args[2], 'changed');
        assertEquals(handler.calls[0].args[3], 'bar');
    });

    it('should not call handler if set to the same value', () => {
        proxy.foo = 'bar';
        assertSpyCalls(handler, 0);
    });

    it('should call handler with component, ObjectPath, undefined, and original value when property is deleted', () => {
        delete proxy.foo;
        assertEquals(handler.calls[0].args[0], proxy);
        assertEquals([...handler.calls[0].args[1]], ['foo']);
        assertEquals(handler.calls[0].args[2], undefined);
        assertEquals(handler.calls[0].args[3], 'bar');
    });

    it('should not call handler if changes are made to a symbol property', () => {
        proxy[symbol] = 'changed';
        assertSpyCalls(handler, 0);
    });

    it('should call handler with component, ObjectPath, new value, and original value when nested property is changed', () => {
        proxy.nested.foo = 'changed';
        assertEquals(handler.calls[0].args[0], proxy);
        assertEquals([...handler.calls[0].args[1]], ['nested', 'foo']);
        assertEquals(handler.calls[0].args[2], 'changed');
        assertEquals(handler.calls[0].args[3], 'bar');
    });
});
