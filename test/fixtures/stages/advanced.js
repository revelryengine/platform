import { Stage } from '../../../dist/revelry.js';

const stage = new Stage('advanced-stage');

const data = {
    "systems": [
        { 
            "module": "../test/fixtures/systems/advanced.js"
        }
    ],
    "components": [
        { "id": "component-1", "entity": "entity-1", "type": "foo" },
        { "id": "component-2", "entity": "entity-1", "type": "bar" },
        { "id": "component-3", "entity": "entity-2", "type": "foo" },
        { "id": "component-4", "entity": "entity-2", "type": "bar" }
    ]
}

export { stage, data };