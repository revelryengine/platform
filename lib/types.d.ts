declare namespace Revelry {

    namespace ECS {

        interface ComponentTypes {

        }

        type ComponentTypeKeys = Extract<keyof ComponentTypes, string>;

        type Component<K extends ComponentTypeKeys = any> = import('./component.js').Component<K>;
        type ComponentReference<K extends ComponentTypeKeys = any> = import('./component.js').ComponentReference<K>;

        type ComponentTypeMap = {
            [K in ComponentTypeKeys]: {
                value: ComponentTypes[K]['value'],
                json: ComponentTypes[K] extends { json: unknown } ? ComponentTypes[K]['json']: ComponentTypes[K]['value']
            }
        }

        type ComponentTypeValueMap = {
            [K in Extract<keyof ComponentTypeMap, string>]: ComponentTypeMap[K]['value'] | ComponentTypeMap[K]['json']
        }

        type ComponentDataMap = {
            [K in ComponentTypeKeys]: {
                entity: string;
                owner?: string;

                type:   K;
                value:  ComponentTypeMap[K]['value'];

            }
        }

        type ComponentData<K extends ComponentTypeKeys = any> = ComponentDataMap[K];

        type ComplexComponentValue = {
            set(value: unknown): void;
            toJSON(): Record<string, unknown>;
        }

        type ComponentJSONMap = {
            [K in ComponentTypeKeys]: {
                entity: string;
                owner?: string;

                type:   K;
                value:  ComponentTypeMap[K]['json'];

            }
        }

        type ComponentJSON<K extends ComponentTypeKeys = any> = ComponentJSONMap[K];


        /**
        * An initializer is used to initialize complex component data that can not be serialized directly to/from JSON.
        * When a component is registered, if an initializer is defined for the specified component type the component value is set to the result of `new Initializer(value)`.
        * When a component is serialized the value will be converted to JSON using JSON.stringify. Therefore to control serializing complex data add a toJSON method to the Initializer.
        *
        * All complex component data should implement set and toJSON methods to support maintaining component state.
        *
        * For example the following should return the component to the same state:
        *
        * @example
        * ```js
        * const data = new ComponentInitializer();
        *
        * //save state
        * const state = data.toJSON();
        *
        * //undo
        * data.set(state);
        * ```
        *
        * To register new initializers add them to the stage.initializers
        * ```
        * stage.initializers[Revelry.ECS.ComponentTypeKeys] = (component: ComponentData) => ComplexComponentValue
        * ```
        */
        type ComponentInitializers = Partial<{
            [K in ComponentTypeKeys]: (c: ComponentJSON<K>) => ComponentData<K>['value'];
        }>


        interface SystemContexts {

        }

        type SystemContextKeys = Extract<keyof SystemContexts, string>;

        type SystemBundle = { load?: () => Promise<void>, systems?: import('./system.js').SystemConstructor[], initializers?: ComponentInitializers, bundles?: SystemBundle[] };

        type ConnectedSystemContexts = {
            [K in SystemContextKeys]: SystemContexts[K] & { stage: import('./stage.js').Stage}
        }

        type Game   = import('./game.js').Game;
        type Stage  = import('./stage.js').Stage;
        type System<D extends import('./system.js').SystemModelsDefinition = any, E extends import('./utils/watchable.js').WatchableEventMap = any> = import('./system.js').System<D, E>;
        type Watchable<E extends import('./utils/watchable.js').WatchableEventMap = any> = import('./utils/watchable.js').Watchable<E>;
    }
}

