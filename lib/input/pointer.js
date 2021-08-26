export class PointerState {
    constructor(target) {
        this.pointers = {};

        target.addEventListener('pointerenter', (e) => this.handlePointerEnter(e));
        target.addEventListener('pointermove',  (e) => this.handlePointerMove(e), { passive: true });
        target.addEventListener('pointerdown',  (e) => this.handlePointerDown(e));
        target.addEventListener('pointerup',    (e) => this.handlePointerUp(e));
        target.addEventListener('pointerout',   (e) => this.handlePointerOut(e));
    }

    handlePointerEnter(e) {
        this.pointers[e.pointerId] = { x: e.clientX, y: e.clientY };

        if(e.isPrimary) {
            this.pointers.primary = this.pointers[e.pointerId];
        }
    }

    handlePointerMove(e) {
        // console.log('mousemove', performance.now());
        this.pointers[e.pointerId].x = e.clientX;
        this.pointers[e.pointerId].y = e.clientY;
    }

    handlePointerDown(e) {
        this.pointers[e.pointerId].x    = e.clientX;
        this.pointers[e.pointerId].y    = e.clientY;
        this.pointers[e.pointerId].down = true;
    }

    handlePointerUp(e) {
        this.pointers[e.pointerId].x    = e.clientX;
        this.pointers[e.pointerId].y    = e.clientY;
        this.pointers[e.pointerId].down = false;
    }

    handlePointerOut(e) {
        this.pointers[e.pointerId] = null;
        if(e.isPrimary) {
            this.pointers.primary = null;
        }
    }

    update() {
        
    }
}

export default PointerState;