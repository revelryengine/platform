export class PointerState {
    constructor(target) {
        this.target   = target;
        this.pointers = {};

        target.addEventListener('pointerenter', (e) => this.handlePointerEnter(e));
        target.addEventListener('pointermove',  (e) => this.handlePointerMove(e), { passive: true });
        target.addEventListener('pointerdown',  (e) => this.handlePointerDown(e));
        target.addEventListener('pointerup',    (e) => this.handlePointerUp(e));
        target.addEventListener('pointerout',   (e) => this.handlePointerOut(e));

        target.style.touchAction = 'none';
    }

    handlePointerEnter(e) {
        this.pointers[e.pointerId] = { 
            x:     e.clientX, 
            y:     e.clientY,
            axisX: (e.clientX / this.target.clientWidth * 2) - 1,
            axisY: (1 - (e.clientY / this.target.clientHeight)) * 2 - 1,

        };

        if(e.isPrimary) {
            this.pointers.primary = this.pointers[e.pointerId];
        }
    }

    handlePointerMove(e) {
        const pointer = this.pointers[e.pointerId];

        pointer.x     = e.clientX;
        pointer.y     = e.clientY;
        pointer.axisX = (e.clientX / this.target.clientWidth * 2) - 1;
        pointer.axisY = (1 - (e.clientY / this.target.clientHeight)) * 2 - 1;

        pointer.movementX = e.movementX;
        pointer.movementY = e.movementY;

        pointer.click = false;
    }

    handlePointerDown(e) {
        const pointer = this.pointers[e.pointerId];

        pointer.x     = e.clientX;
        pointer.y     = e.clientY;
        pointer.axisX = (e.clientX / this.target.clientWidth * 2) - 1;
        pointer.axisY = (1 - (e.clientY / this.target.clientHeight)) * 2 - 1;

        pointer.click     = false;
        pointer.downstart = e.timeStamp;

        pointer.down = true;
    }

    handlePointerUp(e) {
        const pointer = this.pointers[e.pointerId];

        pointer.x     = e.clientX;
        pointer.y     = e.clientY;
        pointer.axisX = (e.clientX / this.target.clientWidth * 2) - 1;
        pointer.axisY = (1 - (e.clientY / this.target.clientHeight)) * 2 - 1;
        pointer.down = false;

        pointer.click = e.timeStamp - pointer.downstart < 200;
    }

    handlePointerOut(e) {
        delete this.pointers[e.pointerId];

        this.pointers.primary.out = true;
    }

    update() {

    }
}

export default PointerState;