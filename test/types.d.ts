declare namespace Revelry {

    namespace ECS {

        interface ComponentTypes {
            a: { value: string },
            b: { value: number },
            c: { value: import('../lib/utils/watchable.js').Watchable },
            d: { value: ComplexComponentValue, json: { foo: string } },
            e: { value: string },
        }


        interface SystemContexts {
            system: import('../lib/system.js').System
        }
    }
}
