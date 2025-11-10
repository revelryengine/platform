export class KeyboardState {

    /** @type {Record<string, boolean>} */
    keys = {};

    /** @param {Window|HTMLElement} target */
    constructor(target) {
        target.addEventListener('keydown', (e) => this.handleKeyDown(/** @type {KeyboardEvent} */(e)));
        target.addEventListener('keyup',   (e) => this.handleKeyUp(/** @type {KeyboardEvent} */(e)));
    }

    /**
     * @param {KeyboardEvent} e
     */
    handleKeyDown(e) {
        this.keys[e.code] = true;
        this.keys.alt   = e.altKey;
        this.keys.shift = e.shiftKey;
        this.keys.ctrl  = e.ctrlKey;
        this.keys.meta  = e.metaKey;
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * @param {KeyboardEvent} e
     */
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