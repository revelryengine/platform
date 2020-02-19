import { GameEvent } from './game-event.js';

export class GameNodeDisposeEvent extends GameEvent {
    constructor(options = {}) {
        super('gamenodedispose', options);
    }
}

export default GameNodeDisposeEvent;
