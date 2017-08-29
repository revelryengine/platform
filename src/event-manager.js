/**
 * Event manager
 * 
 * Works like a typical event emitter except it waits until dispatch is called before handlers are fired.
 * This is useful for deferring events until the next frame in the game loop. Use emitNow to bypass deferment.
 * 
 */

const scopes = new WeakMap();

export default class EventManager {
    constructor(){
        this.events = new Set();
        this.listeners = new Map();
    }

    addListener(type, listener){
        if(!this.listeners.has(type)){
            this.listeners.set(type, new Set());
        }

        this.listeners.get(type).add(listener);
    }

    removeListener(type, listener){
        if(this.listeners.has(type)){
            if(this.listeners.get(type).delete(listener).size === 0){
                this.listeners.delete(type);
            }
        }
    }

    on(type, listener){
        return this.addListener(type, listener);
    }

    off(type, listener){
        return this.removeListener(type, listener);
    }

    removeAllListeners(){
        this.listeners.clear();
    }

    removeAllEvents(){
        this.events.clear();
    }

    emit(type, ...values){
        if(this.listeners.has(type)){
            this.events.add({ type: type, values: values });
        }
    }

    emitOnce(type, comparator, ...values){
        for(let event of this.events){
            if(type === event.type && comparator(...event.values)){
                this.events.delete(event);
                break;
            }
        }
        this.emit(type, ...values);
    }

    emitNow(type, ...values){
        if(this.listeners.has(type)){
            for(let listener of this.listeners.get(type)){
                try {
                    listener(...values);
                } catch(e){
                    console.warn('Event Listener has thrown an error', e);
                }
            }
        }
    }

    dispatch() {
        for(let { type, values } of this.events){
            this.emitNow(type, ...values);
        }
        this.removeAllEvents();
    }

    scope(...keys){
        let scope = scopes;
        for(let key of keys){
            scope = scope.get(key) || scope.set(key, (key === keys[ keys.length - 1 ] ? new Set() : new WeakMap())).get(key);
        }        

        return {
            on: (type, listener) => {
                scope.add({ type, listener });
                return this.addListener(type, listener);
            },
            clear: () => {
                for(let { type, listener } of scope){
                    this.removeListener(type, listener);
                }
                scopes.delete(key);
            }
        }
    }
}