const PI      = Math.PI;
const TWO_PI  = 2 * Math.PI;
const EPSILON = 0.000001;

export const normalize = (a) => (a + TWO_PI) % TWO_PI;

export const mod  = (n, m) => ((n % m) + m) % m;
export const lte  = (a, b) => a < b || Math.abs(a - b) < EPSILON;

export const diff = (a, b) => {
    const diff = mod(a - b + PI, TWO_PI) - PI;
    return diff < -PI ? diff + TWO_PI : diff;
}

export const diffDeg = (a, b, clockwise) => {
    const diff = mod(a - b + 180, 360) - 180;

    if(clockwise) {
        return diff < -180 ? diff + 360 : diff;
    } else {
        return diff > 180 ? diff - 360 : diff;
    }
    
}

export const between = (a, b, n) => {
    a = normalize(a);
    b = normalize(b);
    n = normalize(n);

    if(lte(a, b))
        return lte(a, n) && lte(n, b);
    return lte(a, n) || lte(n, b);
}

export const signedAngle = ([x1, y1], [x2, y2]) =>{
    return Math.atan2(x1 * y2 - y1 * x2, x1 * x2 + y1 * y2);
}

export function rad2Deg(r) {
    return r * 180 / Math.PI;
}

export function deg2Rad(d) {
    return d * Math.PI / 180;
}