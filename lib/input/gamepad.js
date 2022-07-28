export const vendors = {
    'Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 05c4)': 'dualshock4',
}

export const mappings = {
    dualshock4: {
        A:       { index: 0,  name: 'Cross'    },
        B:       { index: 1,  name: 'Circle'   },
        X:       { index: 2,  name: 'Square'   },
        Y:       { index: 3,  name: 'Triangle' },
        LB:      { index: 4,  name: 'L1'       },
        RB:      { index: 5,  name: 'R1'       },
        LT:      { index: 6,  name: 'L2'       },
        RT:      { index: 7,  name: 'R2'       },
        Select:  { index: 8,  name: 'Share'    },
        Options: { index: 9,  name: 'Options'  },
        LS:      { index: 10, name: 'L3'       },
        RS:      { index: 11, name: 'R3'       },
        Up:      { index: 12, name: 'D-Up'     },
        Down:    { index: 13, name: 'D-Down'   },
        Left:    { index: 14, name: 'D-Left'   },
        Right:   { index: 15, name: 'D-Right'  },
        Home:    { index: 16, name: 'PS'       },
        Misc:    { index: 17, name: 'Touch'    },
    },
}

export class ButtonStateList extends Array {
    constructor(mapping) {
        super();
        this.mapping = mappings[mapping];
    }
    get A() {      return this[this.mapping.A.index]; }
    get B() {      return this[this.mapping.B.index]; }
    get X() {      return this[this.mapping.X.index]; }
    get Y() {      return this[this.mapping.Y.index]; }
    get LB() {     return this[this.mapping.LB.index]; }
    get RB() {     return this[this.mapping.RB.index]; }
    get LT() {     return this[this.mapping.LT.index]; }
    get RT() {     return this[this.mapping.RT.index]; }
    get Select() { return this[this.mapping.Select.index]; }
    get Start() {  return this[this.mapping.Start.index]; }
    get LS() {     return this[this.mapping.LS.index]; }
    get RS() {     return this[this.mapping.RS.index]; }
    get Up() {     return this[this.mapping.Up.index]; }
    get Down() {   return this[this.mapping.Down.index]; }
    get Left() {   return this[this.mapping.Left.index]; }
    get Right() {  return this[this.mapping.Right.index]; }
    get Home() {   return this[this.mapping.Home.index]; }
    get Misc() {   return this[this.mapping.Misc.index]; }
}

export class ButtonsState {
    constructor() {
        this.pressed = false;
        this.touched = false;
        this.value = 0;

        this.hold = {
            pressed: 0,
            touched: 0,
        }

        this.throttle = {
            pressed: {},
            touched: {},
        };
    }
}

export class AxisStateList extends Array {
    get LX() { return this[0]; }
    get LY() { return this[1]; }
    get RX() { return this[2]; }
    get RY() { return this[3]; }
}

export class AxisState {
    constructor() {
        this.value = 0;
        this.active = {
            full: false,
            half: false,
            epsilon: false,
        };

        this.hold = {
            full: 0,
            half: 0,
            epsilon: 0,
        }

        this.throttle = {
            full: {},
            half: {},
            epsilon: {},
        };
    }
}

export const AXIS_EPSILON = 0.25;

export class GamepadState {
    constructor(gamepad) {
        this.vendor  = vendors[gamepad.id] || 'generic';
        this.buttons = new ButtonStateList(this.vendor);
        this.axes    = new AxisStateList();

        /** @todo remap to specific gamepads */
        /* eslint-disable no-unused-vars */
        for(const _ of gamepad.buttons) {
            this.buttons.push(new ButtonsState());
        }
        /* eslint-disable no-unused-vars */
        for(const _ of gamepad.axes) {
            this.axes.push(new AxisState());
        }
    }

    update(gamepad, deltaTime) {
        for(let b = 0, l = gamepad.buttons.length; b < l; b++) {
            for(const prop of ['pressed', 'touched']) {
                if(this.buttons[b][prop] && gamepad.buttons[b][prop]) {
                    this.buttons[b].hold[prop] += deltaTime;
                } else {
                    this.buttons[b].hold[prop] = 0;
                }

                this.buttons[b][prop] = gamepad.buttons[b][prop];

                for(const throttle of Object.getOwnPropertyNames(this.buttons[b].throttle[prop])) {
                    this.buttons[b].throttle[prop][throttle] = this.buttons[b][prop] ? Math.max(this.buttons[b].throttle[prop][throttle] - deltaTime, 0) : 0;
                }
                for(const throttle of Object.getOwnPropertySymbols(this.buttons[b].throttle[prop])) {
                    this.buttons[b].throttle[prop][throttle] = this.buttons[b][prop] ? Math.max(this.buttons[b].throttle[prop][throttle] - deltaTime, 0) : 0;
                }
            }
            
            this.buttons[b].value = gamepad.buttons[b].value;
        }

        
        for(let a = 0, l = gamepad.axes.length; a < l; a++) {
            for(const [prop, value] of [['full', 1], ['half', 0.5], ['epsilon', AXIS_EPSILON]]) {
                if(Math.abs(this.axes[a].value) >= value && Math.abs(gamepad.axes[a]) >= value) {
                    this.axes[a].hold[prop] += deltaTime;
                } else {
                    this.axes[a].hold[prop] = 0;
                }
                this.axes[a].active[prop] = Math.abs(gamepad.axes[a]) >= value;

                for(const throttle of Object.getOwnPropertyNames(this.axes[a].throttle[prop])) {
                    this.axes[a].throttle[prop][throttle] = this.axes[a].active[prop] ? Math.max(this.axes[a].throttle[prop][throttle] - deltaTime, 0) : 0;
                }
                for(const throttle of Object.getOwnPropertySymbols(this.axes[a].throttle[prop])) {
                    this.axes[a].throttle[prop][throttle] = this.axes[a].active[prop] ? Math.max(this.axes[a].throttle[prop][throttle] - deltaTime, 0) : 0;
                }
            }
            this.axes[a].value = gamepad.axes[a];
        }
    }
}

export default GamepadState;