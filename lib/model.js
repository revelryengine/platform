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
                        component.value = newValue;
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

    /**
     * Notifies the component attached to the specified property of a change.
     * @param {string} propName - The name of the property to notify.
     * @param {any} oldValue - The previous value of the property.
     */
    notify(propName, oldValue) {
        this.components.get(propName)?.notify(oldValue);
    }

    /**
     * Adds a watcher to the component attached to the specified property.
     * @param {string} propName - The name of the property to watch.
     * @param {function} watcher - The watcher function to add.
     * @returns {function | undefined} - The function to use to unwatch the property or undefined if the property does not exist.
     */
    watch(propName, watcher) {
        return this.components.get(propName)?.watch(watcher);
    }

    /**
     * Removes a watcher from the component attached to the specified property.
     * @param {string} propName - The name of the property to unwatch.
     * @param {function} watcher - The watcher function to remove.
     * @returns {boolean} - Whether the unwatch operation succeeded or not.
     */
    unwatch(propName, watcher) {
        return this.components.get(propName)?.unwatch(watcher);
    }

    static get components() {
        return {};
    }
}

export default Model;
