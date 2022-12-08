import { GameEvent } from './game-event.js';

export class ModelAddEvent extends GameEvent {
    constructor({ model, key }) {
        super('modeladd');
        this.model = model;
        this.key   = key;
    }
}

export class ModelDeleteEvent extends GameEvent {
    constructor({ model, key }) {
        super('modeldelete');
        this.model = model;
        this.key   = key;
    }
}

export class NodeAddEvent extends GameEvent {
    constructor({ node }) {
        super('nodeadd');
        this.node = node;
    }
}

export class NodeDeleteEvent extends GameEvent {
    constructor({ node }) {
        super('nodedelete');
        this.node = node;
    }
}
