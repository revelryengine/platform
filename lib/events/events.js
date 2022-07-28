import { GameEvent } from './game-event.js';

export class ComponentChangeEvent extends GameEvent {
    constructor({ propName, newValue, oldValue, component }) {
        super('componentchange');
        this.propName  = propName;
        this.newValue  = newValue;
        this.oldValue  = oldValue;
        this.component = component;
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
