export class KeyboardState {
    constructor(target) {
        this.keys = {};

        target.addEventListener('keydown', (e) => this.handleKeyDown(e));
        target.addEventListener('keyup',   (e) => this.handleKeyUp(e));
    }

    handleKeyDown(e) {
        this.keys[e.code] = true;
        this.keys.alt   = e.altKey;
        this.keys.shift = e.shiftKey;
        this.keys.ctrl  = e.ctrlKey;
        this.keys.meta  = e.metaKey;
        e.preventDefault();
        e.stopPropagation();
    }

    handleKeyUp(e) {
        this.keys[e.code] = false;
        this.keys.alt   = e.altKey;
        this.keys.shift = e.shiftKey;
        this.keys.ctrl  = e.ctrlKey;
        this.keys.meta  = e.metaKey;
        e.preventDefault();
        e.stopPropagation();
    }

    update() {
        
    }
}

export default KeyboardState;