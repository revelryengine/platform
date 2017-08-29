import timing from 'usertiming';

export const HEADLESS = (typeof window === 'undefined');

export function browserOnly(target, key, descriptor) {
    if(HEADLESS){
        descriptor.value = Function.prototype; //noop
    }
    
    return descriptor;
}

export function nodeOnly(target, key, descriptor) {
    if(!HEADLESS){
        descriptor.value = Function.prototype; //noop
    }
    
    return descriptor;
}

export function timed(target, key, descriptor){
    let name  = `Revelry:${target.constructor.name}.${key}`;
    let start = `${name}:start`;
    let end   = `${name}:end`;

    let method = descriptor.value;
    descriptor.value = function(){
        timing.mark(start);
        method.apply(this, arguments);
        timing.mark(end);
        timing.measure(name, start, end);
    }
}

export function createDefaultProxy(target, defaults = {}){
    let proxies = {};
    let proxy = new Proxy(target, {
        get: (target, property, receiver) => {
            if(proxies[property] !== undefined){
                return proxies[property];
            } else if(target[property] !== undefined){
                return target[property];
            }
            return defaults[property];
        },
        set: (target, property, value, receiver) => {
            if(typeof value === 'object' && typeof defaults[property] === 'object'){
                proxies[property] = createDefaultProxy(value, defaults[property]);
            } else {
                delete proxies[property];
            }
            return Reflect.set(target, property, value);
        },
        deleteProperty: (target, property, receiver) => {
            delete proxies[property];
            return Reflect.deleteProperty(target, property);
        }
    });

    for(let property in target){
        if(typeof target[property] === 'object'){
            proxy[property] = target[property];
        }
    }

    return proxy;
}

export function createWatchedProxy(target, handler, root = null, tree = []){
    let proxies = {};
    let proxy = new Proxy(target, {
        get: (target, property, receiver) => {
            if(proxies[property] !== undefined){
                return proxies[property];
            }
            return target[property];
        },
        set: (target, property, value, receiver) => {
            if(typeof property !== 'symbol'){
                if(typeof value === 'object'){
                    proxies[property] = createWatchedProxy(value, handler, root || proxy, tree.concat(property));
                } else {
                    delete proxies[property];
                }

                if(target[property] !== value){
                    handler(root || proxy, tree.concat(property).join('.'), value, target[property]);
                }
            }
            return Reflect.set(target, property, value);
        },
        deleteProperty: (target, property, receiver) => {
            delete proxies[property];

            if(typeof property !== 'symbol'){
                if(target[property] !== undefined){
                    handler(root || proxy, tree.concat(property).join('.'), undefined, target[property]);
                }
            }

            return Reflect.deleteProperty(target, property);
        }
    });

    for(let property in target){
        if(typeof target[property] === 'object'){
            proxy[property] = target[property];
        }
    }

    return proxy;
}

let requestTick, cancelTick;
if(typeof requestAnimationFrame !== 'undefined') {
    requestTick = requestAnimationFrame.bind(window);
    cancelTick = cancelAnimationFrame.bind(window);
} else if( typeof setImmediate !== 'undefined') {
    requestTick = (callback) => setImmediate(() => callback(timing.now()));
    cancelTick = clearImmediate;
} else {
    requestTick = (callback) => setTimeout(() => callback(timing.now())); 
    cancelTick = clearTimeout;
}

export { requestTick, cancelTick, timing }