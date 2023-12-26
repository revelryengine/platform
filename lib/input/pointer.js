/**
 * @typedef {{
 *      x:         number,
 *      y:         number,
 *      axisX:     number,
 *      axisY:     number,
 *      click:     boolean,
 *      down:      number,
 *      movementX: number,
 *      movementY: number,
 * }} Pointer
 */

export class PointerState {
    /** @type {Partial<Record<number|'primary', Pointer>>} */
    pointers = {};

    /** @param {HTMLElement} target */
    constructor(target) {
        this.target   = target;

        target.addEventListener('pointerenter', (e) => this.handlePointerEnter(e));
        target.addEventListener('pointermove',  (e) => this.handlePointerMove(e), { passive: true });
        target.addEventListener('pointerdown',  (e) => this.handlePointerDown(e));
        target.addEventListener('pointerup',    (e) => this.handlePointerUp(e));
        target.addEventListener('pointerout',   (e) => this.handlePointerOut(e));

        target.style.touchAction = 'none';
    }

    /** @param {PointerEvent} e */
    handlePointerEnter(e) {
        const pointer =  {
            x:         e.clientX,
            y:         e.clientY,
            axisX:     (e.clientX / this.target.clientWidth * 2) - 1,
            axisY:     (1 - (e.clientY / this.target.clientHeight)) * 2 - 1,
            movementX: 0,
            movementY: 0,
            click:     false,
            down:      0,
        }

        this.pointers[e.pointerId] = pointer;

        if(e.isPrimary) {
            this.pointers.primary = pointer;
        }

        return pointer;
    }

    /**
     * @param {PointerEvent} e
     */
    handlePointerMove(e) {
        const pointer = this.pointers[e.pointerId] ?? this.handlePointerEnter(e);

        pointer.x     = e.clientX;
        pointer.y     = e.clientY;
        pointer.axisX = (e.clientX / this.target.clientWidth * 2) - 1;
        pointer.axisY = (1 - (e.clientY / this.target.clientHeight)) * 2 - 1;
        pointer.click = false;

        pointer.movementX = e.movementX;
        pointer.movementY = e.movementY;
    }

    /**
     * @param {PointerEvent} e
     */
    handlePointerDown(e) {
        const pointer = this.pointers[e.pointerId] ?? this.handlePointerEnter(e);

        pointer.x     = e.clientX;
        pointer.y     = e.clientY;
        pointer.axisX = (e.clientX / this.target.clientWidth * 2) - 1;
        pointer.axisY = (1 - (e.clientY / this.target.clientHeight)) * 2 - 1;
        pointer.click = false;
        pointer.down  = e.timeStamp;
    }

    /**
     * @param {PointerEvent} e
     */
    handlePointerUp(e) {
        const pointer = this.pointers[e.pointerId] ?? this.handlePointerEnter(e);

        pointer.x     = e.clientX;
        pointer.y     = e.clientY;
        pointer.axisX = (e.clientX / this.target.clientWidth * 2) - 1;
        pointer.axisY = (1 - (e.clientY / this.target.clientHeight)) * 2 - 1;
        pointer.click = (e.timeStamp - pointer.down) < 200;
        pointer.down  = 0;

        pointer.movementX = 0;
        pointer.movementY = 0;
    }

    /**
     * @param {PointerEvent} e
     */
    handlePointerOut(e) {
        delete this.pointers[e.pointerId];
    }

    update() {

    }
}

export default PointerState;