import { GameEvent } from './game-event.js';

export class GameNodeInitEvent extends GameEvent {
  constructor(options = {}) {
    super('gamenodeinit', options);
  }
}

export default GameNodeInitEvent;
