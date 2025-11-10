import { html, css, repeat, LitElement } from 'revelryengine/deps/lit.js';
import { Game, Stage, System           } from 'revelryengine/ecs/ecs.js';

/**
 * @import { SystemBundle,
 *  Watchable, WatchableEventMap, WatchableWildCardImmediateHandler, WatchableWildcardDeferredOptions, WatchableWildcardImmediateOptions, WatchableAnyOptions, WatchableAnyType,
 * } from 'revelryengine/ecs/ecs.js';
 *
 * @import { CSSResultOrNative, PropertyValues } from 'revelryengine/deps/lit.js';
 */

/**
 * ಠ_ಠ TypeScript is so frustrating sometimes. Please ignore all the extraneous type narrowing.
 */

/**
 * A RevElement is just a LitElement with added
 */
export class RevElement extends LitElement {
    /** @type {AbortController|null} */
    #abortCtl = null;

    /**
     * @param {...AbortSignal} signals
     */
    #anySignal(...signals) {
        const controller = new AbortController();

        for (const signal of signals) {
            if (signal.aborted) {
                controller.abort(signal.reason);
                return signal;
            }

            signal.addEventListener("abort", () => controller.abort(signal.reason), {
                signal: controller.signal,
            });
        }

        return controller.signal;
    }

    /**
     * @template {Watchable} Z
     * @template {Z extends Watchable<infer E extends WatchableEventMap> ? E : never} T
     * @template {Watchable<T>} W
     *
     * Watch for all events
     * @overload
     * @param {W} watchable
     * @param {WatchableWildCardImmediateHandler<T>} handler
     * @param {undefined} [options]
     * @return {void}
     *
     * Watch for all events and dispatch immediately.
     * @overload
     * @param {W} watchable
     * @param {WatchableWildcardDeferredOptions<T>} options
     * @return {void}
     *
     * Watch for all events
     * @overload
     * @param {W} watchable
     * @param {WatchableWildcardImmediateOptions<T>} options
     * @return {void}
     *
     * Watch for events of a specific type
     * @template {keyof T} K
     * @overload
     * @param {W} watchable
     * @param {K} type
     * @param {WatchableAnyOptions<T, K>} options
     * @return {void}
     *
     * @param {W} watchable
     * @param {WatchableAnyType<T>}    anyType
     * @param {WatchableAnyOptions<T>} [anyOptions]
     */
    watch(watchable, anyType, anyOptions) {
        let options;

        if(typeof anyType === 'function') {
            options = { handler: anyType };
        } else if(typeof anyType === 'object') {
            options = { ...anyType };
        } else if(typeof anyOptions === 'function') {
            options = { type: anyType, handler: anyOptions }
        } else if(typeof anyOptions === 'object') {
            options = { type: anyType, ...anyOptions }
        } else {
            throw new Error('Invalid Parameters');
        }

        this.#abortCtl ??= new AbortController();
        const signal = options.signal ? this.#anySignal(options.signal, this.#abortCtl.signal) : this.#abortCtl.signal;

        if('type' in options) {
            watchable.watch(options.type, { ...options, signal });
        } else {
            if(options.deferred) {
                watchable.watch({ ...options, signal });
            } else {
                watchable.watch({ ...options, signal });
            }
        }
    }

    /**
     * @template {Watchable} Z
     * @template {Z extends Watchable<infer E extends WatchableEventMap> ? E : never} T
     * @template {Watchable<T>} W
     *
     * @overload
     * @param {W} watchable
     * @param {WatchableWildCardImmediateHandler<T>} handler
     * @return {void}
     *
     * @overload
     * @param {W} watchable
     * @param {WatchableWildcardDeferredOptions<T>} options
     * @return {void}
     *
     * @overload
     * @param {W} watchable
     * @param {WatchableWildcardImmediateOptions<T>} options
     * @return {void}
     *
     * @template {keyof T} K
     * @overload
     * @param {W} watchable
     * @param {K} type
     * @param {WatchableAnyOptions<T, K>} options
     * @return {void}
     *
     * @param {W} watchable
     * @param {WatchableAnyType<T>}    anyType
     * @param {WatchableAnyOptions<T>} [anyOptions]
     */
    unwatch(watchable, anyType, anyOptions) {
        if(typeof anyType === 'function') {
            watchable.unwatch(anyType);
        } else if(typeof anyType === 'object') {
            if(anyType.deferred) {
                watchable.unwatch(anyType);
            } else {
                watchable.unwatch(anyType);
            }
        } else if(typeof anyOptions === 'function') {
            watchable.unwatch(anyType, anyOptions);
        } else if(typeof anyOptions === 'object') {
            watchable.unwatch(anyType, anyOptions);
        } else {
            throw new Error('Invalid Parameters');
        }
    }

    disconnectedCallback() {
        this.#abortCtl?.abort();
        this.#abortCtl = null;

        super.disconnectedCallback();
    }

    /**
     * @template {keyof HTMLElementTagNameMap} T
     * @overload
     * @param {T} selector
     * @return {HTMLElementTagNameMap[T] | null}
     *
     * @overload
     * @param {string} selector
     * @return {Element | null}
     *
     * @param {string} selector
     */
    closestComposed(selector) {
        /** @type {Element|undefined} */

        let element = this;
        while (element && 'closest' in element) {
            const found = element.closest(selector);
            if(found) return found;
            const node = /** @type {Node|ShadowRoot} */(element.getRootNode());

            element = 'host' in node ? node.host : undefined;
        }
        return null;
    }

    /**
     * Sets a boolean attribute or removes it if the value is falsey
     * @param {string} attribute
     * @param {boolean} value
     */
    setBooleanAttribute(attribute, value) {
        if(value) this.setAttribute(attribute, '');
        else this.removeAttribute(attribute);
    }

    /**
     * Initializes properties and returns this. Useful for setting attributes at the time of creation:
     *
     * ```
     * const element = document.createElement('rev-element').initProperties({ id: 'foobar' })
     * ```
     *
     * @template {{[K in keyof this]?: this[K]}} T
     * @param {T} properties
     * @return {typeof this & T}
     */
    initProperties(properties) {
        Object.assign(this, properties);
        return /** @type {typeof this & T} */(this);
    }

    /**
     * @param {CSSResultOrNative} styleSheet
     * @param {CSSStyleSheet[]} [adoptedStyleSheets]
     */
    appendStyleSheet(styleSheet, adoptedStyleSheets = /** @type {ShadowRoot} */(this.shadowRoot).adoptedStyleSheets) {
        const style = /** @type {CSSStyleSheet} */(styleSheet instanceof CSSStyleSheet ? styleSheet : styleSheet.styleSheet);
        if(!adoptedStyleSheets.includes(style)) {
            adoptedStyleSheets.push(style);
        }

        return this;
    }

    /**
     * @param {CSSResultOrNative} styleSheet
     * @param {CSSStyleSheet[]} [adoptedStyleSheets]
     */
    removeStyleSheet(styleSheet, adoptedStyleSheets = /** @type {ShadowRoot} */(this.shadowRoot).adoptedStyleSheets) {
        const style = /** @type {CSSStyleSheet} */(styleSheet instanceof CSSStyleSheet ? styleSheet : styleSheet.styleSheet);
        if(adoptedStyleSheets.includes(style)) {
            adoptedStyleSheets.splice(adoptedStyleSheets.indexOf(style), 1);
        }

        return this;
    }
}


