import { ComponentSchemas } from '../../lib/ecs.js';

import * as schemas from './schemas.js';

declare module '../../lib/ecs.js' {
    interface ComponentSchemas {
        a: typeof schemas.a,
        b: typeof schemas.b,
        c: typeof schemas.c,
        d: typeof schemas.d,
        e: typeof schemas.e,
        f: typeof schemas.f,
        g: typeof schemas.g,
        h: typeof schemas.h,
        i: typeof schemas.i,
        j: typeof schemas.j,
        k: typeof schemas.k,
        l: typeof schemas.l,
        m: typeof schemas.m,
    }
}
