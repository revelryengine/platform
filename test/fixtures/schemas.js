/// <reference path="./lib.ecs.d.ts" />

/**
 * @import { ComponentTypeSchema } from '../../lib/ecs.js'
 */

export const a = /** @type {const} @satisfies {ComponentTypeSchema} */({ type: 'string',  default: 'a' });

export const b = /** @type {const} @satisfies {ComponentTypeSchema} */({ type: 'number',  default: 123, enum: [123, 456, 789] });

export const c = /** @type {const} @satisfies {ComponentTypeSchema} */({ type: 'boolean', default: true });

export const d = /** @type {const} @satisfies {ComponentTypeSchema} */({
    type: 'object',
    properties: {
        a: { type: 'string', enum: ['a', 'b', 'c'], default: 'a' }
    },
    observed: ['a'],
});

export const e = /** @type {const} @satisfies {ComponentTypeSchema} */({
    type: 'object',
    properties: {
        a: {
            type: 'object',
            default: { b: 'b', c: 1 },
            properties: {
                b: { type: 'string' },
                c: { type: 'number' },
            },
            observed: ['b'],
        },
        b: { type: 'object', properties: { d: { type: 'string' } } },
        c: { type: 'array', items: { type: 'string' }   },
        d: { type: 'array', items: [{ type: 'string' }] },
    },
    observed: ['a'],
});

export const f = /** @type {const} @satisfies {ComponentTypeSchema} */({
    type: 'array',
    default: ['a', 'b', 'c'],
    items: [{ type: 'string' }, { type: 'string' }, { type: 'string' }],
});

export const g = /** @type {const} @satisfies {ComponentTypeSchema} */({
    type: 'array',
    items: {
        type: 'object',
        properties: {
            a: { type: 'string', default: 'a' },
            b: { type: 'number' },
        },
        observed: ['a'],
    },
});

export const h = /** @type {const} @satisfies {ComponentTypeSchema} */({ type: 'string', component: 'a' });

export const i = /** @type {const} @satisfies {ComponentTypeSchema} */({
    type: 'object',
    required: ['a', 'b'],
    properties: {
        a: { type: 'string', component: 'a' },
        b: {
            type: 'object',
            properties: {
                c: { type: 'string', component: 'c' },
            },
        }
    },
});

export const j = /** @type {const} @satisfies {ComponentTypeSchema} */({
    type: 'array',
    items: { type: 'string', component: 'a' },
});

export const k = /** @type {const} @satisfies {ComponentTypeSchema} */({
    type: 'string',
    asset: 'a',
});

export const l = /** @type {const} @satisfies {ComponentTypeSchema} */({
    type: 'array',
    items: { type: 'string', asset: 'a' },
});

export const m = /** @type {const} @satisfies {ComponentTypeSchema} */({
    type: 'object',
    properties: {
        a: { type: 'string', asset: 'a' },
    }
});



