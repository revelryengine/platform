import {MODEL_BINDINGS, COMPONENT_BINDINGS } from './symbols.js';

import { createWatchedProxy } from './utils.js';
import EventManager from './event-manager.js';

import { autobind } from 'core-decorators';

const handlerRemovers = new WeakMap();

class SystemIndex {
    constructor(){
        this.systems = new Map();
    }

    add(system){
        this.systems.set(`id:${system.id}`, system);
    }
    
    delete(system){
        this.systems.delete(`id:${system.id}`);
    }

    get(index){
        return this.systems.get(index);
    }
}

class ComponentIndex {

    constructor(){
        this.components = new Map();        
        this.components.set('entities', new Set());
    }

    add(component){
        this.components.set(`id:${component.id}`, component);

        for(let index of [`entity:${component.entity}`, `type:${component.type}`, `model:${component.entity}:${component.type}`]){
            let components = this.components.get(index);
            if(!components){
                components = new Set();
                this.components.set(index, components);
            }
            components.add(component);
        }

        this.components.get('entities').add(component.entity);
    }

    delete(component){
        this.components.delete(`id:${component.id}`);

        for(let index of [`entity:${component.entity}`, `type:${component.type}`, `model:${component.entity}:${component.type}`]){
            let components = this.components.get(index);
            if(components && !components.delete(component).size){
                this.components.delete(index);
            }
        }

        if(this.components.get(`entity:${component.entity}`).size){
            this.components.get('entities').delete(component.entity);
        }
    }

    get(index){
        return this.components.get(index);
    }
}


export class ModelBinding {
    constructor(key, ModelClass, observe = false){
        this.key = key;
        this.ModelClass = ModelClass;
        this.observe = observe;
    }

    onComponentAdd(system, component, manager){
        let components = manager.index.components.get(`entity:${component.entity}`);
        let model = system[this.key];

        if(!model && this.ModelClass.match(components)){
            model = new this.ModelClass(component.entity, manager);
            system[this.key] = model
            system.onModelAdd({ model, modelKey: this.key });
            return model;
        }
    }

    onComponentDelete(system, component, manager){
        let components = manager.index.components.get(`entity:${component.entity}`);
        let model = system[this.key];
        if(model && !this.ModelClass.match(components)){
            delete system[this.key];
            system.onModelDelete({ model, modelKey: this.key });
            return model;
        }
    }
}

export class ModelSetBinding {

    constructor(key, ModelClass, observe = false){
        this.key = key;
        this.ModelClass = ModelClass;
        this.observe = observe;
    }

    onComponentAdd(system, component, manager){
        let components = manager.index.components.get(`entity:${component.entity}`);
        if(this.ModelClass.match(components)){

            for(let model of system[this.key]) {
                if(model.id === component.entity){
                    return;
                }
            }

            let model = new this.ModelClass(component.entity, manager);
            system[this.key].add(model);
            system.onModelAdd({ model, modelKey: this.key });
            return model;
        }
    }

    onComponentDelete(system, component, manager){
        let components = manager.index.components.get(`entity:${component.entity}`);
        if(!this.ModelClass.match(components)){

            for(let model of system[this.key]) {
                if(model.id === component.entity){
                    system[this.key].delete(model);
                    system.onModelDelete({ model, modelKey: this.key });
                    return model;
                }
            }
        }
    }
}

export class ComponentBinding {
    constructor(key, type, observe = false){
        this.key = key;
        this.type = type;
        this.observe = observe;
    }

    onComponentAdd(system, component, manager, model, modelBinding){
        if(!model[this.key]){
            model[this.key] = component;

            if(this.observe || modelBinding.observe){
                let scope = manager.events.scope(model, component);
                scope.on(`component-change:component:${component.id}`, (component, path, newValue, oldValue) => {
                    model.onComponentChange({ component, componentKey: this.key, path, newValue, oldValue });
                    system.onComponentChange({ component, componentKey: this.key, path, newValue, oldValue, model, modelKey: modelBinding.key });
                });
            }


            model.onComponentAdd({ component, componentKey: this.key });
            system.onComponentAdd({ component, componentKey: this.key, model, modelKey: modelBinding.key });
        }
    }

    onComponentDelete(system, component, manager, model, modelBinding){
        if(model[this.key] === component){
            delete model[this.key];

            if(this.observe || modelBinding.observe){
                let scope = manager.events.scope(model, component);
                scope.clear();
            }

            model.onComponentDelete({ component, componentKey: this.key });
            system.onComponentDelete({ component, componentKey: this.key, model, modelKey: modelBinding.key });
        }
    }
}

export class ComponentSetBinding {
    constructor(key, type, observe = false){
        this.key = key;
        this.type = type;
        this.observe = observe;
    }

    onComponentAdd(system, component, manager, model, modelBinding){
        if(!model[this.key].has(component)){

            if(this.observe || modelBinding.observe){
                let scope = manager.events.scope(model, component);
                scope.on(`component-change:component:${component.id}`, (component, path, newValue, oldValue) => {
                    model.onComponentChange({ component, componentKey: this.key, path, newValue, oldValue });
                });
            }

            model[this.key].add(component);

            model.onComponentAdd({ component, componentKey: this.key });
        }
    }

