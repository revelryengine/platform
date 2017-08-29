import { COMPONENT_BINDINGS, MODEL_BINDINGS } from './symbols.js';

import { autobind } from 'core-decorators';

import { default as EntityManager, ComponentBinding, ComponentSetBinding, ModelBinding, ModelSetBinding } from './entity-manager.js';

const definitionWeakMap = new WeakMap();

/**
 * Entity Model
 */
export default class EntityModel {
    static get [COMPONENT_BINDINGS](){
        return definitionWeakMap.get(this) || definitionWeakMap.set(this, new Map([...(Object.getPrototypeOf(this)[COMPONENT_BINDINGS] || [])])).get(this);
    }

    constructor(id, manager) {
        this.id = id;
        this.manager = manager;
    }

    dispose(){
        this.enabled = false;
        this.disposed = true;
    } 
    
    /**
     * 
     * 
     * @param {any} { componentKey, component } 
     * 
     * @memberOf EntityModel
     */
    onComponentAdd({ component, componentKey }){

    }

    /**
     * 
     * 
     * @param {any} { componentKey, component } 
     * 
     * @memberOf EntityModel
     */
    onComponentDelete({ component, componentKey }){

    }

    /**
     * 
     * 
     * @param {any} { componentKey, component, path, newValue, oldValue } 
     * 
     * @memberOf EntityModel
     */
    onComponentChange({ component, componentKey, path, newValue, oldValue }){

    }
    
    /**
     * Returns a decorator that can be applied to an EntityModel class to bind a component to a property
     * 
     * @static
     * @param {any} type 
     * @param {boolean} [observe=false] 
     * @returns 
     * 
     * @memberOf EntityModel
     */
    static Component(type, observe = false) { //Entity Model Decorator
        return (target, key, descriptor) => {
            let ModelClass = target.constructor;
            ModelClass[COMPONENT_BINDINGS].set(key, new ComponentBinding(key, type, observe));
            return Object.assign(descriptor, { writable: true });
        }
    }

    /**
     * Returns a decorator that can be applied to an EntityModel class to bind components to a property as a Set
     * 
     * @static
     * @param {any} type 
     * @param {boolean} [observe=false] 
     * @returns Decorator
     * 
     * @memberOf EntityModel
     */
    static ComponentSet(type, observe = false) { //Entity Model Decorator
        return (target, key, descriptor) => {
            let ModelClass = target.constructor;
            ModelClass[COMPONENT_BINDINGS].set(key, new ComponentSetBinding(key, type, observe));
            return Object.assign(descriptor, { writable: true, initializer: () => new Set() });
        }
    }

    /**
     * Returns a decorator that can be applied to a System class to bind an EntityModel to a property
     * 
     * @static
     * @param {boolean} [observe=false] 
     * @returns Decorator
     * 
     * @memberOf EntityModel
     */
    static Model(observe = false){  //System Decorator
        let ModelClass = this;
        return (target, key, descriptor) => {
            let SystemClass = target.constructor;
            SystemClass[MODEL_BINDINGS].set(key, new ModelBinding(key, ModelClass, observe));
            return Object.assign(descriptor, { writable: true });
        }
    }

    /**
     * Returns a decorator that can be applied to a System class to bind EntityModels to a property as a Set
     * 
     * @static
     * @param {boolean} [observe=false] 
     * @returns Decorator
     * 
     * @memberOf EntityModel
     */
    static ModelSet(observe = false){  //System Decorator
        let ModelClass = this;
        return (target, key, descriptor) => { 
            let SystemClass = target.constructor;
            SystemClass[MODEL_BINDINGS].set(key, new ModelSetBinding(key, ModelClass, observe));

            return Object.assign(descriptor, { writable: true, initializer: () => new Set() });
        }
    }

    static match(components){
        return [...this[COMPONENT_BINDINGS].values()].every((componentDef) => {
            for (let component of components) {
                if (component.type === componentDef.type) {
                    return true;
                }
            }
        });
    }

    static getComponentBindings(){
        return this[COMPONENT_DEFINTIONS];
    }
}