export class RevGameElement extends RevElement {
    static properties = {
        game: { type: Game },
        src:  { type: String, reflect: true },
    }

    static styles = [css`
        :host {
            display: flex;
            flex-grow: 1;
        }
    `]

    /**
    * @type {AbortController}
    */
    #abortCtrl = new AbortController();

    /** @type {(() => void)} */
    onload = () => undefined;

    constructor() {
        super();
        this.game = new Game();
        this.src  = '';

        // queueMicrotask(() => {
        //     if(this.src) this.#loadGameFile(this.src);
        // });
    }

    connectedCallback() {
        super.connectedCallback();

        this.watch(this.game, 'stage:add',    () => this.requestUpdate());
        this.watch(this.game, 'stage:delete', () => this.requestUpdate());
    }

    /**
    * @param {PropertyValues<this>} changedProperties
    */
    updated(changedProperties) {
        if(changedProperties.has('src')) {
            if(this.src) {
                if(changedProperties.get('src') !== this.src) this.#loadGameFile(this.src);
            } else {
                this.#abortCtrl.abort();
            }
        }
    }

    /**
    * Fetchs a game file and adds the stages to the game. It will also clear any existing stages.
    * @param {string} src
    */
    async #loadGameFile(src) {
        this.#abortCtrl.abort();
        this.#abortCtrl = new AbortController();

        this.game.pause();

        await this.game.loadFile(src, this.#abortCtrl.signal);

        this.requestUpdate();

        this.game.start();
        this.onload();
    }


    render() {
        return html`
            ${repeat([...this.game.stages].map(stage => stage.systems.getById('dom')).filter(dom => dom != null), (dom) => dom.stage.id, (dom) => dom.element)}
        `;
    }
}


customElements.define('rev-game', RevGameElement);

export class RevStageElement extends RevElement {
    static styles = [
        css`
            :host {
                display: flex;
                flex-direction: column;
                flex-grow: 1;
            }
        `
    ]

    /**
     * @type {Stage|null}
     */
    stage = null;

    render() {
        return html`<slot></slot>`;
    }
}


customElements.define('rev-stage', RevStageElement);

export class DOMSystem extends System.Typed({
    id: 'dom',
    models: {}
}) {

    element = document.createElement('rev-stage').initProperties({ stage: this.stage });

    /**
     * @template {keyof HTMLElementTagNameMap} T
     * @template {System} S
     * @param {S} system
     * @param {T} tag
     */
    createSystemElement(system, tag) {
        const element = document.createElement(tag);

        Object.assign(element, { system });

        return /** @type {HTMLElementTagNameMap[T] & { system: S }} */(this.element.appendChild(element));
    }
}

/** @satisfies {SystemBundle} */
export const bundle = {
    systems: [DOMSystem],
}

export * from 'revelryengine/deps/lit.js';
