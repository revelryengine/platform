
import { Game, Stage, registerSchema } from '../lib/ecs.js';
import { a, b, c, d, e, f, g, h, i, j } from './fixtures/schemas.js';

const { bench } = /** @type {any} */(globalThis).Deno;

const game  = new Game();
const stage = new Stage(game, 'stage');

registerSchema('a', a);
registerSchema('b', b);
registerSchema('c', c);
registerSchema('d', d);
registerSchema('e', e);
registerSchema('f', f);
registerSchema('g', g);
registerSchema('h', h);
registerSchema('i', i);
registerSchema('j', j);

let id = 0;
bench('String component creation', () => {
    stage.createComponent({ entity: String(id++), type: 'a' });
});

bench('Number component creation', () => {
    stage.createComponent({ entity: String(id++), type: 'b' });
});

bench('Boolean component creation', () => {
    stage.createComponent({ entity: String(id++), type: 'c' });
});

bench('Object component creation', () => {
    stage.createComponent({ entity: String(id++), type: 'd', value: {  } });
});

bench('Array component creation', () => {
    stage.createComponent({ entity: String(id++), type: 'f' });
});
