import { GameEvent } from './game-event.js';

export class SystemReadyEvent extends GameEvent {
  constructor() {
    super('systemready');
  }
}

export class SystemAddEvent extends GameEvent {
  constructor() {
    super('systemadd');
  }
}

export class SystemDeleteEvent extends GameEvent {
  constructor() {
    super('systemdelete');
  }
}

export class ModelAddEvent extends GameEvent {
  constructor() {
    super('modeladd');
  }
}

export class ModelDeleteEvent extends GameEvent {
  constructor() {
    super('modeldelete');
  }
}

export class ComponentAddEvent extends GameEvent {
  constructor() {
    super('componentadd');
  }
}

export class ComponentDeleteEvent extends GameEvent {
  constructor() {
    super('componentdelete');
  }
}

export class ComponentChangeEvent extends GameEvent {
  constructor() {
    super('componentchange');
  }
}

