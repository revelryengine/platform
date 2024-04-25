import { describe, it, beforeEach, afterEach } from 'https://deno.land/std@0.208.0/testing/bdd.ts';
import { spy, assertSpyCall, assertSpyCalls  } from 'https://deno.land/std@0.208.0/testing/mock.ts';
import { assertEquals       } from 'https://deno.land/std@0.208.0/assert/assert_equals.ts';
import { assertThrows       } from 'https://deno.land/std@0.208.0/assert/assert_throws.ts';
import { assertObjectMatch  } from 'https://deno.land/std@0.208.0/assert/assert_object_match.ts';
import { assertInstanceOf   } from 'https://deno.land/std@0.208.0/assert/assert_instance_of.ts';

import { Game, Stage, Component, ComponentReference, registerSchema, unregisterSchema, UUID, registerLoader, AssetReference, unregisterLoader } from '../lib/ecs.js';

import { a, b, c, d, e, f, g, h, i, j, k, l, m } from './fixtures/schemas.js';

const JSON_DATA_URI_A ='data:application/json;charset=utf-8;base64,eyAiYSI6ICJhIiB9';
const JSON_DATA_URI_B ='data:application/json;charset=utf-8;base64,eyAiYiI6ICJiIiB9';
const JSON_DATA_URI_C ='data:application/json;charset=utf-8;base64,eyAiYyI6ICJjIiB9';

/**
 * @import { Spy } from 'https://deno.land/std@0.208.0/testing/mock.ts';
 */

