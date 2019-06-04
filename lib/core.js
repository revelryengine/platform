/**
 * The Core module represents the general use public API for the engine.
 *
 * All the modules required for basic use of the engine are included in this module.
 */
export { Game, Game as default } from './game.js';
export { Stage } from './stage.js';
export { System } from './system.js';
export { EntityModel } from './entity-model.js';

// export { EventManager } from './event-manager.js';
export { extensions } from './extensions.js';
export { component } from './decorators/component.js';
export { model } from './decorators/model.js';
export { timed } from './decorators/timed.js';
export { headlessOnly, nonheadlessOnly } from './decorators/headless.js';
