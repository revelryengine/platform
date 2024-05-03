
import { Game, Stage } from '../lib/ecs.js';

const { bench } = /** @type {any} */(globalThis).Deno;

const game  = new Game();
const stage = new Stage(game, 'stage');

await stage.loadFile(import.meta.resolve('./fixtures/a.revstg'));

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
