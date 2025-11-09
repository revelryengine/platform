import { LitElement } from '../../deps/lit.js';

/**
 * @import { PropertyValues } from '../../deps/lit.js';
 */

export function getParams() {
    // const [, match = ''] = location.hash.match(/\?(.*)/) || [];
    return new URLSearchParams(location.search.substr(1));
}

/**
 * @param {Record<string, unknown>} params
 */
export function setParams(params) {
    const state = getParams();
    for(const p in params) {
        state.set(p, String(params[p]));
    }
    history.replaceState({}, document.title,  location.hash.replace(/(\?|$).*/, '?' + state.toString()));
}

/**
 * @param {Record<string, unknown>} params
 */
export function deleteParams(params) {
    const state = getParams();
    for(const p in params) {
        state.delete(p);
    }
    history.replaceState({}, document.title,  location.hash.replace(/(\?|$).*/, '?' + state.toString()));
}

export class RevParamElement extends LitElement {
    /**
     * @override
     * @this {LitElement & Record<string, unknown>}
     */
    connectedCallback(){
        const props = /** @type {typeof LitElement}*/(this.constructor).properties;
        for(const [name, value] of getParams()){
            if(props[name] && 'param' in props[name] && props[name].param) {
                if(props[name].type === Boolean){
                    this[name] = value === 'true' ;
                } else if (props[name].type instanceof Function) {
                    this[name] = props[name].type(value);
                }
            }
        }
        for(const [name, prop] of Object.entries(props)) {
            if(this[name] === undefined && 'default' in prop) this[name] = prop.default;
        }
        super.connectedCallback();
    }

    /**
     * @param {PropertyValues<this>} changedProperties
     * @this {LitElement & Record<string, unknown>}
     * @override
     */
    updated(changedProperties) {
        super.updated(changedProperties);
        for(const [key] of changedProperties) {
            const name = /** @type {string} */ (key);
            const value = this[name];
            if(value !== undefined) {
                const props = /** @type {typeof LitElement}*/(this.constructor).properties;
                if(props[name] && 'param' in props[name] && props[name].param) {
                    if('default' in props[name] && value === props[name].default) {
                        deleteParams({ [name]: true });
                    } else {
                        if(props[name].type === Boolean){
                            value
                            setParams({ [name]: value !== undefined && value !== null ? value : false });
                        } else {
                            setParams({ [name]: value });
                        }
                    }
                }
            }
        }
    }
}
