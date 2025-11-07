
import { Game, Stage } from '../lib/ecs.js';

const game  = new Game();
const stage = new Stage(game, 'stage');

await stage.loadFile(import.meta.resolve('./fixtures/a.revstg'));

let id = 0;
Deno.bench('String component creation', () => {
    stage.createComponent({ entity: String(id++), type: 'a' });
});

Deno.bench('Number component creation', () => {
    stage.createComponent({ entity: String(id++), type: 'b' });
});

Deno.bench('Boolean component creation', () => {
    stage.createComponent({ entity: String(id++), type: 'c' });
});

Deno.bench('Object component creation', () => {
    stage.createComponent({ entity: String(id++), type: 'd', value: {  } });
});

Deno.bench('Array component creation', () => {
    stage.createComponent({ entity: String(id++), type: 'f' });
});
