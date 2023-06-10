import { vec2 } from '../../deps/gl-matrix.js';

/**
 * @typedef LineStyle
 * @property {Number} [width=1] - The line width
 * @property {'miter'|'round'|'bevel'} [join='miter'] - The shape used to join line segments
 * @property {'butt'|'round'|'square'} [cap='butt'] - The shape used to end the line
 */

const segmentGeometry = [
    [0, -0.5],
    [1, -0.5],
    [1,  0.5],
    [0, -0.5],
    [1,  0.5],
    [0,  0.5],
];

    
    
const _xBasis = vec2.create();
const _yBasis = vec2.create();
const _point  = vec2.create();

/**
 * A utility Line class that can triangulate a set of points on a line using common standard line styling methods.
 * 
 * Adapted from https://wwwtyro.net/2019/11/18/instanced-lines.html
 */
export class Line {
    /**
     * @param {Array<[Number, Number]>} points - An array of 2-dimensional points on the line
     * @param {LineStyle} [style]
     */
    constructor(points, style = {}) {
        this.points = points;

        const { width = 1, join = 'miter', cap = 'butt' } = style;

        this.style = { width, join, cap };
    }

    
    triangulate() {
        const { points, style: { width, join, cap } } = this;
        const output = [];

        for(let i = 0; i < points.length; i++) {
            const pointA = points[i];
            const pointB = points[(i + 1) % points.length];

            const xBasis = vec2.sub(_xBasis, pointB, pointA);
            const yBasis = vec2.scale(_yBasis, vec2.normalize(_yBasis, [-xBasis[1], -xBasis[0]]), width);

            for(const vertex of segmentGeometry) {
                
                //vec2 point = pointA + xBasis * position.x + yBasis * width * position.y; 
                //yBasis is already scaled by width above
                
                const point = vec2.scaleAndAdd(_point, vec2.scaleAndAdd(_point, pointA, xBasis, vertex[0]), yBasis, vertex[1]);
                output.push(...point, 0);
            }
        }
        return output;
    }
}

