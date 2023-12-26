import { Model, System } from '../deps/ecs.js';
import { GamepadState  } from './input/gamepad.js';
import { PointerState  } from './input/pointer.js';
import { KeyboardState } from './input/keyboard.js';

export class WorldInputModel extends Model.Typed({
    components: {
        settings: { type: 'worldInput' },
    }
}) { }

export class InputSystem extends System.Typed({
    models: {
        worldInput: { model: WorldInputModel },
    }
}) {
    id = 'input';

    /** @type {(GamepadState|null)[]} */
    gamepads = [];

    /** @type {KeyboardState|null} */
    #keyboardState = null;

    get keys() {
        return this.#keyboardState?.keys;
    }

    /** @type {PointerState|null} */
    #pointerState = null;

    get pointers() {
        return this.#pointerState?.pointers;
    }

    /**
     * @param {WorldInputModel} model
     */
    onModelAdd(model) {
        const { gamepad, keyboard, pointers } = model.settings;

        if(gamepad) {
            this.gamepads = [];
            window.addEventListener('gamepadconnected', (e) => {
                console.debug("Gamepad connected at index %d: %s. %d buttons, %d axes.",
                    e.gamepad.index, e.gamepad.id,
                    e.gamepad.buttons.length, e.gamepad.axes.length, e.gamepad);

                this.gamepads[e.gamepad.index] = new GamepadState(e.gamepad);
            });

            window.addEventListener("gamepaddisconnected", (e) => {
                console.debug("Gamepad disconnected at index %d.", e.gamepad.index);

                this.gamepads[e.gamepad.index] = null;
            });
        }

        if(keyboard) {
            this.#keyboardState = new KeyboardState(window);
        }

        if(pointers) {
            this.#pointerState = new PointerState(this.game?.element ?? document.body);
        }
    }

    /**
     * @param {number} deltaTime
     */
    update(deltaTime){
        if(this.worldInput?.settings.gamepad) {
            const gamepads = navigator.getGamepads();
            for(const gamepad of gamepads) {
                if(gamepad && this.gamepads[gamepad.index]) {
                    const state = this.gamepads[gamepad.index];
                    state?.update(gamepad, deltaTime);
                }
            }
        }
    }
}

/** @type {Revelry.ECS.SystemBundle} */
export const bundle = {
    systems: [InputSystem],
}
