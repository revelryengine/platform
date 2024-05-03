import { describe, it, beforeEach, afterEach } from 'https://deno.land/std@0.208.0/testing/bdd.ts';
import { spy, assertSpyCall, assertSpyCalls  } from 'https://deno.land/std@0.208.0/testing/mock.ts';
import { assertEquals       } from 'https://deno.land/std@0.208.0/assert/assert_equals.ts';
import { assertThrows       } from 'https://deno.land/std@0.208.0/assert/assert_throws.ts';
import { assertObjectMatch  } from 'https://deno.land/std@0.208.0/assert/assert_object_match.ts';
import { assertInstanceOf   } from 'https://deno.land/std@0.208.0/assert/assert_instance_of.ts';
import { assertStrictEquals } from 'https://deno.land/std@0.208.0/assert/assert_strict_equals.ts';
import { assertExists       } from 'https://deno.land/std@0.208.0/assert/assert_exists.ts';

import { Game, Stage, Component, ComponentReference, registerSchema, unregisterSchema, UUID, registerLoader, AssetReference, unregisterLoader } from '../lib/ecs.js';

const JSON_DATA_URI_A ='data:application/json;charset=utf-8;base64,eyAiYSI6ICJhIiB9';
const JSON_DATA_URI_B ='data:application/json;charset=utf-8;base64,eyAiYiI6ICJiIiB9';

