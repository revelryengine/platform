/**
 * Like Object.assign but deep
 */
export function merge(target, ...sources) {
    for(const source of sources) {
        if(source) {
            for (const [key, val] of Object.entries(source)) {
                if (val !== null && typeof val === 'object') {
                    if (target[key] === undefined) {
                        target[key] = new val.__proto__.constructor();
                    }
                    merge(target[key], val);
                } else {
                    target[key] = val;
                }
            }
        }
    }
    return target;
}

export default merge;