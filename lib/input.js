import { System        } from 'revelryengine/ecs/lib/system.js';
import { Model         } from 'revelryengine/ecs/lib/model.js';
import { GamepadState  } from './input/gamepad.js';
import { PointerState  } from './input/pointer.js';
import { KeyboardState } from './input/keyboard.js';

export class WorldInputModel extends Model {
    static components = {
        settings: { type: 'worldInput' },
    }
}

export class InputSystem extends System {
    static models = {
        worldInput: { model: WorldInputModel },
    }

    id = 'input';

    gamepads = null;
    keys = null;
    pointers = null;
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
            this.keys = (new KeyboardState(window)).keys;
        }

        if(pointers) {
            this.pointers = (new PointerState(this.game.rootElement ?? document.body)).pointers;       
        } 
    }
    

    update(deltaTime){
        if(this.worldInput?.settings.gamepad) {
            const gamepads = navigator.getGamepads();
            for(const gamepad of gamepads) {
                if(gamepad && this.gamepads[gamepad.index]) {
                    const state = this.gamepads[gamepad.index];
                    state.update(gamepad, deltaTime);
                }
            }
        }
    }
}

export default InputSystem;