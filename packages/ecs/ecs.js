/**
 * The Core module represents the general use public API for the engine.
 *
 * All the modules required for basic use of the engine are included in this module.
 */
export * from './game.js';
export * from './stage.js';
export * from './system.js';
export * from './model.js';
export * from './component.js';
export * from './watchable.js';

export * from './reference.js';
export * from './asset.js';
export * from './schema.js';

export { UUID } from '../utils/uuid.js';
