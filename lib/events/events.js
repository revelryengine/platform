import { GameEvent } from './game-event.js';

export class ComponentChangeEvent extends GameEvent {
    constructor({ component, newValue, oldValue }) {
        super('componentchange');
        this.component = component;
        this.newValue = newValue;
        this.oldValue = oldValue
    }
}

export class ModelAddEvent extends GameEvent {
    constructor({ model }) {
        super('modeladd');
        this.model = model;
    }
}

export class ModelDeleteEvent extends GameEvent {
    constructor({ model }) {
        super('modeldelete');
        this.model = model;
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
