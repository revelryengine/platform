import { GameEvent } from './game-event.js';

export class ComponentAddEvent extends GameEvent {
    constructor({ component }) {
        super('componentadd');
        this.component = component;
    }
}

export class ComponentDeleteEvent extends GameEvent {
    constructor({ component }) {
        super('componentdelete');
        this.component = component;
    }
}

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

export class SystemAddEvent extends GameEvent {
    constructor({ system }) {
        super('systemadd');
        this.system = system;
    }
}

export class SystemDeleteEvent extends GameEvent {
    constructor({ system }) {
        super('systemdelete');
        this.system = system;
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
