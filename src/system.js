/**
 * System
 */

 import { autobind } from 'core-decorators';

import { BOOT_COMPLETE, MODEL_BINDINGS } from './symbols.js';

const definitionWeakMap = new WeakMap();

export default class System {
    static get [MODEL_BINDINGS](){
        return definitionWeakMap.get(this) || definitionWeakMap.set(this, new Map([...(Object.getPrototypeOf(this)[MODEL_BINDINGS] || [])])).get(this);
    }

    constructor(id, options = {}) {
        this.id = id;
        this.options = options;
        this.enabled = true;
    }

    async init(manager){
        this.manager = manager;
    }
    
    dispose(){
        for(let modelDef of this.constructor[MODEL_BINDINGS]){
            modelDef.dispose();
        }

        this.enabled = false;
        this.disposed = true;
    }
    
    
    update(deltaTime, game) {
        
    }

    render(game) {

    }

    /**
     * This method is called by the EntityManager when a component is added and a new match is found for the registered models of the system
     * 
     * 
     * @param {any} { model, modelKey } 
     * 
     * @memberOf System
     */
    onModelAdd({ model, modelKey }){

    }

    /**
     * This method is called by the EntityManager when a component is removed and a registered model of the system no longer matches
     * 
     * 
     * @param {any} { model, modelKey } 
     * 
     * @memberOf System
     */
    onModelDelete({ model, modelKey }){

    }

    // /**
    //  * 
    //  * 
    //  * @param {any} { model, modelKey, component, componentKey, path, newValue, oldValue } 
    //  * 
    //  * @memberOf System
    //  */
    // onModelChange({ model, modelKey, component, componentKey, path, newValue, oldValue }){

    // }

    /**
     * 
     * 
     * @param {any} { model, modelKey, component, componentKey } 
     * 
     * @memberOf System
     */
    onComponentAdd({ model, modelKey, component, componentKey }){

    }

    /**
     * 
     * 
     * @param {any} { model, modelKey, component, componentKey } 
     * 
     * @memberOf System
     */
    onComponentDelete({ model, modelKey, component, componentKey }){

    }

    /**
     * 
     * 
     * @param {any} { model, modelKey, component, componentKey, path, newValue, oldValue } 
     * 
     * @memberOf System
     */
    onComponentChange({ model, modelKey, component, componentKey, path, newValue, oldValue }){
        
    }

    static getModelBindings(){
        return this[MODEL_BINDINGS];
    }

    async waitUntilReady(interval = 50){
        return await new Promise((resolve, reject) => {
            const i = setInterval(() => {
                if(this.ready){ 
                    resolve();
                    clearInterval(i);
                }
            }, interval);
        });
    }
}

 /**
 * Boot System
 * 
 * A boot system waits until all sibling systems have entered a complete state 
 * and then facilitates a transition to the next stage 
 * 
 * A system is defined as complete if the property BOOT_COMPLETE is true
 * A symbol is used to avoid collision with any other state a system might have
 */
// export class Boot extends System {
//     update(deltaTime, game) {
//         for (let system of this.manager.systems) {
//             if (system !== this && !system[BOOT_COMPLETE]) {
//                 return;
//             }
//         }
        
//         this.stage.dispose();
//         game.stages.delete(this.stage);

//         Stage.import(this.options.next, this.stage.resources).then((stage) => {
//             game.stages.add(stage);
//         });
//     }
// }