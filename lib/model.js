/**
 * A class that declaratively defines a model.
 */
export class Model {
    /**
     * Creates an instance of Model.
     * @param {*} id
     * @param {Entity} entity
     */
    constructor(id, entity) {
        this.id = id;

        /** @type {Entity} */
        this.entity = entity;

        /** @type {Map<string><Object>} */
        this.components = new Map();

        this.types = new Set();

        for (const [propName, { type }] of Object.entries(this.constructor.components)) {
            
            this.types.add(type);

            Object.defineProperty(this, propName, {
                get() {
                    return this.components.get(propName)?.value;
                },
                set(newValue) {
                    const component = this.components.get(propName);
                    if(component) {
                        const oldValue = component.value;
                        if(oldValue !== newValue) {
                            component.value = newValue;
                            for(const model of this.entity.models) {
                                if(model.onComponentChange) {
                                    for(const [modelPropName, modelComponent] of model.components) {
                                        if(modelComponent === component) {
                                            model.onComponentChange(modelPropName, newValue, oldValue, component);
                                        }   
                                    }
                                }
                            }
                        }
                    }
                }
            });

            for (const cmpnt of entity.components) {
                if (type === cmpnt.type) {
                    this.components.set(propName, cmpnt);
                }
            }
        }
    }

    /**
     * A reference to the stage the entity belongs to {@link Stage}.
     *
     * @type {Stage}
     * @readonly
     */
    get stage() {
        return this.entity.stage;
    }

    /**
     *  A reference to the game the entity belongs to {@link Game}.
     *
     * @type {Game}
     * @readonly
     */
    get game() {
        return this.stage.game;
    }

    static get components() {
        return {};
    }
}

export default Model;
