import { GameNode } from './gom/game-node.js';

import { ComponentChangeEvent } from './events/events.js';

/**
 * A class that declaratively defines a model.
 */
export class Model extends GameNode {
    /**
     * Creates an instance of Model.
     * @param {Entity} entity
     */
    constructor(id, entity) {
        super(id);

        /** @type {Entity} */
        this.entity = entity;

        /** @type {Map<string><Object>} */
        this.components = new Map();

        for (const [propName, { type }] of Object.entries(this.constructor.components)) {
            Object.defineProperty(this, propName, {
                get() {
                    return this.components.get(type)?.value;
                },
                set(newValue) {
                    const component = this.components.get(type);
                    if(component) {
                        const oldValue = component.value;
                        if(oldValue !== newValue) {
                            component.value = newValue;

                            this.dispatchEvent(new ComponentChangeEvent({ propName, newValue, oldValue, component }));
                            this.onComponentChange?.(propName, newValue, oldValue, component);
                        }
                    }
                }
            });

            for (const cmpnt of entity.components) {
                if (type === cmpnt.type) {
                    this.components.set(cmpnt.type, cmpnt);
                }
            }
        }
    }

    /**
     * A reference to the parent of an Model which is the {@link System}.
     *
     * @type {System}
     * @readonly
     */
    get system() {
        return this.parent;
    }

    /**
     * A reference to the parent of an Model's parent which is the {@link Stage}.
     *
     * @type {Stage}
     * @readonly
     */
    get stage() {
        return this.parent?.parent;
    }

    /**
     * A reference to the parent of a Model's parent's parent which is the {@link Game}.
     *
     * @type {Game}
     * @readonly
     */
    get game() {
        return this.stage?.parent;
    }

    static get components() {
        return {};
    }
}

export default Model;