describe('Component Schemas', () => {
    /** @type {Spy} */
    let handler;

    /** @type {Game} */
    let game;

    /** @type {Stage} */
    let stage;

    /** @type {string} */
    let entityA;

    /** @type {Component<'a'>} */
    let componentA;
    /** @type {Component<'b'>} */
    let componentB;
    /** @type {Component<'c'>} */
    let componentC;
    /** @type {Component<'d'>} */
    let componentD;
    /** @type {Component<'e'>} */
    let componentE;
    /** @type {Component<'f'>} */
    let componentF;
    /** @type {Component<'g'>} */
    let componentG;

    beforeEach(() => {
        handler = spy();

        game  = new Game();
        stage = new Stage(game, 'stage');

        entityA = UUID();

        registerSchema('a', a);
        registerSchema('b', b);
        registerSchema('c', c);
        registerSchema('d', d);
        registerSchema('e', e);
        registerSchema('f', f);
        registerSchema('g', g);


        componentA = new Component(stage, { entity: entityA, type: 'a', value: 'a' });
        componentB = new Component(stage, { entity: entityA, type: 'b', value: 123 });
        componentC = new Component(stage, { entity: entityA, type: 'c', value: true });
        componentD = new Component(stage, { entity: entityA, type: 'd', value: { a: 'a' } });
        componentE = new Component(stage, { entity: entityA, type: 'e', value: { a: { b: 'b', c: 1 } } });

        componentF = new Component(stage, { entity: entityA, type: 'f', value: ['a', 'b', 'c'] });
        componentG = new Component(stage, { entity: entityA, type: 'g', value: [{ a: 'a', b: 1 }] });
    });

    afterEach(() => {
        unregisterSchema('a');
        unregisterSchema('b');
        unregisterSchema('c');
        unregisterSchema('d');
        unregisterSchema('e');
        unregisterSchema('f');
        unregisterSchema('g');
        unregisterSchema('h');
    });

    it('should not error when registering the same schema twice', () => {
        registerSchema('a', a);
    });

    it('should set the value of simple types', () => {
        assertEquals(componentA.value, 'a');
        assertEquals(componentB.value, 123);
        assertEquals(componentC.value, true);
    });

    it('should maintain property values of object and array types', () => {
        assertObjectMatch({ value: componentD.value }, { value: { a: 'a' } });
        assertObjectMatch({ value: componentE.value }, { value: { a: { b: 'b', c: 1 } } });
        assertObjectMatch({ value: componentF.value }, { value: ['a', 'b', 'c'] });
        assertObjectMatch({ value: componentG.value }, { value: [{ a: 'a', b: 1 }] });
    });

    it('should set the default value of a component', () => {
        assertEquals(new Component(stage, { entity: entityA, type: 'a' }).value, 'a');
        assertEquals(new Component(stage, { entity: entityA, type: 'b' }).value, 123);
        assertEquals(new Component(stage, { entity: entityA, type: 'c' }).value, true);

        assertObjectMatch({ value: new Component(stage, { entity: entityA, type: 'd', value: { } }).value },        { value: { a: 'a' } });
        assertObjectMatch({ value: new Component(stage, { entity: entityA, type: 'e', value: { } }).value },        { value: { a: { b: 'b', c: 1 } } });
        assertObjectMatch({ value: new Component(stage, { entity: entityA, type: 'f' }).value },                    { value: ['a', 'b', 'c'] });
        assertObjectMatch({ value: new Component(stage, { entity: entityA, type: 'g', value: [{ b: 1 }] }).value }, { value: [{ a: 'a', b: 1 }] });
    });

    it('should reset the value to the default value when setting to undefined', () => {
        componentA.value = undefined;
        assertEquals(componentA.value, 'a');
        componentB.value = undefined;
        assertEquals(componentB.value, 123);
        componentC.value = undefined;
        assertEquals(componentC.value, true);

        /** @ts-expect-error */
        componentD.value.a = undefined;
        assertObjectMatch({ value: componentD.value }, { value: { a: 'a' } });
        /** @ts-expect-error */
        componentE.value.a = undefined;
        assertObjectMatch({ value: componentE.value }, { value: { a: { b: 'b', c: 1 } } });

        componentF.value = undefined;
        assertObjectMatch({ value: componentF.value }, { value: ['a', 'b', 'c'] });
        /** @ts-expect-error */
        componentG.value[0].a = undefined;
        assertObjectMatch({ value: componentG.value }, { value: [{ a: 'a', b: 1 }] });
    });

    it('should fire value:change:${prop} when an observed property changes', () => {
        componentD.watch('value:change:/a',   handler);
        componentE.watch('value:change:/a',   handler);
        componentE.watch('value:change:/a/b', handler);
        componentG.watch('value:change:/0/a', handler);

        componentD.value.a = 'b';
        assertSpyCall(handler, 0, { args: ['a'] });

        componentE.value.a = { b: 'c', c: 2 };
        assertSpyCall(handler, 1, { args: [{ b: 'b', c: 1 }] });

        componentE.value.a.b = 'd';
        assertSpyCall(handler, 2, { args: ['c'] });

        componentG.value[0].a = 'b';
        assertSpyCall(handler, 3, { args: ['a'] });
    });

    it('should not fire value:change:${prop} when an observed property is set with identical value', () => {
        componentD.watch('value:change:/a',   handler);
        componentE.watch('value:change:/a',   handler);
        componentE.watch('value:change:/a/b', handler);
        componentG.watch('value:change:/0/a', handler);

        componentD.value.a = 'a';
        assertSpyCalls(handler, 0);

        componentE.value.a = { b: 'b', c: 1 };
        assertSpyCalls(handler, 0);

        componentE.value.a.b = 'b';
        assertSpyCalls(handler, 0);

        componentG.value[0].a = 'a';
        assertSpyCalls(handler, 0);
    });

    it('should throw when attempting to use certain array methods on complex array values', () => {
        /** @ts-expect-error */
        assertThrows(() => componentG.value.shift(),      'shift not allowed on complex component value array');
        /** @ts-expect-error */
        assertThrows(() => componentG.value.unshift(),    'unshift not allowed on complex component value array');
        /** @ts-expect-error */
        assertThrows(() => componentG.value.splice(),     'splice not allowed on complex component value array');
        /** @ts-expect-error */
        assertThrows(() => componentG.value.sort(),       'sort not allowed on complex component value array');
        /** @ts-expect-error */
        assertThrows(() => componentG.value.reverse(),    'reverse not allowed on complex component value array');
        /** @ts-expect-error */
        assertThrows(() => componentG.value.copyWithin(), 'copyWithin not allowed on complex component value array');
    });

    it('should throw when trying to set a symbol property on complex array values', () => {
        /** @ts-expect-error */
        assertThrows(() => componentG.value[Symbol('test')] = true, 'Cannot set symbol properties on a complex component value array');

    })

    it('should deserialized items via push', () => {
        /** @ts-expect-error */
        componentG.value.push({ b: 2 });
        assertObjectMatch(componentG.value[1], { a: 'a', b: 2 });
    });

    describe('toJSON', () => {
        it('should strip default values', () => {
            assertEquals(componentA.toJSON().value, undefined);
            assertEquals(componentB.toJSON().value, undefined);
            assertEquals(componentC.toJSON().value, undefined);

            assertEquals(componentD.toJSON().value.a, undefined);
            assertEquals(componentE.toJSON().value.a, undefined);
            assertEquals(componentF.toJSON().value, undefined);
            assertEquals(componentG.toJSON().value[0]?.a, undefined);
        });
    });

    describe('references', () => {
        describe('components', () => {
            /** @type {Component<'h'>} */
            let componentH;

            /** @type {Component<'i'>} */
            let componentI;

            /** @type {Component<'j'>} */
            let componentJ;

            /** @type {string} */
            let entityB;

            beforeEach(() => {
                registerSchema('h', h);
                registerSchema('i', i);
                registerSchema('j', j);

                entityB = UUID();

                componentH = new Component(stage, { entity: entityA, type: 'h', value: entityB });
                componentI = new Component(stage, { entity: entityA, type: 'i', value: { a: entityB, b: { c: entityB } } });
                componentJ = new Component(stage, { entity: entityA, type: 'j', value: [entityB] });
            });

            afterEach(() => {
                unregisterSchema('h');
                unregisterSchema('i');
                unregisterSchema('j');
            });

            it('should deserialize to a component reference', () => {
                assertInstanceOf(componentH.value,     ComponentReference);
                assertInstanceOf(componentI.value.a,   ComponentReference);
                assertInstanceOf(componentI.value.b.c, ComponentReference);
                assertInstanceOf(componentJ.value[0],  ComponentReference);
            });

            it('should add a ComponentReference to the stage for the defined type', () => {
                assertEquals([...stage.references.components.find({ entity: entityB, type: 'a' })].length, 3);
                assertEquals([...stage.references.components.find({ entity: entityB, type: 'c' })].length, 1);
            });

            it('should release a ComponentReference when the reference value or property changes', () => {
                componentH.value = UUID();
                assertEquals([...stage.references.components.find({ entity: entityB, type: 'a' })].length, 2);
                componentI.value.a = UUID();
                assertEquals([...stage.references.components.find({ entity: entityB, type: 'a' })].length, 1);
                componentJ.value[0] = UUID();
                assertEquals([...stage.references.components.find({ entity: entityB, type: 'a' })].length, 0);
            });

            it('should release a deeply nested ComponentReference when the value or parent reference property changes', () => {
                componentI.value = { a: UUID(), b: { c: entityB } };
                assertEquals([...stage.references.components.find({ entity: entityB, type: 'a' })].length, 2);
                assertEquals([...stage.references.components.find({ entity: entityB, type: 'c' })].length, 1);

                componentI.value.b = { c: UUID() };
                assertEquals([...stage.references.components.find({ entity: entityB, type: 'c' })].length, 0);

                componentJ.value = [UUID()];
                assertEquals([...stage.references.components.find({ entity: entityB, type: 'a' })].length, 1);
            });

            it('should release references via pop', () => {
                componentJ.value.pop();
                assertEquals([...stage.references.components.find({ entity: entityB, type: 'a' })].length, 2);
            });

            it('should release references when setting array length to remove items', () => {
                componentJ.value.length = 0;
                assertEquals([...stage.references.components.find({ entity: entityB, type: 'a' })].length, 2);
            });
        });

        describe('assets', () => {
            /** @type {Component<'k'>} */
            let componentK;

            /** @type {Component<'l'>} */
            let componentL;

            /** @type {Component<'m'>} */
            let componentM;

            /** @type {string} */
            let entityB;

            beforeEach(() => {
                handler = spy((uri) => fetch(uri).then((res) => res.json()));

                registerSchema('k', k);
                registerSchema('l', l);
                registerSchema('m', m);
                registerLoader('a', handler);

                entityB = UUID();

                componentK = new Component(stage, { entity: entityA, type: 'k', value: JSON_DATA_URI_A });
                componentL = new Component(stage, { entity: entityA, type: 'l', value: [JSON_DATA_URI_A] });
                componentM = new Component(stage, { entity: entityA, type: 'm', value: { a: JSON_DATA_URI_A } });
            });

            afterEach(() => {
                unregisterSchema('k');
                unregisterSchema('l');
                unregisterSchema('m');
                unregisterLoader('a');
            });

            it('should deserialize to an asset reference', () => {
                assertInstanceOf(componentK.value,    AssetReference);
                assertInstanceOf(componentL.value[0], AssetReference);
                assertInstanceOf(componentM.value.a,  AssetReference);
            });

            it('should add an AssetReference to the stage for the defined type', () => {
                assertEquals([...stage.references.assets.find({ type: 'a', uri: JSON_DATA_URI_A })].length, 3);
            });

            it('should release an AssetReference when the reference value or property changes', () => {
                componentK.value = JSON_DATA_URI_B;
                assertEquals([...stage.references.assets.find({ type: 'a', uri: JSON_DATA_URI_A })].length, 2);
                assertEquals([...stage.references.assets.find({ type: 'a', uri: JSON_DATA_URI_B })].length, 1);
            });

            it('should release a deeply nested ComponentReference when the value or parent reference property changes', () => {
                componentL.value = [JSON_DATA_URI_B];
                assertEquals([...stage.references.assets.find({ type: 'a', uri: JSON_DATA_URI_A })].length, 2);
                assertEquals([...stage.references.assets.find({ type: 'a', uri: JSON_DATA_URI_B })].length, 1);

                componentM.value = { a: JSON_DATA_URI_C };
                assertEquals([...stage.references.assets.find({ type: 'a', uri: JSON_DATA_URI_A })].length, 1);
                assertEquals([...stage.references.assets.find({ type: 'a', uri: JSON_DATA_URI_C })].length, 1);
            });

            it('should release references via pop', () => {
                componentL.value.pop();
                assertEquals([...stage.references.assets.find({ type: 'a', uri: JSON_DATA_URI_A })].length, 2);
            });

            it('should release references when setting array length to remove items', () => {
                componentL.value.length = 0;
                assertEquals([...stage.references.assets.find({ type: 'a', uri: JSON_DATA_URI_A })].length, 2);
            });

        });
    });
});