    onComponentDelete(system, component, manager, model, modelBinding){
        if(model[this.key].has(component)){

            if(this.observe || modelBinding.observe){
                let scope = manager.events.scope(model, component);
                scope.clear();
            }

            model[this.key].delete(component);

            model.onComponentDelete({ component, componentKey: this.key });
        }
    }
}

function componentDelHandlerFactory(system, modelBinding, componentBinding){
    return (component, manager) => {
        modelBinding.onComponentDelete(system, component, manager);
        componentBinding.onComponentDelete(system, component, manager);
    }
}

export default class EntityManager {
    constructor(systems, components){
        this.systems = systems;
        this.components = components;

        this.index = {
            systems: new SystemIndex(),
            components: new ComponentIndex()
        };

        this.events = new EventManager();

        this.systems.add    = this.addSystem;
        this.systems.delete = this.deleteSystem;

        this.components.add    = this.addComponent;
        this.components.delete = this.deleteComponent;
    }

    @autobind
    addSystem(system){
        if(this.systems.has(system)){ return; }

        this.index.systems.add(system);

        let scope = this.events.scope(system);

        for(let modelBinding of system.constructor[MODEL_BINDINGS].values()){           
            for(let componentBinding of modelBinding.ModelClass[COMPONENT_BINDINGS].values()){

                scope.on(`component-add:type:${componentBinding.type}`, (component, manager) => {
                    let model = modelBinding.onComponentAdd(system, component, manager);
                    if(model) { componentBinding.onComponentAdd(system, component, manager, model, modelBinding); }
                });

                scope.on(`component-delete:type:${componentBinding.type}`, (component, manager) => {
                    let model = modelBinding.onComponentDelete(system, component, manager);
                    if(model) { componentBinding.onComponentDelete(system, component, manager, model, modelBinding); }
                });
            }
        }

        system.init(this).then(() => system.ready = true);

        return Set.prototype.add.call(this.systems, system);

        // for(let [key, Model] of system.constructor[MODEL_BINDINGS]) {

        //     for (let entity of this.index.get('entities')) {

        //         let components = this.index.get(`entity:${entity}`);

        //         if (Model.match(components)) {

        //             let model = new Model(entity, this);
        //                 system[SYSTEM_MODELS].get(key).add(model);
        //                 system.onModelAdd(key, model);

        //         }
        //     }
        // }

        // return Set.prototype.add.call(this.systems, system);
    }

    @autobind
    deleteSystem(system){
        if(!this.systems.has(system)){ return; }

        this.index.systems.delete(system);

        this.events.scope(system).clear();

        system.dispose();

        return Set.prototype.delete.call(this.systems, system);
    }

    @autobind
    addComponent(component){
        component = this.createComponentProxy(component);
        if(!component) { return this; }

        this.index.components.add(component);

        this.events.emitNow(`component-add:type:${component.type}`, component, this);

        return Set.prototype.add.call(this.components, component);


        // let components = this.index.get(`entity:${component.entity}`); 

        // for (let system of this.systems) {

        //     for(let [key, Model] of system.constructor[MODEL_BINDINGS]) {

        //         if (Model.match(components)) {

        //             let models = system[SYSTEM_MODELS].get(key);

        //             //if there is already a model for this entity then just call the entity.onComponentAdd
        //             let model;
        //             for(model of system[SYSTEM_MODELS].get(key)){
        //                 if(model.entity === component.entity){
        //                     break;
        //                 }
        //             }
        //             if(!model){
        //                 model = new Model(component.entity, this);
        //                 system[SYSTEM_MODELS].get(key).add(model);
        //                 system.onModelAdd(key, model);
        //             }
        //         }
        //     }
        // }

        // return Set.prototype.add.call(this.components, component);
    }

    @autobind
    deleteComponent(component){
        component = this.index.components.get(`id:${component.id}`);
        if(!component) { return this; }

        this.index.components.delete(component);

        this.events.emitNow(`component-delete:type:${component.type}`, component, this);

        return Set.prototype.delete.call(this.components, component);



        // let components = this.index.get(`entity:${component.entity}`);

        // this.index.delete(component);

        //  for (let system of this.systems) {

        //     for(let [key, Model] of system.constructor[MODEL_BINDINGS]) {

        //         if (!Model.match(components)) {

        //             system[SYSTEM_MODELS].get(key).clear();

        //         }
        //     }
        // }

        // return Set.prototype.delete.call(this.components, component);
    }

    @autobind
    createComponentProxy(component){
        let proxy = this.index.components.get(`id:${component.id}`);
        if(proxy){
            Object.assign(proxy, component);
            return;
        } else {
            proxy = createWatchedProxy(component, this.handleChange);
        }
        return proxy;
    }

    @autobind
    handleChange(component, path, newValue, oldValue){
        this.events.emitNow(`component-change:entity:${component.entity}`, component, path, newValue, oldValue);
        this.events.emitNow(`component-change:component:${component.id}`, component, path, newValue, oldValue);
        this.events.emitNow(`component-change:entity:${component.entity}:type:${component.type}`, component, path, newValue, oldValue);
    }    
}