describe('Component Schemas', () => {
    /** @type {Game} */
    let game;

    /** @type {Stage} */
    let stage;

    /** @type {string} */
    let entityA;

    /** @type {string} */
    let entityB;

    beforeEach(() => {
        game  = new Game();
        stage = new Stage(game, 'stage');

        entityA = UUID();
        entityB = UUID();
    });

    describe('simple', () => {
        beforeEach(() => {
            registerSchema('simpleString',  { type: 'string' });
            registerSchema('simpleNumber',  { type: 'number' });
            registerSchema('simpleBoolean', { type: 'boolean' });
            registerSchema('simpleObject',  { type: 'object', properties: { string: { type: 'string' }, number: { type: 'number' }, boolean: { type: 'boolean' } } });
            registerSchema('simpleArray',   { type: 'array', items: { type: 'string' } });
            registerSchema('simpleTuple',   { type: 'array', items: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }] });

            registerSchema('simpleObjectDeep',  { type: 'object',
                properties: {
                    object:  { type: 'object', properties: { string: { type: 'string' }, number: { type: 'number' }, boolean: { type: 'boolean' } } },
                    array:   { type: 'array', items: { type: 'string' } },
                    tuple:   { type: 'array', items: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }] },
                }
            });

            registerSchema('simpleArrayDeep',  { type: 'array',
                items: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            string:  { type: 'string' },
                            number:  { type: 'number' },
                            boolean: { type: 'boolean' }
                        }

                    }
                }
            });

            registerSchema('simpleTupleDeep',  { type: 'array',
                items: [{
                    type: 'array',
                    items: [{
                        type: 'object',
                        properties: {
                            string:  { type: 'string' },
                            number:  { type: 'number' },
                            boolean: { type: 'boolean' }
                        }
                    }]
                }]
            });
        });

        afterEach(() => {
            unregisterSchema('simpleString');
            unregisterSchema('simpleNumber');
            unregisterSchema('simpleBoolean');
            unregisterSchema('simpleObject');
            unregisterSchema('simpleArray');
            unregisterSchema('simpleTuple');
            unregisterSchema('simpleObjectDeep');
            unregisterSchema('simpleArrayDeep');
            unregisterSchema('simpleTupleDeep');
        });

        it('should not modify value', () => {
            const refObject       = { string: 'a', number: 1, boolean: true };
            const componentObject = stage.createComponent({ entity: entityA, type: 'simpleObject', value: refObject });
            assertStrictEquals(componentObject.value, refObject);

            const refArray       = ['a', 'b', 'c'];
            const componentArray = stage.createComponent({ entity: entityA, type: 'simpleArray', value: refArray });
            assertStrictEquals(componentArray.value, refArray);

            const refTuple       = ['a', 1, true];
            const componentTuple = stage.createComponent({ entity: entityA, type: 'simpleTuple', value: refTuple });
            assertStrictEquals(componentTuple.value, refTuple);

            const refObjectDeep       = { object: { string: 'a', number: 1, boolean: true }, array: ['a', 'b', 'c'], tuple: ['a', 1, true] };
            const componentObjectDeep = stage.createComponent({ entity: entityA, type: 'simpleObjectDeep', value: refObjectDeep });
            assertStrictEquals(componentObjectDeep.value, refObjectDeep);

            const refArrayDeep       = [[{ string: 'a', number: 1, boolean: true }], [{ string: 'b', number: 2, boolean: false }]];
            const componentArrayDeep = stage.createComponent({ entity: entityA, type: 'simpleArrayDeep', value: refArrayDeep });
            assertStrictEquals(componentArrayDeep.value, refArrayDeep);

            const refTupleDeep       = [[{ string: 'a', number: 1, boolean: true }], [{ string: 'b', number: 2, boolean: false }]];
            const componentTupleDeep = stage.createComponent({ entity: entityA, type: 'simpleTupleDeep', value: refTupleDeep });
            assertStrictEquals(componentTupleDeep.value, refTupleDeep);
        });

        it('should fire value:change:/ when root object is set', () => {
            const handler = spy();

            const componentObject = stage.createComponent({ entity: entityA, type: 'simpleObject' });
            componentObject.watch('value:change:/', handler);
            componentObject.value = { string: 'a', number: 1, boolean: true };
            assertSpyCall(handler, 0, { args: [undefined] });

            const componentArray = stage.createComponent({ entity: entityA, type: 'simpleArray' });
            componentArray.watch('value:change:/', handler);
            componentArray.value = ['a', 'b', 'c'];
            assertSpyCall(handler, 1, { args: [undefined] });

            const componentTuple = stage.createComponent({ entity: entityA, type: 'simpleTuple' });
            componentTuple.watch('value:change:/', handler);
            componentTuple.value = ['a', 1, true];
            assertSpyCall(handler, 2, { args: [undefined] });

            const componentObjectDeep = stage.createComponent({ entity: entityA, type: 'simpleObjectDeep' });
            componentObjectDeep.watch('value:change:/', handler);
            componentObjectDeep.value = { object: { string: 'a', number: 1, boolean: true }, array: ['a', 'b', 'c'], tuple: ['a', 1, true] };
            assertSpyCall(handler, 3, { args: [undefined] });

            const componentArrayDeep = stage.createComponent({ entity: entityA, type: 'simpleArrayDeep' });
            componentArrayDeep.watch('value:change:/', handler);
            componentArrayDeep.value = [[{ string: 'a', number: 1, boolean: true }], [{ string: 'b', number: 2, boolean: false }]];
            assertSpyCall(handler, 4, { args: [undefined] });

            const componentTupleDeep = stage.createComponent({ entity: entityA, type: 'simpleTupleDeep' });
            componentTupleDeep.watch('value:change:/', handler);
            componentTupleDeep.value = [[{ string: 'a', number: 1, boolean: true }], [{ string: 'b', number: 2, boolean: false }]];
            assertSpyCall(handler, 5, { args: [undefined] });
        });
    });

    describe('toJSON', () => {
        beforeEach(() => {
            registerSchema('string',  { type: 'string' });
            registerSchema('number',  { type: 'number' });
            registerSchema('boolean', { type: 'boolean' });
            registerSchema('object',  { type: 'object', properties: { string: { type: 'string' }, number: { type: 'number' }, boolean: { type: 'boolean' } } });
            registerSchema('array',   { type: 'array', items: { type: 'string' } });
            registerSchema('tuple',   { type: 'array', items: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }] });

            registerSchema('objectDeep',  { type: 'object',
                properties: {
                    object:  { type: 'object', properties: { string: { type: 'string' }, number: { type: 'number' }, boolean: { type: 'boolean' } } },
                    array:   { type: 'array', items: { type: 'string' } },
                    tuple:   { type: 'array', items: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }] },
                }
            });

            registerSchema('arrayDeep',  { type: 'array',
                items: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            string:  { type: 'string' },
                            number:  { type: 'number' },
                            boolean: { type: 'boolean' }
                        }

                    }
                }
            });
        });

        it('should serialize the values', () => {
            const componentString = stage.createComponent({ entity: entityA, type: 'string', value: 'a' });
            assertEquals(componentString.toJSON().value, 'a');

            const componentNumber = stage.createComponent({ entity: entityA, type: 'number', value: 1 });
            assertEquals(componentNumber.toJSON().value, 1);

            const componentBoolean = stage.createComponent({ entity: entityA, type: 'boolean', value: true });
            assertEquals(componentBoolean.toJSON().value, true);

            const componentObject = stage.createComponent({ entity: entityA, type: 'object', value: { string: 'a', number: 1, boolean: true } });
            assertEquals(componentObject.toJSON().value, { string: 'a', number: 1, boolean: true });

            const componentArray = stage.createComponent({ entity: entityA, type: 'array', value: ['a', 'b', 'c'] });
            assertEquals(componentArray.toJSON().value, ['a', 'b', 'c']);

            const componentTuple = stage.createComponent({ entity: entityA, type: 'tuple', value: ['a', 1, true] });
            assertEquals(componentTuple.toJSON().value, ['a', 1, true]);

            const componentObjectDeep = stage.createComponent({ entity: entityA, type: 'objectDeep', value: { object: { string: 'a', number: 1, boolean: true }, array: ['a', 'b', 'c'], tuple: ['a', 1, true] } });
            assertEquals(componentObjectDeep.toJSON().value, { object: { string: 'a', number: 1, boolean: true }, array: ['a', 'b', 'c'], tuple: ['a', 1, true] });

            const componentArrayDeep = stage.createComponent({ entity: entityA, type: 'arrayDeep', value: [[{ string: 'a', number: 1, boolean: true }], [{ string: 'b', number: 2, boolean: false }]] });
            assertEquals(componentArrayDeep.toJSON().value, [[{ string: 'a', number: 1, boolean: true }], [{ string: 'b', number: 2, boolean: false }]]);
        });

    });

    describe('default', () => {
        beforeEach(() => {
            registerSchema('defaultString',  { type: 'string',  default: 'a'  });
            registerSchema('defaultNumber',  { type: 'number',  default: 1    });
            registerSchema('defaultBoolean', { type: 'boolean', default: true });
            registerSchema('defaultObject',  { type: 'object',  properties: { string: { type: 'string' }, number: { type: 'number' }, boolean: { type: 'boolean' } }, default: { string: 'a', number: 1, boolean: true } });
            registerSchema('defaultArray',   { type: 'array',   items: { type: 'string' }, default: ['a', 'b', 'c'] });
            registerSchema('defaultTuple',   { type: 'array',   items: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }], default: ['a', 1, true] });

            registerSchema('defaultObjectDeep',  { type: 'object',
                properties: {
                    object:  { type: 'object', properties: { string: { type: 'string' }, number: { type: 'number' }, boolean: { type: 'boolean' } }, default: { string: 'a', number: 1, boolean: true } },
                    array:   { type: 'array', items: { type: 'string' }, default: ['a', 'b', 'c'] },
                    tuple:   { type: 'array', items: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }], default: ['a', 1, true] },
                }
            });

            registerSchema('defaultArrayDeep',  { type: 'array',
                items: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            string:  { type: 'string',  default: 'a'  },
                            number:  { type: 'number',  default: 1    },
                            boolean: { type: 'boolean', default: true },
                        },
                        default: { string: 'a', number: 1, boolean: true },
                    },
                },
            });

            registerSchema('defaultTupleDeep',  { type: 'array',
                items: [{
                    type: 'array',
                    items: [{ type: 'string', default: 'a' }, { type: 'number', default: 1 }, { type: 'boolean', default: true }],
                    default: ['a', 1, true],
                }]
            });
        });

        afterEach(() => {
            unregisterSchema('defaultString');
            unregisterSchema('defaultNumber');
            unregisterSchema('defaultBoolean');
            unregisterSchema('defaultObject');
            unregisterSchema('defaultArray');
            unregisterSchema('defaultTuple');
            unregisterSchema('defaultObjectDeep');
            unregisterSchema('defaultArrayDeep');
            unregisterSchema('defaultTupleDeep');
        });

        it('should set default value', () => {
            const defaultString = stage.createComponent({ entity: entityA, type: 'defaultString' });
            assertEquals(defaultString.value, 'a');

            const defaultNumber = stage.createComponent({ entity: entityA, type: 'defaultNumber' });
            assertEquals(defaultNumber.value, 1);

            const defaultBoolean = stage.createComponent({ entity: entityA, type: 'defaultBoolean' });
            assertEquals(defaultBoolean.value, true);

            const defaultObject = stage.createComponent({ entity: entityA, type: 'defaultObject' });
            assertObjectMatch({ value: defaultObject.value }, { value: { string: 'a', number: 1, boolean: true } });

            const defaultArray = stage.createComponent({ entity: entityA, type: 'defaultArray' });
            assertObjectMatch({ value: defaultArray.value }, { value: ['a', 'b', 'c'] });

            const defaultTuple = stage.createComponent({ entity: entityA, type: 'defaultTuple' });
            assertObjectMatch({ value: defaultTuple.value }, { value: ['a', 1, true] });

            const defaultObjectDeep = stage.createComponent({ entity: entityA, type: 'defaultObjectDeep', value: {} });
            assertObjectMatch({ value: defaultObjectDeep.value }, { value: { object: { string: 'a', number: 1, boolean: true }, array: ['a', 'b', 'c'], tuple: ['a', 1, true] } });

            const defaultArrayDeep = stage.createComponent({ entity: entityA, type: 'defaultArrayDeep', value: [[{}]] });
            assertObjectMatch({ value: defaultArrayDeep.value }, { value: [[{ string: 'a', number: 1, boolean: true }]] });

            const defaultTupleDeep = stage.createComponent({ entity: entityA, type: 'defaultTupleDeep', value: [[]] });
            assertObjectMatch({ value: defaultTupleDeep.value }, { value: [['a', 1, true]] });
        });

        it('should reset the default value when setting to undefined', () => {
            const defaultString = stage.createComponent({ entity: entityA, type: 'defaultString' });
            defaultString.value = undefined;
            assertEquals(defaultString.value, 'a');

            const defaultNumber = stage.createComponent({ entity: entityA, type: 'defaultNumber' });
            defaultNumber.value = undefined;
            assertEquals(defaultNumber.value, 1);

            const defaultBoolean = stage.createComponent({ entity: entityA, type: 'defaultBoolean' });
            defaultBoolean.value = undefined;
            assertEquals(defaultBoolean.value, true);

            const defaultObject = stage.createComponent({ entity: entityA, type: 'defaultObject' });
            defaultObject.value = undefined;
            assertObjectMatch({ value: defaultObject.value }, { value: { string: 'a', number: 1, boolean: true } });

            const defaultArray = stage.createComponent({ entity: entityA, type: 'defaultArray' });
            defaultArray.value = undefined;
            assertObjectMatch({ value: defaultArray.value }, { value: ['a', 'b', 'c'] });

            const defaultTuple = stage.createComponent({ entity: entityA, type: 'defaultTuple' });
            defaultTuple.value = undefined;
            assertObjectMatch({ value: defaultTuple.value }, { value: ['a', 1, true] });

            const defaultObjectDeep = stage.createComponent({ entity: entityA, type: 'defaultObjectDeep', value: {} });
            defaultObjectDeep.value.object = undefined;
            defaultObjectDeep.value.array  = undefined;
            defaultObjectDeep.value.tuple  = undefined;
            assertObjectMatch({ value: defaultObjectDeep.value }, { value: { object: { string: 'a', number: 1, boolean: true }, array: ['a', 'b', 'c'], tuple: ['a', 1, true] } });

            const defaultArrayDeep = stage.createComponent({ entity: entityA, type: 'defaultArrayDeep', value: [[{}]] });
            defaultArrayDeep.value[0][0].string  = undefined;
            defaultArrayDeep.value[0][0].number  = undefined;
            defaultArrayDeep.value[0][0].boolean = undefined;
            assertObjectMatch({ value: defaultArrayDeep.value }, { value: [[{ string: 'a', number: 1, boolean: true }]] });

            const defaultTupleDeep = stage.createComponent({ entity: entityA, type: 'defaultTupleDeep', value: [[]] });
            defaultTupleDeep.value[0][0] = undefined;
            defaultTupleDeep.value[0][1] = undefined;
            defaultTupleDeep.value[0][2] = undefined;
            assertObjectMatch({ value: defaultTupleDeep.value }, { value: [['a', 1, true]] });
        });

        describe('toJSON', () => {
            it('should strip default values', () => {
                const defaultString = stage.createComponent({ entity: entityA, type: 'defaultString' });
                assertEquals(defaultString.toJSON().value, undefined);

                const defaultNumber = stage.createComponent({ entity: entityA, type: 'defaultNumber' });
                assertEquals(defaultNumber.toJSON().value, undefined);

                const defaultBoolean = stage.createComponent({ entity: entityA, type: 'defaultBoolean' });
                assertEquals(defaultBoolean.toJSON().value, undefined);

                const defaultObject = stage.createComponent({ entity: entityA, type: 'defaultObject', value: { string: 'a', number: 1, boolean: true } });
                assertEquals(defaultObject.toJSON().value, undefined);

                const defaultArray = stage.createComponent({ entity: entityA, type: 'defaultArray' });
                assertEquals(defaultArray.toJSON().value, undefined);

                const defaultTuple = stage.createComponent({ entity: entityA, type: 'defaultTuple' });
                assertEquals(defaultTuple.toJSON().value, undefined);

                const defaultObjectDeep = stage.createComponent({ entity: entityA, type: 'defaultObjectDeep', value: { object: { string: 'a', number: 1, boolean: true }, array: ['a', 'b', 'c'], tuple: ['a', 1, true] } });
                assertEquals(defaultObjectDeep.toJSON().value.object, undefined);
                assertEquals(defaultObjectDeep.toJSON().value.array, undefined);
                assertEquals(defaultObjectDeep.toJSON().value.tuple, undefined);

                const defaultArrayDeep = stage.createComponent({ entity: entityA, type: 'defaultArrayDeep', value: [[{}]] });
                assertEquals(defaultArrayDeep.toJSON().value[0][0], undefined);

                const defaultTupleDeep = stage.createComponent({ entity: entityA, type: 'defaultTupleDeep', value: [[]] });
                assertEquals(defaultTupleDeep.toJSON().value[0], undefined);
            });
        });
    });

    describe('observed', () => {
        beforeEach(() => {
            registerSchema('observedObject',  { type: 'object',
                properties: {
                    string:  { type: 'string'  },
                    number:  { type: 'number'  },
                    boolean: { type: 'boolean' },
                },
                observed: ['string', 'number', 'boolean'],
            });

            registerSchema('observedArray', { type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        string:  { type: 'string'  },
                        number:  { type: 'number'  },
                        boolean: { type: 'boolean' },
                    },
                    observed: ['string', 'number', 'boolean']
                },
            });

            registerSchema('observedTuple', { type: 'array',
                items: [
                    { type: 'object', properties: { string:  { type: 'string'  } }, observed: ['string']  },
                    { type: 'object', properties: { number:  { type: 'number'  } }, observed: ['number']  },
                    { type: 'object', properties: { boolean: { type: 'boolean' } }, observed: ['boolean'] },
                ],
            });

            registerSchema('observedDeep', { type: 'array', items: {
                type: 'array',
                items: {
                    type: 'array',
                    items: [{
                        type: 'object',
                        properties: {
                            string:  { type: 'string'  },
                            number:  { type: 'number'  },
                            boolean: { type: 'boolean' },
                            object:  { type: 'object', properties: { string:  { type: 'string'  } }, observed: ['string']  },
                        },
                        observed: ['string', 'number', 'boolean']
                    }]
                }
            }});
        });

        afterEach(() => {
            unregisterSchema('observedObject');
            unregisterSchema('observedArray');
            unregisterSchema('observedTuple');
            unregisterSchema('observedDeep');
        });

        it('should fire value:change:${prop} when an observed property changes', () => {
            const handler = spy();

            const componentObject = stage.createComponent({ entity: entityA, type: 'observedObject', value: { string: 'a', number: 1, boolean: true } });
            componentObject.watch('value:change:/string',  handler);
            componentObject.watch('value:change:/number',  handler);
            componentObject.watch('value:change:/boolean', handler);

            componentObject.value.string = 'b';
            assertSpyCall(handler, 0, { args: ['a'] });

            componentObject.value.number = 2;
            assertSpyCall(handler, 1, { args: [1] });

            componentObject.value.boolean = false;
            assertSpyCall(handler, 2, { args: [true] });

            const componentArray = stage.createComponent({ entity: entityA, type: 'observedArray', value: [{ string: 'a', number: 1, boolean: true }] });
            componentArray.watch('value:change:/0/string',  handler);
            componentArray.watch('value:change:/0/number',  handler);
            componentArray.watch('value:change:/0/boolean', handler);

            componentArray.value[0].string = 'b';
            assertSpyCall(handler, 3, { args: ['a'] });

            componentArray.value[0].number = 2;
            assertSpyCall(handler, 4, { args: [1] });

            componentArray.value[0].boolean = false;
            assertSpyCall(handler, 5, { args: [true] });

            const componentTuple = stage.createComponent({ entity: entityA, type: 'observedTuple', value: [{ string: 'a' }, { number: 1 }, { boolean: true }] });
            componentTuple.watch('value:change:/0/string',  handler);
            componentTuple.watch('value:change:/1/number',  handler);
            componentTuple.watch('value:change:/2/boolean', handler);

            componentTuple.value[0].string = 'b';
            assertSpyCall(handler, 6, { args: ['a'] });

            componentTuple.value[1].number = 2;
            assertSpyCall(handler, 7, { args: [1] });

            componentTuple.value[2].boolean = false;
            assertSpyCall(handler, 8, { args: [true] });

            const componentDeep = stage.createComponent({ entity: entityA, type: 'observedDeep', value: [[[{ string: 'a', number: 1, boolean: true, object: { string: 'a' } }]]] });
            componentDeep.watch('value:change:/0/0/0/string',  handler);
            componentDeep.watch('value:change:/0/0/0/number',  handler);
            componentDeep.watch('value:change:/0/0/0/boolean', handler);
            componentDeep.watch('value:change:/0/0/0/object/string', handler);

            componentDeep.value[0][0][0].string = 'b';
            assertSpyCall(handler, 9, { args: ['a'] });

            componentDeep.value[0][0][0].number = 2;
            assertSpyCall(handler, 10, { args: [1] });

            componentDeep.value[0][0][0].boolean = false;
            assertSpyCall(handler, 11, { args: [true] });
        });

        it('should fire value:change:${prop} when parent value is set', () => {
            const handler = spy();

            const componentObject = stage.createComponent({ entity: entityA, type: 'observedObject', value: { string: 'a', number: 1, boolean: true } });
            componentObject.watch('value:change:/string',  handler);
            componentObject.watch('value:change:/number',  handler);
            componentObject.watch('value:change:/boolean', handler);

            componentObject.value = { string: 'b', number: 2, boolean: false };
            assertSpyCall(handler, 0, { args: ['a'] });
            assertSpyCall(handler, 1, { args: [1] });
            assertSpyCall(handler, 2, { args: [true] });

            const componentArray = stage.createComponent({ entity: entityA, type: 'observedArray', value: [{ string: 'a', number: 1, boolean: true }] });
            componentArray.watch('value:change:/0/string',  handler);
            componentArray.watch('value:change:/0/number',  handler);
            componentArray.watch('value:change:/0/boolean', handler);

            componentArray.value[0] = { string: 'b', number: 2, boolean: false };
            assertSpyCall(handler, 3, { args: ['a'] });
            assertSpyCall(handler, 4, { args: [1] });
            assertSpyCall(handler, 5, { args: [true] });

            const componentTuple = stage.createComponent({ entity: entityA, type: 'observedTuple', value: [{ string: 'a' }, { number: 1 }, { boolean: true }] });
            componentTuple.watch('value:change:/0/string',  handler);
            componentTuple.watch('value:change:/1/number',  handler);
            componentTuple.watch('value:change:/2/boolean', handler);

            componentTuple.value = [{ string: 'b' }, { number: 2 }, { boolean: false }];
            assertSpyCall(handler, 6, { args: ['a'] });
            assertSpyCall(handler, 7, { args: [1] });
            assertSpyCall(handler, 8, { args: [true] });

            const componentDeep = stage.createComponent({ entity: entityA, type: 'observedDeep', value: [[[{ string: 'a', number: 1, boolean: true, object: { string: 'a' } }]]] });
            componentDeep.watch('value:change:/0/0/0/string',  handler);
            componentDeep.watch('value:change:/0/0/0/number',  handler);
            componentDeep.watch('value:change:/0/0/0/boolean', handler);
            componentDeep.watch('value:change:/0/0/0/object/string', handler);

            componentDeep.value = [[[{ string: 'b', number: 2, boolean: false, object: { string: 'b' } }]]];
            assertSpyCall(handler, 9, { args: ['a'] });
            assertSpyCall(handler, 10, { args: [1] });
            assertSpyCall(handler, 11, { args: [true] });
        });

        it('should not fire value:change:${prop} when an observed property is set to the same value', () => {
            const handler = spy();

            const componentObject = stage.createComponent({ entity: entityA, type: 'observedObject', value: { string: 'a', number: 1, boolean: true } });
            componentObject.watch('value:change:/string',  handler);
            componentObject.watch('value:change:/number',  handler);
            componentObject.watch('value:change:/boolean', handler);

            componentObject.value.string = 'a';
            assertSpyCalls(handler, 0);

            componentObject.value.number = 1;
            assertSpyCalls(handler, 0);

            componentObject.value.boolean = true;
            assertSpyCalls(handler, 0);

            const componentArray = stage.createComponent({ entity: entityA, type: 'observedArray', value: [{ string: 'a', number: 1, boolean: true }] });
            componentArray.watch('value:change:/0/string',  handler);
            componentArray.watch('value:change:/0/number',  handler);
            componentArray.watch('value:change:/0/boolean', handler);

            componentArray.value[0].string = 'a';
            assertSpyCalls(handler, 0);

            componentArray.value[0].number = 1;
            assertSpyCalls(handler, 0);

            componentArray.value[0].boolean = true;
            assertSpyCalls(handler, 0);

            const componentTuple = stage.createComponent({ entity: entityA, type: 'observedTuple', value: [{ string: 'a' }, { number: 1 }, { boolean: true }] });
            componentTuple.watch('value:change:/0/string',  handler);
            componentTuple.watch('value:change:/1/number',  handler);
            componentTuple.watch('value:change:/2/boolean', handler);

            componentTuple.value[0].string = 'a';
            assertSpyCalls(handler, 0);

            componentTuple.value[1].number = 1;
            assertSpyCalls(handler, 0);

            componentTuple.value[2].boolean = true;
            assertSpyCalls(handler, 0);

            const componentDeep = stage.createComponent({ entity: entityA, type: 'observedDeep', value: [[[{ string: 'a', number: 1, boolean: true, object: { string: 'a' } }]]] });
            componentDeep.watch('value:change:/0/0/0/string',  handler);
            componentDeep.watch('value:change:/0/0/0/number',  handler);
            componentDeep.watch('value:change:/0/0/0/boolean', handler);
            componentDeep.watch('value:change:/0/0/0/object/string', handler);

            componentDeep.value[0][0][0].string = 'a';
            assertSpyCalls(handler, 0);

            componentDeep.value[0][0][0].number = 1;
            assertSpyCalls(handler, 0);

            componentDeep.value[0][0][0].boolean = true;
            assertSpyCalls(handler, 0);
        });

        it('should not fire value:change:${prop} when parent value is set to same value', () => {
            const handler = spy();

            const componentObject = stage.createComponent({ entity: entityA, type: 'observedObject', value: { string: 'a', number: 1, boolean: true } });
            componentObject.watch('value:change:/string',  handler);
            componentObject.watch('value:change:/number',  handler);
            componentObject.watch('value:change:/boolean', handler);

            componentObject.value = { string: 'a', number: 1, boolean: true };
            assertSpyCalls(handler, 0);
            assertSpyCalls(handler, 0);
            assertSpyCalls(handler, 0);

            const componentArray = stage.createComponent({ entity: entityA, type: 'observedArray', value: [{ string: 'a', number: 1, boolean: true }] });
            componentArray.watch('value:change:/0/string',  handler);
            componentArray.watch('value:change:/0/number',  handler);
            componentArray.watch('value:change:/0/boolean', handler);

            componentArray.value[0] = { string: 'a', number: 1, boolean: true };
            assertSpyCalls(handler, 0);
            assertSpyCalls(handler, 0);
            assertSpyCalls(handler, 0);

            const componentTuple = stage.createComponent({ entity: entityA, type: 'observedTuple', value: [{ string: 'a' }, { number: 1 }, { boolean: true }] });
            componentTuple.watch('value:change:/0/string',  handler);
            componentTuple.watch('value:change:/1/number',  handler);
            componentTuple.watch('value:change:/2/boolean', handler);

            componentTuple.value = [{ string: 'a' }, { number: 1 }, { boolean: true }];
            assertSpyCalls(handler, 0);
            assertSpyCalls(handler, 0);
            assertSpyCalls(handler, 0);

            const componentDeep = stage.createComponent({ entity: entityA, type: 'observedDeep', value: [[[{ string: 'a', number: 1, boolean: true, object: { string: 'a' } }]]] });
            componentDeep.watch('value:change:/0/0/0/string',  handler);
            componentDeep.watch('value:change:/0/0/0/number',  handler);
            componentDeep.watch('value:change:/0/0/0/boolean', handler);
            componentDeep.watch('value:change:/0/0/0/object/string', handler);

            componentDeep.value = [[[{ string: 'a', number: 1, boolean: true, object: { string: 'a' } }]]];
            assertSpyCalls(handler, 0);
            assertSpyCalls(handler, 0);
            assertSpyCalls(handler, 0);
        });
    });

    describe('additional properties', () => {
        beforeEach(() => {
            registerSchema('additionalObject',  { type: 'object', properties: { string: { type: 'string', default: 'a' } } });
        });

        afterEach(() => {
            unregisterSchema('additionalObject');
        });

        it('should maintain additional properties when setting the value of an object type', () => {
            const componentObject = stage.createComponent({ entity: entityA, type: 'additionalObject', value: { string: 'a', number: 1 } });
            assertObjectMatch({ value: componentObject.value }, { value: { string: 'a', number: 1 } });
        });

        it('should fire value:change:/ when root value changes and include additional properties in original value', () => {
            const handler = spy();

            const componentObject = stage.createComponent({ entity: entityA, type: 'additionalObject', value: { string: 'a', number: 1 } });
            componentObject.watch('value:change:/', handler);

            componentObject.value = { string: 'b', number: 2 };
            assertSpyCall(handler, 0, { args: [{ string: 'a', number: 1 }] });
        });

        it('should not fire value:change:/ when root value is set with the same value including additional properties', () => {
            const handler = spy();

            const componentObject = stage.createComponent({ entity: entityA, type: 'additionalObject', value: { string: 'a', number: 1 } });
            componentObject.watch('value:change:/', handler);

            componentObject.value = { string: 'a', number: 1 };
            assertSpyCalls(handler, 0);
        });
    });

    describe('references', () => {
        describe('components', () => {
            /** @type {Component} */
            let componentSimple;
            /** @type {Component} */
            let componentObject;
            /** @type {Component} */
            let componentArray;
            /** @type {Component} */
            let componentTuple;
            /** @type {Component} */
            let componentDeep;

            beforeEach(() => {
                registerSchema('componentSimple', { type: 'string', component: 'a' });
                registerSchema('componentObject', { type: 'object', properties: { a: { type: 'string', component: 'a' } } });
                registerSchema('componentArray',  { type: 'array', items: { type: 'string', component: 'a' } });
                registerSchema('componentTuple',  { type: 'array', items: [{ type: 'string', component: 'a' }] });
                registerSchema('componentDeep',   { type: 'object', properties: { a: { type: 'object', properties: { b: { type: 'string', component: 'a' } } } } });

                componentSimple = stage.createComponent({ entity: entityA, type: 'componentSimple', value: entityB });
                componentObject = stage.createComponent({ entity: entityA, type: 'componentObject', value: { a: entityB } });
                componentArray  = stage.createComponent({ entity: entityA, type: 'componentArray',  value: [entityB] });
                componentTuple  = stage.createComponent({ entity: entityA, type: 'componentTuple',  value: [entityB] });
                componentDeep   = stage.createComponent({ entity: entityA, type: 'componentDeep',   value: { a: { b: entityB } } });
            });

            afterEach(() => {
                unregisterSchema('componentSimple');
                unregisterSchema('componentObject');
                unregisterSchema('componentArray');
                unregisterSchema('componentTuple');
                unregisterSchema('componentDeep');
            });

            it('should add a ComponentReference to the stage for the defined type', () => {
                assertEquals([...stage.references.components.find({ entity: entityB, type: 'a' })].length, 5);
            });

            it('should add a ComponentReference to the component for the defined type', () => {
                assertInstanceOf(componentSimple.references?.['/'],  ComponentReference);
                assertInstanceOf(componentObject.references?.['/a'], ComponentReference);
                assertInstanceOf(componentArray.references?.['/0'],  ComponentReference);
                assertInstanceOf(componentTuple.references?.['/0'],  ComponentReference);
                assertInstanceOf(componentDeep.references?.['/a/b'], ComponentReference);
            });

            it('should release a ComponentReference when the reference value or property changes', () => {
                componentSimple.value = UUID();
                assertEquals([...stage.references.components.find({ entity: entityB, type: 'a' })].length, 4);
                componentObject.value.a = UUID();
                assertEquals([...stage.references.components.find({ entity: entityB, type: 'a' })].length, 3);
                componentArray.value[0] = UUID();
                assertEquals([...stage.references.components.find({ entity: entityB, type: 'a' })].length, 2);
                componentTuple.value[0] = UUID();
                assertEquals([...stage.references.components.find({ entity: entityB, type: 'a' })].length, 1);
                componentDeep.value.a.b = UUID();
                assertEquals([...stage.references.components.find({ entity: entityB, type: 'a' })].length, 0);
            });

            it('should release a deeply nested ComponentReference when the value or parent reference property changes', () => {
                componentDeep.value = { a: { b: entityA } };
                assertEquals([...stage.references.components.find({ entity: entityB, type: 'a' })].length, 4);
            });

            it('should not throw if no references have been set yet', () => {
                const component = stage.createComponent({ entity: entityB, type: 'componentSimple' });
                component.value = entityB;
            });
        });

        describe('assets', () => {
            /** @type {Component} */
            let assetSimple;
            /** @type {Component} */
            let assetObject;
            /** @type {Component} */
            let assetArray;
            /** @type {Component} */
            let assetTuple;
            /** @type {Component} */
            let assetDeep;

            beforeEach(() => {
                registerLoader('a', (uri) => Promise.resolve({ uri, type: 'a' }));

                registerSchema('assetSimple', { type: 'string', asset: 'a' });
                registerSchema('assetObject', { type: 'object', properties: { a: { type: 'string', asset: 'a' } } });
                registerSchema('assetArray',  { type: 'array', items: { type: 'string', asset: 'a' } });
                registerSchema('assetTuple',  { type: 'array', items: [{ type: 'string', asset: 'a' }] });
                registerSchema('assetDeep',   { type: 'object', properties: { a: { type: 'object', properties: { b: { type: 'string', asset: 'a' } } } } });

                assetSimple = stage.createComponent({ entity: entityA, type: 'assetSimple', value: JSON_DATA_URI_B });
                assetObject = stage.createComponent({ entity: entityA, type: 'assetObject', value: { a: JSON_DATA_URI_B } });
                assetArray  = stage.createComponent({ entity: entityA, type: 'assetArray',  value: [JSON_DATA_URI_B] });
                assetTuple  = stage.createComponent({ entity: entityA, type: 'assetTuple',  value: [JSON_DATA_URI_B] });
                assetDeep   = stage.createComponent({ entity: entityA, type: 'assetDeep',   value: { a: { b: JSON_DATA_URI_B } } });
            });

            afterEach(() => {
                unregisterLoader('a');
                unregisterSchema('assetSimple');
                unregisterSchema('assetObject');
                unregisterSchema('assetArray');
                unregisterSchema('assetTuple');
                unregisterSchema('assetDeep');
            });

            it('should add an AssetReference to the stage for the defined type', () => {
                assertEquals([...stage.references.assets.find({ uri: JSON_DATA_URI_B, type: 'a' })].length, 5);
            });

            it('should add an AssetReference to the component for the defined type', () => {
                assertInstanceOf(assetSimple.references?.['/'],  AssetReference);
                assertInstanceOf(assetObject.references?.['/a'], AssetReference);
                assertInstanceOf(assetArray.references?.['/0'],  AssetReference);
                assertInstanceOf(assetTuple.references?.['/0'],  AssetReference);
                assertInstanceOf(assetDeep.references?.['/a/b'], AssetReference);
            });

            it('should release an AssetReference when the reference value or property changes', () => {
                assetSimple.value = JSON_DATA_URI_A;
                assertEquals([...stage.references.assets.find({ uri: JSON_DATA_URI_B, type: 'a' })].length, 4);
                assetObject.value.a = JSON_DATA_URI_A;
                assertEquals([...stage.references.assets.find({ uri: JSON_DATA_URI_B, type: 'a' })].length, 3);
                assetArray.value[0] = JSON_DATA_URI_A;
                assertEquals([...stage.references.assets.find({ uri: JSON_DATA_URI_B, type: 'a' })].length, 2);
                assetTuple.value[0] = JSON_DATA_URI_A;
                assertEquals([...stage.references.assets.find({ uri: JSON_DATA_URI_B, type: 'a' })].length, 1);
                assetDeep.value.a.b = JSON_DATA_URI_A;
                assertEquals([...stage.references.assets.find({ uri: JSON_DATA_URI_B, type: 'a' })].length, 0);
            });

            it('should release a deeply nested AssetReference when the value or parent reference property changes', () => {
                assetDeep.value = { a: { b: JSON_DATA_URI_A } };
                assertEquals([...stage.references.assets.find({ uri: JSON_DATA_URI_B, type: 'a' })].length, 4);
            });
        });
    });

    describe('complex arrays and tuples', () => {
        beforeEach(() => {
            registerSchema('complexArrayDefault',   { type: 'array', items: { type: 'string', default: 'a'   } });
            registerSchema('complexArrayReference', { type: 'array', items: { type: 'string', component: 'a' } });
            registerSchema('complexArrayObserved',  { type: 'array', items: { type: 'object', properties: { string: { type: 'string' } },  observed: ['string']  } });
            registerSchema('complexArrayDeep', { type: 'object',
                properties: {
                    default:   { type: 'array', items: { type: 'string', default: 'a'   } },
                    reference: { type: 'array', items: { type: 'string', component: 'a' } },
                    observed:  { type: 'array', items: { type: 'object', properties: { string: { type: 'string' } }, observed: ['string']  } },
                },
            });

            registerSchema('complexTupleDefault',   { type: 'array', items: [{ type: 'string', default: 'a'   }] });
            registerSchema('complexTupleReference', { type: 'array', items: [{ type: 'string', component: 'a' }] });
            registerSchema('complexTupleObserved',  { type: 'array', items: [{ type: 'object', properties: { string: { type: 'string' } },  observed: ['string']  }] });
            registerSchema('complexTupleDeep', { type: 'object',
                properties: {
                    default:   { type: 'array', items: [{ type: 'string', default: 'a'   }] },
                    reference: { type: 'array', items: [{ type: 'string', component: 'a' }] },
                    observed:  { type: 'array', items: [{ type: 'object', properties: { string: { type: 'string' } }, observed: ['string']  }] },
                },
            });

            registerSchema('complexNoReference', { type: 'array', items: { type: 'string', default: 'a' } });
        });

        afterEach(() => {
            unregisterSchema('complexArrayDefault');
            unregisterSchema('complexArrayReference');
            unregisterSchema('complexArrayObserved');
            unregisterSchema('complexArrayDeep');
            unregisterSchema('complexTupleDefault');
            unregisterSchema('complexTupleReference');
            unregisterSchema('complexTupleObserved');
            unregisterSchema('complexTupleDeep');
            unregisterSchema('complexNoReference');
        });

        it('should throw when attempting to use certain array methods on complex array values', () => {
            const componentDefault   = stage.createComponent({ entity: entityA, type: 'complexArrayDefault', value: ['a', 'b', 'c'] });
            assertThrows(() => componentDefault.value.shift(),      'shift not allowed on complex component value array');
            assertThrows(() => componentDefault.value.unshift(),    'unshift not allowed on complex component value array');
            assertThrows(() => componentDefault.value.splice(),     'splice not allowed on complex component value array');
            assertThrows(() => componentDefault.value.sort(),       'sort not allowed on complex component value array');
            assertThrows(() => componentDefault.value.reverse(),    'reverse not allowed on complex component value array');
            assertThrows(() => componentDefault.value.copyWithin(), 'copyWithin not allowed on complex component value array');


            const componentReference = stage.createComponent({ entity: entityA, type: 'complexArrayReference', value: ['a', 'b', 'c'] });
            assertThrows(() => componentReference.value.shift(),      'shift not allowed on complex component value array');
            assertThrows(() => componentReference.value.unshift(),    'unshift not allowed on complex component value array');
            assertThrows(() => componentReference.value.splice(),     'splice not allowed on complex component value array');
            assertThrows(() => componentReference.value.sort(),       'sort not allowed on complex component value array');
            assertThrows(() => componentReference.value.reverse(),    'reverse not allowed on complex component value array');
            assertThrows(() => componentReference.value.copyWithin(), 'copyWithin not allowed on complex component value array');

            const componentObserved = stage.createComponent({ entity: entityA, type: 'complexArrayObserved', value: [{ string: 'a' }, { string: 'b' }, { string: 'c' }] });
            assertThrows(() => componentObserved.value.shift(),      'shift not allowed on complex component value array');
            assertThrows(() => componentObserved.value.unshift(),    'unshift not allowed on complex component value array');
            assertThrows(() => componentObserved.value.splice(),     'splice not allowed on complex component value array');
            assertThrows(() => componentObserved.value.sort(),       'sort not allowed on complex component value array');
            assertThrows(() => componentObserved.value.reverse(),    'reverse not allowed on complex component value array');
            assertThrows(() => componentObserved.value.copyWithin(), 'copyWithin not allowed on complex component value array');

            const componentDeep = stage.createComponent({ entity: entityA, type: 'complexArrayDeep', value: { default: ['a', 'b', 'c'], reference: ['a', 'b', 'c'], observed: [{ string: 'a' }, { string: 'b' }, { string: 'c' }] } });
            assertThrows(() => componentDeep.value.default.shift(),      'shift not allowed on complex component value array');
            assertThrows(() => componentDeep.value.default.unshift(),    'unshift not allowed on complex component value array');
            assertThrows(() => componentDeep.value.default.splice(),     'splice not allowed on complex component value array');
            assertThrows(() => componentDeep.value.default.sort(),       'sort not allowed on complex component value array');
            assertThrows(() => componentDeep.value.default.reverse(),    'reverse not allowed on complex component value array');
            assertThrows(() => componentDeep.value.default.copyWithin(), 'copyWithin not allowed on complex component value array');

            assertThrows(() => componentDeep.value.reference.shift(),      'shift not allowed on complex component value array');
            assertThrows(() => componentDeep.value.reference.unshift(),    'unshift not allowed on complex component value array');
            assertThrows(() => componentDeep.value.reference.splice(),     'splice not allowed on complex component value array');
            assertThrows(() => componentDeep.value.reference.sort(),       'sort not allowed on complex component value array');
            assertThrows(() => componentDeep.value.reference.reverse(),    'reverse not allowed on complex component value array');
            assertThrows(() => componentDeep.value.reference.copyWithin(), 'copyWithin not allowed on complex component value array');

            assertThrows(() => componentDeep.value.observed.shift(),      'shift not allowed on complex component value array');
            assertThrows(() => componentDeep.value.observed.unshift(),    'unshift not allowed on complex component value array');
            assertThrows(() => componentDeep.value.observed.splice(),     'splice not allowed on complex component value array');
            assertThrows(() => componentDeep.value.observed.sort(),       'sort not allowed on complex component value array');
            assertThrows(() => componentDeep.value.observed.reverse(),    'reverse not allowed on complex component value array');
            assertThrows(() => componentDeep.value.observed.copyWithin(), 'copyWithin not allowed on complex component value array');

            const componentTupleDefault = stage.createComponent({ entity: entityA, type: 'complexTupleDefault', value: ['a', 'b', 'c'] });
            assertThrows(() => componentTupleDefault.value.shift(),      'shift not allowed on complex component value array');
            assertThrows(() => componentTupleDefault.value.unshift(),    'unshift not allowed on complex component value array');
            assertThrows(() => componentTupleDefault.value.splice(),     'splice not allowed on complex component value array');
            assertThrows(() => componentTupleDefault.value.sort(),       'sort not allowed on complex component value array');
            assertThrows(() => componentTupleDefault.value.reverse(),    'reverse not allowed on complex component value array');
            assertThrows(() => componentTupleDefault.value.copyWithin(), 'copyWithin not allowed on complex component value array');

            const componentTupleReference = stage.createComponent({ entity: entityA, type: 'complexTupleReference', value: ['a', 'b', 'c'] });
            assertThrows(() => componentTupleReference.value.shift(),      'shift not allowed on complex component value array');
            assertThrows(() => componentTupleReference.value.unshift(),    'unshift not allowed on complex component value array');
            assertThrows(() => componentTupleReference.value.splice(),     'splice not allowed on complex component value array');
            assertThrows(() => componentTupleReference.value.sort(),       'sort not allowed on complex component value array');
            assertThrows(() => componentTupleReference.value.reverse(),    'reverse not allowed on complex component value array');
            assertThrows(() => componentTupleReference.value.copyWithin(), 'copyWithin not allowed on complex component value array');

            const componentTupleObserved = stage.createComponent({ entity: entityA, type: 'complexTupleObserved', value: [{ string: 'a' }, { string: 'b' }, { string: 'c' }] });
            assertThrows(() => componentTupleObserved.value.shift(),      'shift not allowed on complex component value array');
            assertThrows(() => componentTupleObserved.value.unshift(),    'unshift not allowed on complex component value array');
            assertThrows(() => componentTupleObserved.value.splice(),     'splice not allowed on complex component value array');
            assertThrows(() => componentTupleObserved.value.sort(),       'sort not allowed on complex component value array');
            assertThrows(() => componentTupleObserved.value.reverse(),    'reverse not allowed on complex component value array');
            assertThrows(() => componentTupleObserved.value.copyWithin(), 'copyWithin not allowed on complex component value array');

            const componentTupleDeep = stage.createComponent({ entity: entityA, type: 'complexTupleDeep', value: { default: ['a', 'b', 'c'], reference: ['a', 'b', 'c'], observed: [{ string: 'a' }, { string: 'b' }, { string: 'c' }] } });
            assertThrows(() => componentTupleDeep.value.default.shift(),      'shift not allowed on complex component value array');
            assertThrows(() => componentTupleDeep.value.default.unshift(),    'unshift not allowed on complex component value array');
            assertThrows(() => componentTupleDeep.value.default.splice(),     'splice not allowed on complex component value array');
            assertThrows(() => componentTupleDeep.value.default.sort(),       'sort not allowed on complex component value array');
            assertThrows(() => componentTupleDeep.value.default.reverse(),    'reverse not allowed on complex component value array');
            assertThrows(() => componentTupleDeep.value.default.copyWithin(), 'copyWithin not allowed on complex component value array');

            assertThrows(() => componentTupleDeep.value.reference.shift(),      'shift not allowed on complex component value array');
            assertThrows(() => componentTupleDeep.value.reference.unshift(),    'unshift not allowed on complex component value array');
            assertThrows(() => componentTupleDeep.value.reference.splice(),     'splice not allowed on complex component value array');
            assertThrows(() => componentTupleDeep.value.reference.sort(),       'sort not allowed on complex component value array');
            assertThrows(() => componentTupleDeep.value.reference.reverse(),    'reverse not allowed on complex component value array');
            assertThrows(() => componentTupleDeep.value.reference.copyWithin(), 'copyWithin not allowed on complex component value array');
        });

        it('should throw when trying to set a symbol property on complex array values', () => {
            const componentDefault   = stage.createComponent({ entity: entityA, type: 'complexArrayDefault', value: ['a', 'b', 'c'] });
            assertThrows(() => componentDefault.value[Symbol('a')] = 'a', 'symbol properties not allowed on complex component value array');

            const componentReference = stage.createComponent({ entity: entityA, type: 'complexArrayReference', value: ['a', 'b', 'c'] });
            assertThrows(() => componentReference.value[Symbol('a')] = 'a', 'symbol properties not allowed on complex component value array');

            const componentObserved = stage.createComponent({ entity: entityA, type: 'complexArrayObserved', value: [{ string: 'a' }, { string: 'b' }, { string: 'c' }] });
            assertThrows(() => componentObserved.value[Symbol('a')] = 'a', 'symbol properties not allowed on complex component value array');

            const componentDeep = stage.createComponent({ entity: entityA, type: 'complexArrayDeep', value: { default: ['a', 'b', 'c'], reference: ['a', 'b', 'c'], observed: [{ string: 'a' }, { string: 'b' }, { string: 'c' }] } });
            assertThrows(() => componentDeep.value.default[Symbol('a')] = 'a', 'symbol properties not allowed on complex component value array');
            assertThrows(() => componentDeep.value.reference[Symbol('a')] = 'a', 'symbol properties not allowed on complex component value array');
            assertThrows(() => componentDeep.value.observed[Symbol('a')] = 'a', 'symbol properties not allowed on complex component value array');

            const componentTupleDefault   = stage.createComponent({ entity: entityA, type: 'complexTupleDefault', value: ['a', 'b', 'c'] });
            assertThrows(() => componentTupleDefault.value[Symbol('a')] = 'a', 'symbol properties not allowed on complex component value array');

            const componentTupleReference = stage.createComponent({ entity: entityA, type: 'complexTupleReference', value: ['a', 'b', 'c'] });
            assertThrows(() => componentTupleReference.value[Symbol('a')] = 'a', 'symbol properties not allowed on complex component value array');

            const componentTupleObserved = stage.createComponent({ entity: entityA  , type: 'complexTupleObserved', value: [{ string: 'a' }, { string: 'b' }, { string: 'c' }] });
            assertThrows(() => componentTupleObserved.value[Symbol('a')] = 'a', 'symbol properties not allowed on complex component value array');

            const componentTupleDeep = stage.createComponent({ entity: entityA, type: 'complexTupleDeep', value: { default: ['a', 'b', 'c'], reference: ['a', 'b', 'c'], observed: [{ string: 'a' }, { string: 'b' }, { string: 'c' }] } });
            assertThrows(() => componentTupleDeep.value.default[Symbol('a')] = 'a', 'symbol properties not allowed on complex component value array');
            assertThrows(() => componentTupleDeep.value.reference[Symbol('a')] = 'a', 'symbol properties not allowed on complex component value array');
            assertThrows(() => componentTupleDeep.value.observed[Symbol('a')] = 'a', 'symbol properties not allowed on complex component value array');
        })

        it('should deserialized items via push', () => {
            const handler = spy();

            const componentDefault = stage.createComponent({ entity: entityA, type: 'complexArrayDefault', value: ['a', 'b', 'c'] });
            componentDefault.value.push(undefined);
            assertObjectMatch({ value: componentDefault.value }, { value: ['a', 'b', 'c', 'a'] });

            const componentReference = stage.createComponent({ entity: entityA, type: 'complexArrayReference', value: ['a', 'b', 'c'] });
            componentReference.value.push('d');
            assertExists(componentReference.references?.['/3']);

            const componentObserved = stage.createComponent({ entity: entityA, type: 'complexArrayObserved', value: [{ string: 'a' }, { string: 'b' }, { string: 'c' }] });
            componentObserved.value.push({ string: 'd' });
            componentObserved.watch('value:change:/3/string', handler);
            componentObserved.value[3].string = 'e';
            assertSpyCall(handler, 0, { args: ['d'] });

            const componentDeep = stage.createComponent({ entity: entityA, type: 'complexArrayDeep', value: { default: ['a', 'b', 'c'], reference: ['a', 'b', 'c'], observed: [{ string: 'a' }, { string: 'b' }, { string: 'c' }] } });
            componentDeep.value.default.push(undefined);
            assertObjectMatch({ value: componentDeep.value.default }, { value: ['a', 'b', 'c', 'a'] });

            componentDeep.value.reference.push('d');
            assertExists(componentDeep.references?.['/reference/3']);

            componentDeep.value.observed.push({ string: 'd' });
            componentDeep.watch('value:change:/observed/3/string', handler);
            componentDeep.value.observed[3].string = 'e';
            assertSpyCall(handler, 1, { args: ['d'] });
        });

        it('should release references via pop', () => {
            const componentReference = stage.createComponent({ entity: entityA, type: 'complexArrayReference', value: ['a', 'b', 'c'] });
            componentReference.value.pop();
            assertEquals(componentReference.references?.['/2'], undefined);
        });

        it('should release references when setting array length to remove items', () => {
            const componentReference = stage.createComponent({ entity: entityA, type: 'complexArrayReference', value: ['a', 'b', 'c'] });
            componentReference.value.length = 1;
            assertEquals(componentReference.references?.['/1'], undefined);
            assertEquals(componentReference.references?.['/2'], undefined);
        });

        it('should not throw when popping an empty array if schema has no references', () => {
            const componentNoReference = stage.createComponent({ entity: entityA, type: 'complexNoReference', value: ['a'] });
            componentNoReference.value.pop();
        });

        it('should not throw when setting array length if schema has no references', () => {
            const componentNoReference = stage.createComponent({ entity: entityA, type: 'complexNoReference', value: ['a'] });
            componentNoReference.value.length = 0;
        });
    });
});
