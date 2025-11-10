import { vec3 } from 'revelryengine/deps/gl-matrix.js';

/**
 * Most of this logic is ported from ThreeJS: https://github.com/mrdoob/three.js/blob/47b28bc564b438bf2b80d6e5baf90235292fcbd7/src/math/Ray.js
 */

const _segCenter = vec3.create();
const _segDir    = vec3.create();
const _diff      = vec3.create();
const _sphere    = vec3.create();


export class Ray {
    constructor(origin = vec3.create(), direction = vec3.fromValues(0, 0, -1)) {
        this.origin    = origin;
        this.direction = direction;
    }
    /**
     * @param {vec3} plane
     */
    distanceToPlane(plane) {
        const { origin, direction } = this;

        const distance    = vec3.dot(plane, origin) + plane[3];
        const denominator = vec3.dot(plane, direction);

        if(distance === 0 || denominator === 0) return null;

		const t = -distance / denominator;

        return t >= 0 ? t : null;
    }

    /**
     * @param {vec3} plane
     * @param {vec3} [out]
     */
    intersectPlane(plane, out = vec3.create()) {
        const { origin, direction } = this;

        const t = this.distanceToPlane(plane);

        if(t === null) return null;

        return vec3.scaleAndAdd(out, origin, direction, t);
    }

    /**
     * @param {{ center: vec3, radius: number }} sphere
     * @param {vec3} [out]
     */
    intersectSphere({ center, radius }, out = vec3.create()) {
        const { origin, direction } = this;

        vec3.sub(_sphere, center, origin);

        const tca = vec3.dot(_sphere, direction);
		const d2  = vec3.dot(_sphere, _sphere) - tca * tca;
		const radius2 = radius * radius;

		if (d2 > radius2) return null;

		const thc = Math.sqrt(radius2 - d2);

		const t0 = tca - thc;
		const t1 = tca + thc;

		if (t1 < 0) return null;
		if (t0 < 0) return vec3.scaleAndAdd(out, origin, direction, t1);

		return vec3.scaleAndAdd(out, origin, direction, t0);

	}

    // /**
    //  * @param {Ray} ray
    //  */
    // closestDistanceToRay(ray) {

    //     const dp   = vec3.subtract(_diff, ray.origin, this.origin);
    //     const v12  = vec3.dot(this.direction, this.direction);
    //     const v22  = vec3.dot(ray.direction, ray.direction);
    //     const v1v2 = vec3.dot(this.direction, ray.direction);

    //     const det = v1v2 * v1v2 - v12 * v22;
    //     if (Math.abs(det) > Number.EPSILON) {
    //         const inv_det = 1 / det;

    //         const dpv1 = vec3.dot(dp, this.direction);
    //         const dpv2 = vec3.dot(dp, ray.direction);

    //         const t1 = inv_det * (v22 * dpv1 - v1v2 * dpv2);
    //         const t2 = inv_det * (v1v2 * dpv1 - v12 * dpv2);

    //         return vec3.normalize(dp + l2.direction * t2 - l1.direction * t1);
    //     } else {
    //         const a = vec3.cross(dp, l1.direction);
    //         return Math.sqrt(vec3.dot(a, a) / v12);
    //     }
    // }

    /**
     * @param {vec3} v0
     * @param {vec3} v1
     * @param {vec3} outSegment
     */
    distanceSqToSegment(v0, v1, outSegment) {
        const { origin, direction } = this;

        vec3.add(_segCenter, v0, v1);
        vec3.scale(_segCenter, _segCenter, 0.5);

        vec3.subtract(_segDir, v1, v0);
        vec3.normalize(_segDir, _segDir);

        vec3.subtract(_diff, origin, _segCenter);

        const segExtent = vec3.distance(v0, v1) * 0.5;

		const a01 = -vec3.dot(direction, _segDir);
		const b0  = vec3.dot(_diff, direction);
		const b1  = -vec3.dot(_diff, _segDir);
		const c   = vec3.squaredLength(_diff);
		const det = Math.abs(1 - a01 * a01);

		let s0, s1, sqrDist, extDet;

        if (det > 0) { // Ray and segment are not parallel.
            s0 = a01 * b1 - b0;
			s1 = a01 * b0 - b1;
			extDet = segExtent * det;
            if (s0 >= 0) {
				if (s1 >= - extDet) {
					if (s1 <= extDet) { // region 0, Minimum at interior points of ray and segment.
						const invDet = 1 / det;
						s0 *= invDet;
						s1 *= invDet;
						sqrDist = s0 * (s0 + a01 * s1 + 2 * b0) + s1 * (a01 * s0 + s1 + 2 * b1) + c;
					} else { // region 1
						s1 = segExtent;
						s0 = Math.max(0, -(a01 * s1 + b0));
						sqrDist = -s0 * s0 + s1 * (s1 + 2 * b1) + c;
					}
				} else { // region 5
					s1 = - segExtent;
					s0 = Math.max(0, -(a01 * s1 + b0));
					sqrDist = -s0 * s0 + s1 * (s1 + 2 * b1) + c;
				}
			} else {
				if (s1 <= -extDet) { // region 4
					s0 = Math.max(0, -(-a01 * segExtent + b0));
					s1 = (s0 > 0) ? -segExtent : Math.min(Math.max(-segExtent, -b1), segExtent);
					sqrDist = -s0 * s0 + s1 * (s1 + 2 * b1) + c;
				} else if (s1 <= extDet) { // region 3
					s0 = 0;
					s1 = Math.min(Math.max(-segExtent, -b1), segExtent);
					sqrDist = s1 * (s1 + 2 * b1) + c;
				} else { // region 2
					s0 = Math.max(0, -(a01 * segExtent + b0));
					s1 = (s0 > 0) ? segExtent : Math.min(Math.max(-segExtent, -b1), segExtent);
					sqrDist = -s0 * s0 + s1 * (s1 + 2 * b1) + c;
				}

			}
        } else { // Ray and segment are parallel.
			s1 = (a01 > 0) ? -segExtent : segExtent;
			s0 = Math.max(0, -(a01 * s1 + b0));
			sqrDist = -s0 * s0 + s1 * (s1 + 2 * b1) + c;
		}

        if(outSegment) vec3.scaleAndAdd(outSegment, _segCenter, _segDir, s1);
        // if(outRay) vec3.scaleAndAdd(outRay, origin, direction, s0);

        return sqrDist;
    }

    /**
     * @param {vec3} v0
     * @param {vec3} v1
     * @param {vec3} [out]
     */
    closestIntersectSegment(v0, v1, out = vec3.create()) {
        this.distanceSqToSegment(v0, v1, out);
        return out;
    }
}
