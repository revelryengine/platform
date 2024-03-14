type RenderOptions = {
    target?: { type: 'canvas', width: number, height: number } | { type: 'canvas', autosize: true, scale?: number }
} & Revelry.Renderer.RenderPathSettingsOptions;

declare namespace Revelry {

    namespace ECS {

        interface ComponentTypes {
            animations:  { value: [{ name: string, loop?: boolean }] },
            mesh:        { value: import('./mesh.js').MeshAsset,               json: { path: string } }
            meta:        { value: import('./game-object.js').GameObjectMeta,   json: { name: string, parent?: string, hidden?: boolean} },
            transform:   { value: import('./transform.js').Transform,          json: { translation?: vec3, rotation?: quat, scale?: vec3, mode?: import('./transform.js').ROTATION_MODE } },
            sprite:      { value: import('./sprite.js').SpriteAsset,           json: import('./sprite.js').SpriteAssetJSON }
            environment: { value: import('./environment.js').EnvironmentAsset, json: { path: string, disabled?: boolean } }

            worldInput:  { value: { gamepad?: boolean, keyboard?: boolean, pointers?: boolean } },

            camera:  {
                json:  import('../deps/gltf.js').camera & { renderOptions?: RenderOptions },
                value: import('../deps/gltf.js').Camera & { renderOptions?: RenderOptions },
            },
            orbitControl: { value: { button?: number, target?: vec3 | string } },

            light: { value: { name?: string } & import('../deps/gltf.js').khrLightsPunctualLight },

            worldPhysics2d: { value: { gravity: [number, number], debugDraw?: string } },
            rigidBody2d: { value: {
                    type:          'static'|'kinematic'|'dynamic',
                    density:       number,
                    friction:      number,
                    restitution:   number,
                    bullet?:       boolean,
                    enabled?:      boolean,
                    gravityScale?: number,
                    allowSleep?:   boolean,
            } },
            collisionShapes2d:  { value: (import('./physics2d.js').CircleShape | import('./physics2d.js').BoxShape | import('./physics2d.js').PolygonShape)[] },
            jointConstraints2d: { value: (import('./physics2d.js').DistanceJointConstraint | import('./physics2d.js').RevoluteJointConstraint)[] },
            velocity: { value: [number, number] },

            prefab: { value: import('./prefab.js').PrefabAsset, json: { path: string, references?: import('./prefab.js').PrefabReferences, overrides?: import('./prefab.js').PrefabOverrides } },
        }

        interface SystemContexts {
            'renderer':    import('./renderer.js').RendererSystem,
            'game-object': import('./game-object.js').GameObjectSystem,
            'prefab':      import('./prefab.js').PrefabSystem,
        }
    }

    namespace Core {
        type RevElement = import('./rev-element.js').RevElement;
        type RevGameElement = import('./rev-element.js').RevGameElement;
        type RevStageElement = import('./rev-element.js').RevStageElement;

        /**
         * Use this utility type to set the 'this' context when specified element properties are known to be defined
         */
        type RevElementThis<T extends { new (): RevElement, properties: import('../deps/lit.js').PropertyDeclarations }> = InstanceType<T> & { [K in keyof T['properties'] & keyof InstanceType<T>]: NonNullable<InstanceType<T>[K]> }
    }
}

interface HTMLElementTagNameMap {
    'rev-game':  import('./rev-element.js').RevGameElement;
    'rev-stage': import('./rev-element.js').RevStageElement;
}

interface GlobalEventHandlersEventMap {
    'rev-stage:load': CustomEvent<{ foo: 123 }>;
}
