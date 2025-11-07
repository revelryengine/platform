export const QUATERNION = /** @type {const} */(0);
export const EULER_XYZ  = /** @type {const} */(1);
export const EULER_XZY  = /** @type {const} */(2);
export const EULER_YXZ  = /** @type {const} */(3);
export const EULER_YZX  = /** @type {const} */(4);
export const EULER_ZXY  = /** @type {const} */(5);
export const EULER_ZYX  = /** @type {const} */(6);
export const AXIS_ANGLE = /** @type {const} */(7);

export const EULER_ANGLE_ORDERS = Object.freeze({
    [QUATERNION]: 'xyz',
    [EULER_XYZ]:  'xyz',
    [EULER_XZY]:  'xzy',
    [EULER_YXZ]:  'yxz',
    [EULER_YZX]:  'yzx',
    [EULER_ZXY]:  'zxy',
    [EULER_ZYX]:  'zyx',
    [AXIS_ANGLE]: 'xyz',
})

export const EULER_ROTATION_MODES = Object.freeze({
    'xyz': EULER_XYZ,
    'xzy': EULER_XZY,
    'yxz': EULER_YXZ,
    'yzx': EULER_YZX,
    'zxy': EULER_ZXY,
    'zyx': EULER_ZYX,
});


export const PREFAB_DELIM = '/';
