import { describe, it, expect, sinon, beforeEach, afterEach } from 'bdd';

import { Game, Stage, ComponentReference, registerSchema, unregisterSchema, UUID, registerLoader, AssetReference, unregisterLoader } from '../ecs.js';

/**
 * @import { Component } from '../ecs.js';
 */

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
            expect(componentObject.value).to.equal(refObject);

            const refArray       = ['a', 'b', 'c'];
            const componentArray = stage.createComponent({ entity: entityA, type: 'simpleArray', value: refArray });
            expect(componentArray.value).to.equal(refArray);

            const refTuple       = ['a', 1, true];
            const componentTuple = stage.createComponent({ entity: entityA, type: 'simpleTuple', value: refTuple });
            expect(componentTuple.value).to.equal(refTuple);

            const refObjectDeep       = { object: { string: 'a', number: 1, boolean: true }, array: ['a', 'b', 'c'], tuple: ['a', 1, true] };
            const componentObjectDeep = stage.createComponent({ entity: entityA, type: 'simpleObjectDeep', value: refObjectDeep });
            expect(componentObjectDeep.value).to.equal(refObjectDeep);

            const refArrayDeep       = [[{ string: 'a', number: 1, boolean: true }], [{ string: 'b', number: 2, boolean: false }]];
            const componentArrayDeep = stage.createComponent({ entity: entityA, type: 'simpleArrayDeep', value: refArrayDeep });
            expect(componentArrayDeep.value).to.equal(refArrayDeep);

            const refTupleDeep       = [[{ string: 'a', number: 1, boolean: true }], [{ string: 'b', number: 2, boolean: false }]];
            const componentTupleDeep = stage.createComponent({ entity: entityA, type: 'simpleTupleDeep', value: refTupleDeep });
            expect(componentTupleDeep.value).to.equal(refTupleDeep);
        });

        it('should fire value:change:/ when root object is set', () => {
            const handler = sinon.spy();

            const componentObject = stage.createComponent({ entity: entityA, type: 'simpleObject' });
            componentObject.watch('value:change:/', handler);
            componentObject.value = { string: 'a', number: 1, boolean: true };
            expect(handler).to.have.callCount(1);

            const componentArray = stage.createComponent({ entity: entityA, type: 'simpleArray' });
            componentArray.watch('value:change:/', handler);
            componentArray.value = ['a', 'b', 'c'];
            expect(handler).to.have.callCount(2);

            const componentTuple = stage.createComponent({ entity: entityA, type: 'simpleTuple' });
            componentTuple.watch('value:change:/', handler);
            componentTuple.value = ['a', 1, true];
            expect(handler).to.have.callCount(3);

            const componentObjectDeep = stage.createComponent({ entity: entityA, type: 'simpleObjectDeep' });
            componentObjectDeep.watch('value:change:/', handler);
            componentObjectDeep.value = { object: { string: 'a', number: 1, boolean: true }, array: ['a', 'b', 'c'], tuple: ['a', 1, true] };
            expect(handler).to.have.callCount(4);

            const componentArrayDeep = stage.createComponent({ entity: entityA, type: 'simpleArrayDeep' });
            componentArrayDeep.watch('value:change:/', handler);
            componentArrayDeep.value = [[{ string: 'a', number: 1, boolean: true }], [{ string: 'b', number: 2, boolean: false }]];
            expect(handler).to.have.callCount(5);

            const componentTupleDeep = stage.createComponent({ entity: entityA, type: 'simpleTupleDeep' });
            componentTupleDeep.watch('value:change:/', handler);
            componentTupleDeep.value = [[{ string: 'a', number: 1, boolean: true }], [{ string: 'b', number: 2, boolean: false }]];
            expect(handler).to.have.callCount(6);
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
            expect(componentString.toJSON().value).to.deep.equal('a');

            const componentNumber = stage.createComponent({ entity: entityA, type: 'number', value: 1 });
            expect(componentNumber.toJSON().value).to.deep.equal(1);

            const componentBoolean = stage.createComponent({ entity: entityA, type: 'boolean', value: true });
            expect(componentBoolean.toJSON().value).to.deep.equal(true);

            const componentObject = stage.createComponent({ entity: entityA, type: 'object', value: { string: 'a', number: 1, boolean: true } });
            expect(componentObject.toJSON().value).to.deep.equal({ string: 'a', number: 1, boolean: true });

            const componentArray = stage.createComponent({ entity: entityA, type: 'array', value: ['a', 'b', 'c'] });
            expect(componentArray.toJSON().value).to.deep.equal(['a', 'b', 'c']);

            const componentTuple = stage.createComponent({ entity: entityA, type: 'tuple', value: ['a', 1, true] });
            expect(componentTuple.toJSON().value).to.deep.equal(['a', 1, true]);

            const componentObjectDeep = stage.createComponent({ entity: entityA, type: 'objectDeep', value: { object: { string: 'a', number: 1, boolean: true }, array: ['a', 'b', 'c'], tuple: ['a', 1, true] } });
            expect(componentObjectDeep.toJSON().value).to.deep.equal({ object: { string: 'a', number: 1, boolean: true }, array: ['a', 'b', 'c'], tuple: ['a', 1, true] });

            const componentArrayDeep = stage.createComponent({ entity: entityA, type: 'arrayDeep', value: [[{ string: 'a', number: 1, boolean: true }], [{ string: 'b', number: 2, boolean: false }]] });
            expect(componentArrayDeep.toJSON().value).to.deep.equal([[{ string: 'a', number: 1, boolean: true }], [{ string: 'b', number: 2, boolean: false }]]);
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
            expect(defaultString.value).to.equal('a');

            const defaultNumber = stage.createComponent({ entity: entityA, type: 'defaultNumber' });
            expect(defaultNumber.value).to.equal(1);

            const defaultBoolean = stage.createComponent({ entity: entityA, type: 'defaultBoolean' });
            expect(defaultBoolean.value).to.equal(true);

            const defaultObject = stage.createComponent({ entity: entityA, type: 'defaultObject' });
            expect({ value: defaultObject.value }).to.deep.include({ value: { string: 'a', number: 1, boolean: true } });

            const defaultArray = stage.createComponent({ entity: entityA, type: 'defaultArray' });
            expect({ value: defaultArray.value }).to.deep.include({ value: ['a', 'b', 'c'] });

            const defaultTuple = stage.createComponent({ entity: entityA, type: 'defaultTuple' });
            expect({ value: defaultTuple.value }).to.deep.include({ value: ['a', 1, true] });

            const defaultObjectDeep = stage.createComponent({ entity: entityA, type: 'defaultObjectDeep', value: {} });
            expect(JSON.parse(JSON.stringify({ value: defaultObjectDeep.value }))).to.deep.include({ value: { object: { string: 'a', number: 1, boolean: true }, array: ['a', 'b', 'c'], tuple: ['a', 1, true] } });

            const defaultArrayDeep = stage.createComponent({ entity: entityA, type: 'defaultArrayDeep', value: [[{}]] });
            expect(JSON.parse(JSON.stringify({ value: defaultArrayDeep.value }))).to.deep.include({ value: [[{ string: 'a', number: 1, boolean: true }]] });

            const defaultTupleDeep = stage.createComponent({ entity: entityA, type: 'defaultTupleDeep', value: [[]] });
            expect(JSON.parse(JSON.stringify({ value: defaultTupleDeep.value }))).to.deep.include({ value: [['a', 1, true]] });
        });

        it('should reset the default value when setting to undefined', () => {
            const defaultString = stage.createComponent({ entity: entityA, type: 'defaultString' });
            defaultString.value = undefined;
            expect(defaultString.value).to.equal('a');

            const defaultNumber = stage.createComponent({ entity: entityA, type: 'defaultNumber' });
            defaultNumber.value = undefined;
            expect(defaultNumber.value).to.equal(1);

            const defaultBoolean = stage.createComponent({ entity: entityA, type: 'defaultBoolean' });
            defaultBoolean.value = undefined;
            expect(defaultBoolean.value).to.equal(true);

            const defaultObject = stage.createComponent({ entity: entityA, type: 'defaultObject' });
            defaultObject.value = undefined;
            expect({ value: defaultObject.value }).to.deep.include({ value: { string: 'a', number: 1, boolean: true } });

            const defaultArray = stage.createComponent({ entity: entityA, type: 'defaultArray' });
            defaultArray.value = undefined;
            expect({ value: defaultArray.value }).to.deep.include({ value: ['a', 'b', 'c'] });

            const defaultTuple = stage.createComponent({ entity: entityA, type: 'defaultTuple' });
            defaultTuple.value = undefined;
            expect({ value: defaultTuple.value }).to.deep.include({ value: ['a', 1, true] });

            const defaultObjectDeep = stage.createComponent({ entity: entityA, type: 'defaultObjectDeep', value: {} });
            defaultObjectDeep.value.object = undefined;
            defaultObjectDeep.value.array  = undefined;
            defaultObjectDeep.value.tuple  = undefined;
            expect(JSON.parse(JSON.stringify({ value: defaultObjectDeep.value }))).to.deep.include({ value: { object: { string: 'a', number: 1, boolean: true }, array: ['a', 'b', 'c'], tuple: ['a', 1, true] } });

            const defaultArrayDeep = stage.createComponent({ entity: entityA, type: 'defaultArrayDeep', value: [[{}]] });
            defaultArrayDeep.value[0][0].string  = undefined;
            defaultArrayDeep.value[0][0].number  = undefined;
            defaultArrayDeep.value[0][0].boolean = undefined;
            expect(JSON.parse(JSON.stringify({ value: defaultArrayDeep.value }))).to.deep.include({ value: [[{ string: 'a', number: 1, boolean: true }]] });

            const defaultTupleDeep = stage.createComponent({ entity: entityA, type: 'defaultTupleDeep', value: [[]] });
            defaultTupleDeep.value[0][0] = undefined;
            defaultTupleDeep.value[0][1] = undefined;
            defaultTupleDeep.value[0][2] = undefined;
            expect(JSON.parse(JSON.stringify({ value: defaultTupleDeep.value }))).to.deep.include({ value: [['a', 1, true]] });
        });

        describe('toJSON', () => {
            it('should strip default values', () => {
                const defaultString = stage.createComponent({ entity: entityA, type: 'defaultString' });
                expect(defaultString.toJSON().value).not.to.exist;

                const defaultNumber = stage.createComponent({ entity: entityA, type: 'defaultNumber' });
                expect(defaultNumber.toJSON().value).not.to.exist;

                const defaultBoolean = stage.createComponent({ entity: entityA, type: 'defaultBoolean' });
                expect(defaultBoolean.toJSON().value).not.to.exist;

                const defaultObject = stage.createComponent({ entity: entityA, type: 'defaultObject', value: { string: 'a', number: 1, boolean: true } });
                expect(defaultObject.toJSON().value).not.to.exist;

                const defaultArray = stage.createComponent({ entity: entityA, type: 'defaultArray' });
                expect(defaultArray.toJSON().value).not.to.exist;

                const defaultTuple = stage.createComponent({ entity: entityA, type: 'defaultTuple' });
                expect(defaultTuple.toJSON().value).not.to.exist;

                const defaultObjectDeep = stage.createComponent({ entity: entityA, type: 'defaultObjectDeep', value: { object: { string: 'a', number: 1, boolean: true }, array: ['a', 'b', 'c'], tuple: ['a', 1, true] } });
                expect(defaultObjectDeep.toJSON().value.object).not.to.exist;
                expect(defaultObjectDeep.toJSON().value.array).not.to.exist;
                expect(defaultObjectDeep.toJSON().value.tuple).not.to.exist;

                const defaultArrayDeep = stage.createComponent({ entity: entityA, type: 'defaultArrayDeep', value: [[{}]] });
                expect(defaultArrayDeep.toJSON().value).to.deep.equal([[{}]]);

                const defaultTupleDeep = stage.createComponent({ entity: entityA, type: 'defaultTupleDeep', value: [[]] });
                expect(defaultTupleDeep.toJSON().value).to.deep.equal([[]]);
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
            const handler = sinon.spy();

            const componentObject = stage.createComponent({ entity: entityA, type: 'observedObject', value: { string: 'a', number: 1, boolean: true } });
            componentObject.watch('value:change:/string',  handler);
            componentObject.watch('value:change:/number',  handler);
            componentObject.watch('value:change:/boolean', handler);

            componentObject.value.string = 'b';
            expect(handler.getCall(0).args[0]).to.equal('a');

            componentObject.value.number = 2;
            expect(handler.getCall(1).args[0]).to.equal(1);

            componentObject.value.boolean = false;
            expect(handler.getCall(2).args[0]).to.equal(true);

            const componentArray = stage.createComponent({ entity: entityA, type: 'observedArray', value: [{ string: 'a', number: 1, boolean: true }] });
            componentArray.watch('value:change:/0/string',  handler);
            componentArray.watch('value:change:/0/number',  handler);
            componentArray.watch('value:change:/0/boolean', handler);

            componentArray.value[0].string = 'b';
            expect(handler.getCall(3).args[0]).to.equal('a');

            componentArray.value[0].number = 2;
            expect(handler.getCall(4).args[0]).to.equal(1);

            componentArray.value[0].boolean = false;
            expect(handler.getCall(5).args[0]).to.equal(true);

            const componentTuple = stage.createComponent({ entity: entityA, type: 'observedTuple', value: [{ string: 'a' }, { number: 1 }, { boolean: true }] });
            componentTuple.watch('value:change:/0/string',  handler);
            componentTuple.watch('value:change:/1/number',  handler);
            componentTuple.watch('value:change:/2/boolean', handler);

            componentTuple.value[0].string = 'b';
            expect(handler.getCall(6).args[0]).to.equal('a');

            componentTuple.value[1].number = 2;
            expect(handler.getCall(7).args[0]).to.equal(1);

            componentTuple.value[2].boolean = false;
            expect(handler.getCall(8).args[0]).to.equal(true);

            const componentDeep = stage.createComponent({ entity: entityA, type: 'observedDeep', value: [[[{ string: 'a', number: 1, boolean: true, object: { string: 'a' } }]]] });
            componentDeep.watch('value:change:/0/0/0/string',  handler);
            componentDeep.watch('value:change:/0/0/0/number',  handler);
            componentDeep.watch('value:change:/0/0/0/boolean', handler);
            componentDeep.watch('value:change:/0/0/0/object/string', handler);

            componentDeep.value[0][0][0].string = 'b';
            expect(handler.getCall(9).args[0]).to.equal('a');

            componentDeep.value[0][0][0].number = 2;
            expect(handler.getCall(10).args[0]).to.equal(1);

            componentDeep.value[0][0][0].boolean = false;
            expect(handler.getCall(11).args[0]).to.equal(true);
        });

        it('should fire value:change:${prop} when parent value is set', () => {
            const handler = sinon.spy();

            const componentObject = stage.createComponent({ entity: entityA, type: 'observedObject', value: { string: 'a', number: 1, boolean: true } });
            componentObject.watch('value:change:/string',  handler);
            componentObject.watch('value:change:/number',  handler);
            componentObject.watch('value:change:/boolean', handler);

            componentObject.value = { string: 'b', number: 2, boolean: false };
            expect(handler.getCall(0).args[0]).to.equal('a');
            expect(handler.getCall(1).args[0]).to.equal(1);
            expect(handler.getCall(2).args[0]).to.equal(true);

            const componentArray = stage.createComponent({ entity: entityA, type: 'observedArray', value: [{ string: 'a', number: 1, boolean: true }] });
            componentArray.watch('value:change:/0/string',  handler);
            componentArray.watch('value:change:/0/number',  handler);
            componentArray.watch('value:change:/0/boolean', handler);

            componentArray.value[0] = { string: 'b', number: 2, boolean: false };
            expect(handler.getCall(3).args[0]).to.equal('a');
            expect(handler.getCall(4).args[0]).to.equal(1);
            expect(handler.getCall(5).args[0]).to.equal(true);

            const componentTuple = stage.createComponent({ entity: entityA, type: 'observedTuple', value: [{ string: 'a' }, { number: 1 }, { boolean: true }] });
            componentTuple.watch('value:change:/0/string',  handler);
            componentTuple.watch('value:change:/1/number',  handler);
            componentTuple.watch('value:change:/2/boolean', handler);

            componentTuple.value = [{ string: 'b' }, { number: 2 }, { boolean: false }];
            expect(handler.getCall(6).args[0]).to.equal('a');
            expect(handler.getCall(7).args[0]).to.equal(1);
            expect(handler.getCall(8).args[0]).to.equal(true);

            const componentDeep = stage.createComponent({ entity: entityA, type: 'observedDeep', value: [[[{ string: 'a', number: 1, boolean: true, object: { string: 'a' } }]]] });
            componentDeep.watch('value:change:/0/0/0/string',  handler);
            componentDeep.watch('value:change:/0/0/0/number',  handler);
            componentDeep.watch('value:change:/0/0/0/boolean', handler);
            componentDeep.watch('value:change:/0/0/0/object/string', handler);

            componentDeep.value = [[[{ string: 'b', number: 2, boolean: false, object: { string: 'b' } }]]];
            expect(handler.getCall(9).args[0]).to.equal('a');
            expect(handler.getCall(10).args[0]).to.equal(1);
            expect(handler.getCall(11).args[0]).to.equal(true);
        });

        it('should not fire value:change:${prop} when an observed property is set to the same value', () => {
            const handler = sinon.spy();

            const componentObject = stage.createComponent({ entity: entityA, type: 'observedObject', value: { string: 'a', number: 1, boolean: true } });
            componentObject.watch('value:change:/string',  handler);
            componentObject.watch('value:change:/number',  handler);
            componentObject.watch('value:change:/boolean', handler);

            componentObject.value.string = 'a';
            expect(handler).not.to.have.been.called;

            componentObject.value.number = 1;
            expect(handler).not.to.have.been.called;

            componentObject.value.boolean = true;
            expect(handler).not.to.have.been.called;

            const componentArray = stage.createComponent({ entity: entityA, type: 'observedArray', value: [{ string: 'a', number: 1, boolean: true }] });
            componentArray.watch('value:change:/0/string',  handler);
            componentArray.watch('value:change:/0/number',  handler);
            componentArray.watch('value:change:/0/boolean', handler);

            componentArray.value[0].string = 'a';
            expect(handler).not.to.have.been.called;

            componentArray.value[0].number = 1;
            expect(handler).not.to.have.been.called;

            componentArray.value[0].boolean = true;
            expect(handler).not.to.have.been.called;

            const componentTuple = stage.createComponent({ entity: entityA, type: 'observedTuple', value: [{ string: 'a' }, { number: 1 }, { boolean: true }] });
            componentTuple.watch('value:change:/0/string',  handler);
            componentTuple.watch('value:change:/1/number',  handler);
            componentTuple.watch('value:change:/2/boolean', handler);

            componentTuple.value[0].string = 'a';
            expect(handler).not.to.have.been.called;

            componentTuple.value[1].number = 1;
            expect(handler).not.to.have.been.called;

            componentTuple.value[2].boolean = true;
            expect(handler).not.to.have.been.called;

            const componentDeep = stage.createComponent({ entity: entityA, type: 'observedDeep', value: [[[{ string: 'a', number: 1, boolean: true, object: { string: 'a' } }]]] });
            componentDeep.watch('value:change:/0/0/0/string',  handler);
            componentDeep.watch('value:change:/0/0/0/number',  handler);
            componentDeep.watch('value:change:/0/0/0/boolean', handler);
            componentDeep.watch('value:change:/0/0/0/object/string', handler);

            componentDeep.value[0][0][0].string = 'a';
            expect(handler).not.to.have.been.called;

            componentDeep.value[0][0][0].number = 1;
            expect(handler).not.to.have.been.called;

            componentDeep.value[0][0][0].boolean = true;
            expect(handler).not.to.have.been.called;
        });

        it('should not fire value:change:${prop} when parent value is set to same value', () => {
            const handler = sinon.spy();

            const componentObject = stage.createComponent({ entity: entityA, type: 'observedObject', value: { string: 'a', number: 1, boolean: true } });
            componentObject.watch('value:change:/string',  handler);
            componentObject.watch('value:change:/number',  handler);
            componentObject.watch('value:change:/boolean', handler);

            componentObject.value = { string: 'a', number: 1, boolean: true };
            expect(handler).not.to.have.been.called;
            expect(handler).not.to.have.been.called;
            expect(handler).not.to.have.been.called;

            const componentArray = stage.createComponent({ entity: entityA, type: 'observedArray', value: [{ string: 'a', number: 1, boolean: true }] });
            componentArray.watch('value:change:/0/string',  handler);
            componentArray.watch('value:change:/0/number',  handler);
            componentArray.watch('value:change:/0/boolean', handler);

            componentArray.value[0] = { string: 'a', number: 1, boolean: true };
            expect(handler).not.to.have.been.called;
            expect(handler).not.to.have.been.called;
            expect(handler).not.to.have.been.called;

            const componentTuple = stage.createComponent({ entity: entityA, type: 'observedTuple', value: [{ string: 'a' }, { number: 1 }, { boolean: true }] });
            componentTuple.watch('value:change:/0/string',  handler);
            componentTuple.watch('value:change:/1/number',  handler);
            componentTuple.watch('value:change:/2/boolean', handler);

            componentTuple.value = [{ string: 'a' }, { number: 1 }, { boolean: true }];
            expect(handler).not.to.have.been.called;
            expect(handler).not.to.have.been.called;
            expect(handler).not.to.have.been.called;

            const componentDeep = stage.createComponent({ entity: entityA, type: 'observedDeep', value: [[[{ string: 'a', number: 1, boolean: true, object: { string: 'a' } }]]] });
            componentDeep.watch('value:change:/0/0/0/string',  handler);
            componentDeep.watch('value:change:/0/0/0/number',  handler);
            componentDeep.watch('value:change:/0/0/0/boolean', handler);
            componentDeep.watch('value:change:/0/0/0/object/string', handler);

            componentDeep.value = [[[{ string: 'a', number: 1, boolean: true, object: { string: 'a' } }]]];
            expect(handler).not.to.have.been.called;
            expect(handler).not.to.have.been.called;
            expect(handler).not.to.have.been.called;
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
            expect(JSON.parse(JSON.stringify({ value: componentObject.value }))).to.deep.include({ value: { string: 'a', number: 1 } });
        });

        it('should fire value:change:/ when root value changes and include additional properties in original value', () => {
            const handler = sinon.spy();

            const componentObject = stage.createComponent({ entity: entityA, type: 'additionalObject', value: { string: 'a', number: 1 } });
            componentObject.watch('value:change:/', handler);

            componentObject.value = { string: 'b', number: 2 };
            expect(handler).to.have.been.calledOnceWith({ string: 'a', number: 1 });
        });

        it('should not fire value:change:/ when root value is set with the same value including additional properties', () => {
            const handler = sinon.spy();

            const componentObject = stage.createComponent({ entity: entityA, type: 'additionalObject', value: { string: 'a', number: 1 } });
            componentObject.watch('value:change:/', handler);

            componentObject.value = { string: 'a', number: 1 };
            expect(handler).not.to.have.been.called;
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
                expect([...stage.references.components.find({ entity: entityB, type: 'a' })].length).to.equal(5);
            });

            it('should add a ComponentReference to the component for the defined type', () => {
                expect(componentSimple.references?.['/']).to.be.instanceOf(ComponentReference);
                expect(componentObject.references?.['/a']).to.be.instanceOf(ComponentReference);
                expect(componentArray.references?.['/0']).to.be.instanceOf(ComponentReference);
                expect(componentTuple.references?.['/0']).to.be.instanceOf(ComponentReference);
                expect(componentDeep.references?.['/a/b']).to.be.instanceOf(ComponentReference);
            });

            it('should release a ComponentReference when the reference value or property changes', () => {
                componentSimple.value = UUID();
                expect([...stage.references.components.find({ entity: entityB, type: 'a' })].length).to.equal(4);
                componentObject.value.a = UUID();
                expect([...stage.references.components.find({ entity: entityB, type: 'a' })].length).to.equal(3);
                componentArray.value[0] = UUID();
                expect([...stage.references.components.find({ entity: entityB, type: 'a' })].length).to.equal(2);
                componentTuple.value[0] = UUID();
                expect([...stage.references.components.find({ entity: entityB, type: 'a' })].length).to.equal(1);
                componentDeep.value.a.b = UUID();
                expect([...stage.references.components.find({ entity: entityB, type: 'a' })].length).to.equal(0);
            });

            it('should release a deeply nested ComponentReference when the value or parent reference property changes', () => {
                componentDeep.value = { a: { b: entityA } };
                expect([...stage.references.components.find({ entity: entityB, type: 'a' })].length).to.equal(4);
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
                registerLoader('a', (/** @type {string} */uri) => Promise.resolve({ uri, type: 'a' }));

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
                expect([...stage.references.assets.find({ uri: JSON_DATA_URI_B, type: 'a' })].length).to.equal(5);
            });

            it('should add an AssetReference to the component for the defined type', () => {
                expect(assetSimple.references?.['/']).to.be.instanceOf(AssetReference);
                expect(assetObject.references?.['/a']).to.be.instanceOf(AssetReference);
                expect(assetArray.references?.['/0']).to.be.instanceOf(AssetReference);
                expect(assetTuple.references?.['/0']).to.be.instanceOf(AssetReference);
                expect(assetDeep.references?.['/a/b']).to.be.instanceOf(AssetReference);
            });

            it('should release an AssetReference when the reference value or property changes', () => {
                assetSimple.value = JSON_DATA_URI_A;
                expect([...stage.references.assets.find({ uri: JSON_DATA_URI_B, type: 'a' })].length).to.equal(4);
                assetObject.value.a = JSON_DATA_URI_A;
                expect([...stage.references.assets.find({ uri: JSON_DATA_URI_B, type: 'a' })].length).to.equal(3);
                assetArray.value[0] = JSON_DATA_URI_A;
                expect([...stage.references.assets.find({ uri: JSON_DATA_URI_B, type: 'a' })].length).to.equal(2);
                assetTuple.value[0] = JSON_DATA_URI_A;
                expect([...stage.references.assets.find({ uri: JSON_DATA_URI_B, type: 'a' })].length).to.equal(1);
                assetDeep.value.a.b = JSON_DATA_URI_A;
                expect([...stage.references.assets.find({ uri: JSON_DATA_URI_B, type: 'a' })].length).to.equal(0);
            });

            it('should release a deeply nested AssetReference when the value or parent reference property changes', () => {
                assetDeep.value = { a: { b: JSON_DATA_URI_A } };
                expect([...stage.references.assets.find({ uri: JSON_DATA_URI_B, type: 'a' })].length).to.equal(4);
            });

            it('should not release an AssetReference when the reference value is set to the same value', () => {
                const handler = sinon.spy();

                /**  @type {AssetReference}*/(assetSimple.references?.['/'])?.watch('release', handler);
                assetSimple.value = JSON_DATA_URI_B;
                expect(handler).not.to.have.been.called;

                /**  @type {AssetReference}*/(assetObject.references?.['/a'])?.watch('release', handler);
                assetObject.value.a = JSON_DATA_URI_B;
                expect(handler).not.to.have.been.called;

                /**  @type {AssetReference}*/(assetArray.references?.['/0'])?.watch('release', handler);
                assetArray.value[0] = JSON_DATA_URI_B;
                expect(handler).not.to.have.been.called;

                /**  @type {AssetReference}*/(assetTuple.references?.['/0'])?.watch('release', handler);
                assetTuple.value[0] = JSON_DATA_URI_B;
                expect(handler).not.to.have.been.called;

                /**  @type {AssetReference}*/(assetDeep.references?.['/a/b'])?.watch('release', handler);
                assetDeep.value.a.b = JSON_DATA_URI_B;
                expect(handler).not.to.have.been.called;
            });

            it('should not release a deeply nested AssetReference when the value or parent reference is set to the same value', () => {
                const handler = sinon.spy();

                /**  @type {AssetReference}*/(assetDeep.references?.['/a/b'])?.watch('release', handler);
                assetDeep.value = { a: { b: JSON_DATA_URI_B } };
                expect(handler).not.to.have.been.called;
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
            expect(() => componentDefault.value.shift()).to.throw('shift not allowed on complex component value array');
            expect(() => componentDefault.value.unshift()).to.throw('unshift not allowed on complex component value array');
            expect(() => componentDefault.value.splice()).to.throw('splice not allowed on complex component value array');
            expect(() => componentDefault.value.sort()).to.throw('sort not allowed on complex component value array');
            expect(() => componentDefault.value.reverse()).to.throw('reverse not allowed on complex component value array');
            expect(() => componentDefault.value.copyWithin()).to.throw('copyWithin not allowed on complex component value array');


            const componentReference = stage.createComponent({ entity: entityA, type: 'complexArrayReference', value: ['a', 'b', 'c'] });
            expect(() => componentReference.value.shift()).to.throw('shift not allowed on complex component value array');
            expect(() => componentReference.value.unshift()).to.throw('unshift not allowed on complex component value array');
            expect(() => componentReference.value.splice()).to.throw('splice not allowed on complex component value array');
            expect(() => componentReference.value.sort()).to.throw('sort not allowed on complex component value array');
            expect(() => componentReference.value.reverse()).to.throw('reverse not allowed on complex component value array');
            expect(() => componentReference.value.copyWithin()).to.throw('copyWithin not allowed on complex component value array');

            const componentObserved = stage.createComponent({ entity: entityA, type: 'complexArrayObserved', value: [{ string: 'a' }, { string: 'b' }, { string: 'c' }] });
            expect(() => componentObserved.value.shift()).to.throw('shift not allowed on complex component value array');
            expect(() => componentObserved.value.unshift()).to.throw('unshift not allowed on complex component value array');
            expect(() => componentObserved.value.splice()).to.throw('splice not allowed on complex component value array');
            expect(() => componentObserved.value.sort()).to.throw('sort not allowed on complex component value array');
            expect(() => componentObserved.value.reverse()).to.throw('reverse not allowed on complex component value array');
            expect(() => componentObserved.value.copyWithin()).to.throw('copyWithin not allowed on complex component value array');

            const componentDeep = stage.createComponent({ entity: entityA, type: 'complexArrayDeep', value: { default: ['a', 'b', 'c'], reference: ['a', 'b', 'c'], observed: [{ string: 'a' }, { string: 'b' }, { string: 'c' }] } });
            expect(() => componentDeep.value.default.shift()).to.throw('shift not allowed on complex component value array');
            expect(() => componentDeep.value.default.unshift()).to.throw('unshift not allowed on complex component value array');
            expect(() => componentDeep.value.default.splice()).to.throw('splice not allowed on complex component value array');
            expect(() => componentDeep.value.default.sort()).to.throw('sort not allowed on complex component value array');
            expect(() => componentDeep.value.default.reverse()).to.throw('reverse not allowed on complex component value array');
            expect(() => componentDeep.value.default.copyWithin()).to.throw('copyWithin not allowed on complex component value array');

            expect(() => componentDeep.value.reference.shift()).to.throw('shift not allowed on complex component value array');
            expect(() => componentDeep.value.reference.unshift()).to.throw('unshift not allowed on complex component value array');
            expect(() => componentDeep.value.reference.splice()).to.throw('splice not allowed on complex component value array');
            expect(() => componentDeep.value.reference.sort()).to.throw('sort not allowed on complex component value array');
            expect(() => componentDeep.value.reference.reverse()).to.throw('reverse not allowed on complex component value array');
            expect(() => componentDeep.value.reference.copyWithin()).to.throw('copyWithin not allowed on complex component value array');

            expect(() => componentDeep.value.observed.shift()).to.throw('shift not allowed on complex component value array');
            expect(() => componentDeep.value.observed.unshift()).to.throw('unshift not allowed on complex component value array');
            expect(() => componentDeep.value.observed.splice()).to.throw('splice not allowed on complex component value array');
            expect(() => componentDeep.value.observed.sort()).to.throw('sort not allowed on complex component value array');
            expect(() => componentDeep.value.observed.reverse()).to.throw('reverse not allowed on complex component value array');
            expect(() => componentDeep.value.observed.copyWithin()).to.throw('copyWithin not allowed on complex component value array');

            const componentTupleDefault = stage.createComponent({ entity: entityA, type: 'complexTupleDefault', value: ['a', 'b', 'c'] });
            expect(() => componentTupleDefault.value.shift()).to.throw('shift not allowed on complex component value array');
            expect(() => componentTupleDefault.value.unshift()).to.throw('unshift not allowed on complex component value array');
            expect(() => componentTupleDefault.value.splice()).to.throw('splice not allowed on complex component value array');
            expect(() => componentTupleDefault.value.sort()).to.throw('sort not allowed on complex component value array');
            expect(() => componentTupleDefault.value.reverse()).to.throw('reverse not allowed on complex component value array');
            expect(() => componentTupleDefault.value.copyWithin()).to.throw('copyWithin not allowed on complex component value array');

            const componentTupleReference = stage.createComponent({ entity: entityA, type: 'complexTupleReference', value: ['a', 'b', 'c'] });
            expect(() => componentTupleReference.value.shift()).to.throw('shift not allowed on complex component value array');
            expect(() => componentTupleReference.value.unshift()).to.throw('unshift not allowed on complex component value array');
            expect(() => componentTupleReference.value.splice()).to.throw('splice not allowed on complex component value array');
            expect(() => componentTupleReference.value.sort()).to.throw('sort not allowed on complex component value array');
            expect(() => componentTupleReference.value.reverse()).to.throw('reverse not allowed on complex component value array');
            expect(() => componentTupleReference.value.copyWithin()).to.throw('copyWithin not allowed on complex component value array');

            const componentTupleObserved = stage.createComponent({ entity: entityA, type: 'complexTupleObserved', value: [{ string: 'a' }, { string: 'b' }, { string: 'c' }] });
            expect(() => componentTupleObserved.value.shift()).to.throw('shift not allowed on complex component value array');
            expect(() => componentTupleObserved.value.unshift()).to.throw('unshift not allowed on complex component value array');
            expect(() => componentTupleObserved.value.splice()).to.throw('splice not allowed on complex component value array');
            expect(() => componentTupleObserved.value.sort()).to.throw('sort not allowed on complex component value array');
            expect(() => componentTupleObserved.value.reverse()).to.throw('reverse not allowed on complex component value array');
            expect(() => componentTupleObserved.value.copyWithin()).to.throw('copyWithin not allowed on complex component value array');

            const componentTupleDeep = stage.createComponent({ entity: entityA, type: 'complexTupleDeep', value: { default: ['a', 'b', 'c'], reference: ['a', 'b', 'c'], observed: [{ string: 'a' }, { string: 'b' }, { string: 'c' }] } });
            expect(() => componentTupleDeep.value.default.shift()).to.throw('shift not allowed on complex component value array');
            expect(() => componentTupleDeep.value.default.unshift()).to.throw('unshift not allowed on complex component value array');
            expect(() => componentTupleDeep.value.default.splice()).to.throw('splice not allowed on complex component value array');
            expect(() => componentTupleDeep.value.default.sort()).to.throw('sort not allowed on complex component value array');
            expect(() => componentTupleDeep.value.default.reverse()).to.throw('reverse not allowed on complex component value array');
            expect(() => componentTupleDeep.value.default.copyWithin()).to.throw('copyWithin not allowed on complex component value array');

            expect(() => componentTupleDeep.value.reference.shift()).to.throw('shift not allowed on complex component value array');
            expect(() => componentTupleDeep.value.reference.unshift()).to.throw('unshift not allowed on complex component value array');
            expect(() => componentTupleDeep.value.reference.splice()).to.throw('splice not allowed on complex component value array');
            expect(() => componentTupleDeep.value.reference.sort()).to.throw('sort not allowed on complex component value array');
            expect(() => componentTupleDeep.value.reference.reverse()).to.throw('reverse not allowed on complex component value array');
            expect(() => componentTupleDeep.value.reference.copyWithin()).to.throw('copyWithin not allowed on complex component value array');

            expect(() => componentTupleDeep.value.observed.shift()).to.throw('shift not allowed on complex component value array');
            expect(() => componentTupleDeep.value.observed.unshift()).to.throw('unshift not allowed on complex component value array');
            expect(() => componentTupleDeep.value.observed.splice()).to.throw('splice not allowed on complex component value array');
            expect(() => componentTupleDeep.value.observed.sort()).to.throw('sort not allowed on complex component value array');
            expect(() => componentTupleDeep.value.observed.reverse()).to.throw('reverse not allowed on complex component value array');
            expect(() => componentTupleDeep.value.observed.copyWithin()).to.throw('copyWithin not allowed on complex component value array');
        });

        it('should throw when trying to set a symbol property on complex array values', () => {
            const componentDefault   = stage.createComponent({ entity: entityA, type: 'complexArrayDefault', value: ['a', 'b', 'c'] });
            expect(() => componentDefault.value[Symbol('a')] = 'a').to.throw('Cannot set symbol properties on a complex component value array');

            const componentReference = stage.createComponent({ entity: entityA, type: 'complexArrayReference', value: ['a', 'b', 'c'] });
            expect(() => componentReference.value[Symbol('a')] = 'a').to.throw('Cannot set symbol properties on a complex component value array');

            const componentObserved = stage.createComponent({ entity: entityA, type: 'complexArrayObserved', value: [{ string: 'a' }, { string: 'b' }, { string: 'c' }] });
            expect(() => componentObserved.value[Symbol('a')] = 'a').to.throw('Cannot set symbol properties on a complex component value array');

            const componentDeep = stage.createComponent({ entity: entityA, type: 'complexArrayDeep', value: { default: ['a', 'b', 'c'], reference: ['a', 'b', 'c'], observed: [{ string: 'a' }, { string: 'b' }, { string: 'c' }] } });
            expect(() => componentDeep.value.default[Symbol('a')] = 'a').to.throw('Cannot set symbol properties on a complex component value array');
            expect(() => componentDeep.value.reference[Symbol('a')] = 'a').to.throw('Cannot set symbol properties on a complex component value array');
            expect(() => componentDeep.value.observed[Symbol('a')] = 'a').to.throw('Cannot set symbol properties on a complex component value array');

            const componentTupleDefault   = stage.createComponent({ entity: entityA, type: 'complexTupleDefault', value: ['a', 'b', 'c'] });
            expect(() => componentTupleDefault.value[Symbol('a')] = 'a').to.throw('Cannot set symbol properties on a complex component value array');

            const componentTupleReference = stage.createComponent({ entity: entityA, type: 'complexTupleReference', value: ['a', 'b', 'c'] });
            expect(() => componentTupleReference.value[Symbol('a')] = 'a').to.throw('Cannot set symbol properties on a complex component value array');

            const componentTupleObserved = stage.createComponent({ entity: entityA  , type: 'complexTupleObserved', value: [{ string: 'a' }, { string: 'b' }, { string: 'c' }] });
            expect(() => componentTupleObserved.value[Symbol('a')] = 'a').to.throw('Cannot set symbol properties on a complex component value array');

            const componentTupleDeep = stage.createComponent({ entity: entityA, type: 'complexTupleDeep', value: { default: ['a', 'b', 'c'], reference: ['a', 'b', 'c'], observed: [{ string: 'a' }, { string: 'b' }, { string: 'c' }] } });
            expect(() => componentTupleDeep.value.default[Symbol('a')] = 'a').to.throw('Cannot set symbol properties on a complex component value array');
            expect(() => componentTupleDeep.value.reference[Symbol('a')] = 'a').to.throw('Cannot set symbol properties on a complex component value array');
            expect(() => componentTupleDeep.value.observed[Symbol('a')] = 'a').to.throw('Cannot set symbol properties on a complex component value array');
        })

        it('should deserialized items via push', () => {
            const handler = sinon.spy();

            const componentDefault = stage.createComponent({ entity: entityA, type: 'complexArrayDefault', value: ['a', 'b', 'c'] });
            componentDefault.value.push(undefined);
            expect({ value: componentDefault.value }).to.deep.equal({ value: ['a', 'b', 'c', 'a'] });

            const componentReference = stage.createComponent({ entity: entityA, type: 'complexArrayReference', value: ['a', 'b', 'c'] });
            componentReference.value.push('d');
            expect(componentReference.references?.['/3']).to.exist;

            const componentObserved = stage.createComponent({ entity: entityA, type: 'complexArrayObserved', value: [{ string: 'a' }, { string: 'b' }, { string: 'c' }] });
            componentObserved.value.push({ string: 'd' });
            componentObserved.watch('value:change:/3/string', handler);
            componentObserved.value[3].string = 'e';
            expect(handler.getCall(0).args[0]).to.equal('d');

            const componentDeep = stage.createComponent({ entity: entityA, type: 'complexArrayDeep', value: { default: ['a', 'b', 'c'], reference: ['a', 'b', 'c'], observed: [{ string: 'a' }, { string: 'b' }, { string: 'c' }] } });
            componentDeep.value.default.push(undefined);
            expect({ value: componentDeep.value.default }).to.deep.equal({ value: ['a', 'b', 'c', 'a'] });

            componentDeep.value.reference.push('d');
            expect(componentDeep.references?.['/reference/3']).to.exist;

            componentDeep.value.observed.push({ string: 'd' });
            componentDeep.watch('value:change:/observed/3/string', handler);
            componentDeep.value.observed[3].string = 'e';
            expect(handler.getCall(1).args[0]).to.equal('d');
        });

        it('should release references via pop', () => {
            const componentReference = stage.createComponent({ entity: entityA, type: 'complexArrayReference', value: ['a', 'b', 'c'] });
            componentReference.value.pop();
            expect(componentReference.references?.['/2']).not.to.exist;
        });

        it('should release references when setting array length to remove items', () => {
            const componentReference = stage.createComponent({ entity: entityA, type: 'complexArrayReference', value: ['a', 'b', 'c'] });
            componentReference.value.length = 1;
            expect(componentReference.references?.['/1']).not.to.exist;
            expect(componentReference.references?.['/2']).not.to.exist;
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
