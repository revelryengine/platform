import { html, css, repeat, LitElement  } from '../deps/lit.js';
import { Game, Stage } from '../deps/ecs.js';

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
     * @template {import('../deps/ecs.js').Watchable} Z
     * @template {Z extends import('../deps/ecs.js').Watchable<infer E extends import('../deps/ecs.js').WatchableEventMap> ? E : never} T
     * @template {import('../deps/ecs.js').Watchable<T>} W
     *
     * Watch for all events
     * @overload
     * @param {W} watchable
     * @param {import('../deps/ecs.js').WatchableWildCardImmediateHandler<T>} handler
     * @param {undefined} [options]
     * @return {void}
     *
     * Watch for all events and dispatch immediately.
     * @overload
     * @param {W} watchable
     * @param {import('../deps/ecs.js').WatchableWildcardDeferredOptions<T>} options
     * @return {void}
     *
     * Watch for all events
     * @overload
     * @param {W} watchable
     * @param {import('../deps/ecs.js').WatchableWildcardImmediateOptions<T>} options
     * @return {void}
     *
     * Watch for events of a specific type
     * @template {keyof T} K
     * @overload
     * @param {W} watchable
     * @param {K} type
     * @param {import('../deps/ecs.js').WatchableAnyOptions<T, K>} options
     * @return {void}
     *
     * @param {W} watchable
     * @param {import('../deps/ecs.js').WatchableAnyType<T>}    anyType
     * @param {import('../deps/ecs.js').WatchableAnyOptions<T>} [anyOptions]
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
     * @template {import('../deps/ecs.js').Watchable} Z
     * @template {Z extends import('../deps/ecs.js').Watchable<infer E extends import('../deps/ecs.js').WatchableEventMap> ? E : never} T
     * @template {import('../deps/ecs.js').Watchable<T>} W
     *
     * @overload
     * @param {W} watchable
     * @param {import('../deps/ecs.js').WatchableWildCardImmediateHandler<T>} handler
     * @return {void}
     *
     * @overload
     * @param {W} watchable
     * @param {import('../deps/ecs.js').WatchableWildcardDeferredOptions<T>} options
     * @return {void}
     *
     * @overload
     * @param {W} watchable
     * @param {import('../deps/ecs.js').WatchableWildcardImmediateOptions<T>} options
     * @return {void}
     *
     * @template {keyof T} K
     * @overload
     * @param {W} watchable
     * @param {K} type
     * @param {import('../deps/ecs.js').WatchableAnyOptions<T, K>} options
     * @return {void}
     *
     * @param {W} watchable
     * @param {import('../deps/ecs.js').WatchableAnyType<T>}    anyType
     * @param {import('../deps/ecs.js').WatchableAnyOptions<T>} [anyOptions]
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
     * @param {string} selector
     */
    closestComposed(selector) {
        /** @type {Element|undefined} */

        let element = this;
        while(element && 'closest' in element) {
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
     * Initializes the element part attribute
     *
     * @param {string} part
     */
    initPart(part) {
        this.part.add(part);
        return this;
    }

    /**
     * @param {import('../deps/lit.js').CSSResultOrNative} styleSheet
     * @param {CSSStyleSheet[]} [adoptedStyleSheets]
     */
    appendStyleSheet(styleSheet, adoptedStyleSheets = /** @type {ShadowRoot} */(this.shadowRoot).adoptedStyleSheets) {
        const style = /** @type {CSSStyleSheet} */(styleSheet instanceof CSSStyleSheet ? styleSheet : styleSheet.styleSheet);
        if(!adoptedStyleSheets.includes(style)) {
            adoptedStyleSheets.push(style);
        }
    }

    /**
     * @param {import('../deps/lit.js').CSSResultOrNative} styleSheet
     * @param {CSSStyleSheet[]} [adoptedStyleSheets]
     */
    removeStyleSheet(styleSheet, adoptedStyleSheets = /** @type {ShadowRoot} */(this.shadowRoot).adoptedStyleSheets) {
        const style = /** @type {CSSStyleSheet} */(styleSheet instanceof CSSStyleSheet ? styleSheet : styleSheet.styleSheet);
        if(adoptedStyleSheets.includes(style)) {
            adoptedStyleSheets.splice(adoptedStyleSheets.indexOf(style), 1);
        }
    }
}



/**
 * @typedef {{
 *  meta: {
 *      name:        string,
 *      description: string,
 *  },
 *  stages: Record<string, string>
 * }} GameFile //.revgam
 */

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
    * @type {AbortController|null}
    */
    #abortCtrl = null;

    #src = '';

    /** @type {(() => any)|null} */
    onload = null;

    constructor() {
        super();
        this.game = new Game({ element: this });
        this.src  = '';

        queueMicrotask(() => {
            if(this.src) this.loadGameFile(this.src);
        });
    }

    connectedCallback() {
        super.connectedCallback();

        this.watch(this.game, 'node:add',    () => this.requestUpdate());
        this.watch(this.game, 'node:delete', () => this.requestUpdate());
    }

    /**
    * @param {import('../deps/lit.js').PropertyValues<this>} changedProperties
    */
    updated(changedProperties) {
        if(changedProperties.has('src')) {
            if(this.src) {
                if(changedProperties.get('src') !== this.src) this.loadGameFile(this.src);
            } else {
                this.#abortCtrl?.abort();
                this.#abortCtrl = null;
            }
        }
    }

    /**
    * Fetchs a game file and adds the stages to the game. It will also clear any existing stages.
    * @param {string} src
    */
    async loadGameFile(src) {
        if(src === this.#src) return;

        this.#src = src;

        this.#abortCtrl?.abort();
        this.#abortCtrl = new AbortController();

        this.game.pause();
        this.game.stages.clear();

        try {
            const gameFileURL = import.meta.resolve(new URL(src, window.location.href).toString());
            const gameFile    = /** @type {GameFile} */(await fetch(gameFileURL, { signal: this.#abortCtrl.signal }).then(res => res.json()));

            const stages = await Promise.all(Object.entries(gameFile.stages).map(([id, path]) => {
                return new Promise((resolve, reject) => {
                    const element = document.createElement('rev-stage');

                    element.src = import.meta.resolve(new URL(path, gameFileURL).toString());
                    element.part.add('rev-stage', id);

                    element.onload = () => {
                        element.stage.id = id;
                        resolve(element.stage);
                    };

                    element.onerror = reject;

                    this.#abortCtrl?.signal.addEventListener('abort', (e) => {
                        element.src = '';
                        reject(new DOMException('Aborted', 'abort'));
                    });
                });
            }));

            for(const stage of stages) {
                this.game.stages.add(stage);
            }

            this.game.start();

            this.onload?.();
        } catch (e) {
            if (e instanceof DOMException && e.name == "AbortError") {
                this.game.stages.clear();
            } else if(e instanceof SyntaxError) {
                console.warn(e);
                this.onerror?.('Failed to parse game file');
            } else {
                console.warn(e);
                this.onerror?.('Unknown error');
            }
        }
        this.#abortCtrl = null;
    }

    render() {
        return html`
            ${repeat([...this.game.stages].filter(stage => stage.element), (stage) => stage.id, (stage) => stage.element)}
        `;
    }
}


customElements.define('rev-game', RevGameElement);

/**
 * @typedef {{
 *  meta: {
 *      name:        string,
 *      description: string,
 *  },
 *  systems: string[],
 *  components: Revelry.ECS.ComponentJSON[],
 * }} StageFile //.revstg
 */

export class RevStageElement extends RevElement {
    static properties = {
        stage: { type: Stage },
        src:   { type: String, reflect: true },
    }

    static styles = [
        css`
            :host {
                display: flex;
                flex-grow: 1;
            }
        `
    ]

    /**
    * @type {AbortController|null}
    */
    #abortCtrl = null;

    #src = '';

    /** @type {(() => any)|null} */
    onload = null;

    constructor() {
        super();
        this.stage = new Stage({ element: this });
        this.src   = '';

        queueMicrotask(() => {
            if(this.src) this.loadStageFile(this.src);
        });
    }

    connectedCallback() {
        super.connectedCallback();

        this.watch(this.stage, 'system:add',    () => this.requestUpdate());
        this.watch(this.stage, 'system:delete', () => this.requestUpdate());
    }

    /**
    * @param {import('../deps/lit.js').PropertyValues<this>} changedProperties
    */
    updated(changedProperties) {
        if(changedProperties.has('src')) {
            if(this.src) {
                if(changedProperties.get('src') !== this.src) this.loadStageFile(this.src);
            } else {
                this.#abortCtrl?.abort();
                this.#abortCtrl = null;
            }
        }
    }

    /**
    * Fetchs a stage file and adds the systems to the game. It will also clear any existing systems.
    * @param {string} src
    */
    async loadStageFile(src) {
        if(src === this.#src) return;

        this.#src = src;

        this.#abortCtrl?.abort();
        this.#abortCtrl = new AbortController();

        this.stage.systems.clear();

        try {
            const stageFileURL = import.meta.resolve(new URL(src, window.location.href).toString());
            const stageFile    = /** @type {StageFile} */(await fetch(stageFileURL).then(res => res.json()));

            const systemModules = await Promise.all(stageFile.systems.map(system => {
                return import(new URL(system, stageFileURL).toString());
            }));

            if(this.#abortCtrl.signal.aborted) {
                throw new DOMException('Aborted', 'abort');
            }

            for(const systemModule of systemModules) {
                const { bundle: { systems, initializers } } = /** @type {{ bundle: { systems?: typeof import('../deps/ecs.js').System[], initializers?: Revelry.ECS.ComponentInitializers  } }} */(systemModule);

                if(initializers) {
                    Object.assign(this.stage.initializers, initializers);
                }

                if(systems) {
                    for(const System of systems) {
                        const system = new System();
                        system.element?.part.add('rev-system', system.id);
                        this.stage.systems.add(system);
                    }
                }

            }

            for(const component of stageFile.components) {
                this.stage.components.add(component);
            }

            this.onload?.()
        } catch(e) {
            if (e instanceof DOMException && e.name == 'AbortError') {
                this.stage.systems.clear();
            } else if(e instanceof SyntaxError) {
                console.warn(e);
                this.onerror?.('Failed to parse stage file');
            } else {
                console.warn(e);
                this.onerror?.('Unknown error');
            }
        }

        this.#abortCtrl = null;
    }

    render() {
        return html`
            ${repeat([...this.stage.systems].filter(system => system.element), (system) => system.id, (system) => system.element)}
        `;
    }
}


customElements.define('rev-stage', RevStageElement);

export * from '../deps/lit.js';
