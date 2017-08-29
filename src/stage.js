import EntityManager from './entity-manager.js';
import EventManager from './event-manager.js';

import { timed } from './utils.js';

/**
 * Stage
 * 
 */
export default class Stage {
    constructor(id, options = {}, resources = new Map()) {
        this.id = id;
        this.options = options;
        this.resources = resources;

        this.systems = new Set();
        this.components = new Set();

        this.events = new EventManager();
        this.entityManager = new EntityManager(this.systems, this.components);
    }
    
    dispose(){
        for(let system of this.systems){
            system.dispose();
        }
        
        this.disposed = true;
    }

    @timed
    update(deltaTime, game) {
        this.events.dispatch();
        this.entityManager.events.dispatch();
        for (let system of this.systems) {
            if(system.ready && system.enabled) system.update(deltaTime, game);
        }
    }

    @timed
    render(game) {
        for (let system of this.systems) {
            if(system.ready && system.enabled) system.render(game);
        }
    }

    static import(src, resources) {
        return import(src).then((mod) => {
            let data = Object.assign({ systems: [], components: [] }, mod.data);

            let stage = mod.stage || new Stage(data.id, data.options, resources)
            
            return Promise.all(data.systems.map((system) => {
                return import(system.module).then((mod) => {
                    let Module = mod[system.export || 'default'];
                    return new Module(this, system.options);
                });
            })).then((systems) => {
                for (let system of systems) {
                    stage.systems.add(system);
                }
                for (let component of data.components) {
                    stage.components.add(component);
                }

                return stage;
            });
        });
    }
}